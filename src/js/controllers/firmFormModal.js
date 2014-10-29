/**
 * Controller for the Firm Modal form. The Firm Modal form manages CRUD operations for the Firm collection.
 * The form utilizes the angular bootstrap ui Modal directive.
 * Data is passed to the controller via the 'modalParams' object injected into the controller. The object must have
 * two parameters:
 *    modalParams.mode - A string value starting with 'C', 'R', 'U', or 'D'. This determines the operational mode
 *                       of the form and is not case sensitive.
 *    modalParams.data - A property that identifies the instance of the Firm collection to work with or an optional
 *                       firm name that will be placed in the firm_name input when creating a new instance (mode 'C').
 *
 * Successful closing of the form returns the Firm instance or the id of the Firm instance in the case of a delete
 * operation.
 *
 * The form is activated, and any returned results are handled by the following code:
 *        var modalInstance = $modal.open({
 *                     templateUrl: './templates/firmFormModal.html',
 *                     controller: 'FirmFormModalCtrl',
 *                     size: size,
 *                     resolve: {
 *                       modalParams: function () {
 *                         return {data: 'Test Firm', mode: 'Create'};
 *                       }
 *                     }
 *                   });
 *
 *        modalInstance.result.then(function (result) {
 *                     // handle result which is the instance of the Firm collection the modal form worked with.
 *                     // in the case of the delete ('d' mode), the id of the deleted instance is returned.
 *                   });
 *
 */
define(['./module'], function (controllers) {
  'use strict';

  controllers.controller('FirmFormModalCtrl',
      ['$scope',
        '$modalInstance',
        'modalParams',
        'Firm',
        'configService',
        function ($scope, $modalInstance, modalParams, Firm, configService) {
          console.log("FirmFormModal controller fired")
          $scope.err = '';
          $scope.errSHow= false;
          $scope.saveTxt = configService.loctxt.add;
          $scope.cancelTxt = configService.loctxt.cancel;
          $scope.txt = configService.loctxt;
          $scope.deleteMode = false;
          $scope.confirmed = false;

          // Determine CRUD mode of form.
          // For all but 'C' the query can be by id or by the firm_name property which is also unique.
          var mode = modalParams.mode.substring(0, 1).toLowerCase();
          var qry = parseInt(modalParams.data) ? {'_id': modalParams.data} : {'firm_name': modalParams.data};
          switch (mode) {
            case 'c':
              $scope.title = configService.loctxt.firm_titleCreate;
              $scope.firm = new Firm();
              $scope.firm.contact = {name: '', phone: '', email: ''};
              $scope.firm.firm_name = modalParams.data;
              $scope.edit = true;
              $scope.read = false;
              break;
            case 'r':
              $scope.title = configService.loctxt.firm_titleRead;
              Firm.findOne(qry, function (err, firm) {
                if (err) {
                  $scope.err = err;
                  $scope.errShow = true;
                }
                else {
                  if (firm) {
                    $scope.firm = firm;
                    $scope.edit = false;
                    $scope.read = true;
                    $scope.cancelTxt = configService.loctxt.close;
                  }
                  else {
                    $scope.err = configService.loctxt.item_notFound;
                    $scope.errShow = true;
                  }
                  $scope.$apply();
                }
              });
              break;
            case 'u':
              $scope.title = configService.loctxt.firm_titleUpdate;
              Firm.findOne(qry, function (err, firm) {
                if (err) {
                  $scope.err = err;
                  $scope.errShow = true;
                }
                else {
                  if (firm) {
                  $scope.firm = firm;
                  $scope.edit = true;
                  $scope.read = false;
                  $scope.saveTxt = configService.loctxt.update;
                  }
                  else {
                    $scope.err = configService.loctxt.item.notFound;
                    $scope.errShow = true;
                  }
                  $scope.$apply();
                }
              });
              break;
            case 'd':
              $scope.title = configService.loctxt.firm_titleDelete;
              Firm.findOne(qry, function (err, firm) {
                if (err) {
                  $scope.err = err;
                  $scope.errShow = true;
                }
                else {
                  if (firm) {
                    $scope.firm = firm;
                    $scope.edit = false;
                    $scope.read = true;
                    $scope.deleteMode = true;
                    $scope.cancelTxt = configService.loctxt.close;
                    $scope.saveTxt = configService.loctxt.delete;
                  }
                  else {
                    $scope.err = configService.loctxt.item_notFound;
                    $scope.errShow = true;
                  }
                  $scope.$apply();
                }
              });
              break;
          }

          // modal button click methods
          $scope.save = function () {
            //perform any pre save form validation here
            //save/update firm and return
            $scope.firm.save(function (err) {
              if (err) {
                console.log('Firm save error: ' + err);
                $scope.err = err;
                $scope.errShow = true;
                $scope.$apply();
              }
              else {
                console.log('Firm, saved: ' + $scope.firm._id.id)
                $modalInstance.close($scope.firm);
              }
            });
          };

          // Delete btn handler
          $scope.delete = function (err) {
            if (err){
              console.log('Firm delete error: ' + err);
              $scope.err = err;
              $scope.errShow = true;
              $scope.$apply();
            }
            else {
              var id = $scope.firm._id.id;
              $scope.firm.remove(function(err) {
                $modalInstance.close(id);
              });
            }
          };

          // Cancel btn handler
          $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
          };

          // Error msg close handler
          $scope.hideErr = function() {
            $scope.errShow = false;
          };
        }]);
});