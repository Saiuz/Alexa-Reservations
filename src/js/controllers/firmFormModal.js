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
 * For 'C', 'U' and 'D' operations, successful completion, after pressing the save button, the form will display a
 * success message then automatically close after a pre-defined delay. The form will return the new or updated
 * instance object. In the case of a delete operation, the _id of the deleted object will be returned.
 *
 * The form is activated, and any returned results are handled by the following code:
 *        var modalInstance = $modal.open({
 *                     templateUrl: './templates/firmFormModal.html',
 *                     controller: 'firmFormModalCtrl',
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
        'dashboard',
        'configService',
        '$timeout',
        'utility',
        function ($scope, $modalInstance, modalParams, Firm, dashboard, configService, $timeout, utility) {
          console.log("FirmFormModal controller fired");

          $scope.err = {};
          $scope.errSave = false;
          $scope.errLoad = false;
          $scope.hide = false;
          $scope.actionMsg = '';
          $scope.saveTxt = configService.loctxt.add;
          $scope.cancelTxt = configService.loctxt.cancel;
          $scope.txt = configService.loctxt;
          $scope.deleteMode = false;
          $scope.confirmed = false;
          $scope.roomPrice = undefined; //Since we must manipulate the number (convert from de to en numbers), we can't connect to the DB model directly

          // Determine CRUD mode of form.
          // For all but 'C' the query can be by id or by the firm_name property which is also unique.
          var mode = modalParams.mode.substring(0, 1).toLowerCase();
          var qry = parseInt(modalParams.data) ? {'_id': parseInt(modalParams.data)} : {'firm_name': modalParams.data};
          var notFound = configService.loctxt.firm + ' "' + modalParams.data + '" ' + configService.loctxt.notFound;
          var lastFirm = '';

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
                  $scope.err = new utility.errObj(err);
                  $scope.errLoad = true;
                }
                else {
                  if (firm) {
                    $scope.firm = firm;
                    $scope.roomPrice = firm.room_price;
                    $scope.edit = false;
                    $scope.read = true;
                    $scope.cancelTxt = configService.loctxt.close;
                  }
                  else {
                    $scope.err = new utility.errObj(notFound);
                    $scope.errLoad = true;
                  }
                  $scope.$apply();
                }
              });
              break;
            case 'u':
              $scope.title = configService.loctxt.firm_titleUpdate;
              Firm.findOne(qry, function (err, firm) {
                if (err) {
                  $scope.err = new utility.errObj(err);
                  $scope.errLoad = true;
                }
                else {
                  if (firm) {
                    lastFirm = firm.firm_name;
                    $scope.firm = firm;
                    $scope.roomPrice = firm.room_price;
                    $scope.edit = true;
                    $scope.read = false;
                    $scope.saveTxt = configService.loctxt.update;
                  }
                  else {
                    $scope.err = new utility.errObj(notFound);
                    $scope.errLoad = true;
                  }
                  $scope.$apply();
                }
              });
              break;
            case 'd':
              $scope.title = configService.loctxt.firm_titleDelete;
              Firm.findOne(qry, function (err, firm) {
                if (err) {
                  $scope.err = new utility.errObj(err);
                  $scope.errLoad = true;
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
                    $scope.err = new utility.errObj(notFound);
                    $scope.errLoad = true;
                  }
                  $scope.$apply();
                }
              });
              break;
          }

          // listen to changes in price
          $scope.$watch('roomPrice', function(newval) {
             if (newval) {
               $scope.firm.room_price = Number(newval);
             }
          });

          // auto close after successful action methods
          var timer = null; // used for timer to auto close modal after a delay when a C, U or D operation occurs
          var autoClose = function (msg, val) {
            $scope.hide = true;
            $scope.actionMsg = msg;
            $scope.$apply();
            timer = $timeout(function () {
              $modalInstance.close(val);
            }, configService.constants.autoCloseTime)
          };

          // modal button click methods
          // save button handler
          $scope.save = function () {
            //perform any pre save form validation or logic here
            // If we change the name of the firm, then we must update the guests that are
            // associated with the previous firm name!
            // TODO-NOTE: by updating guest firm field, the unique name does not get regenerated. Need to find all firms then modify and save each!!!
            var nameChanged = lastFirm && (lastFirm !== $scope.firm.firm_name),
                msg = '';

            //save/update firm and return
            $scope.firm.save(function (err) {
              if (err) {
                console.log('Firm save error: ' + err);
                $scope.err = new utility.errObj(err);
                $scope.errSave = true;
                $scope.$apply();
              }
              else {
                if (nameChanged) {
                  dashboard.updateFirmInGuests(lastFirm, $scope.firm.firm_name).then(function (numAffected) {
                        msg = configService.loctxt.success_changes_saved + ' ' + numAffected + ' ' + configService.loctxt.guests;
                        autoClose(msg, $scope.firm);
                      },
                      function (err) {
                        console.log('Guest update error: ' + err);
                        $scope.err = new utility.errObj(err);
                        $scope.errSave = true;
                        $scope.$apply();
                      });
                }
                else {
                  msg = (mode === 'c' ? configService.loctxt.firm + configService.loctxt.success_saved :
                      configService.loctxt.success_changes_saved);
                  autoClose(msg, $scope.firm);
                }

              }
            });
          };

          // Delete btn handler
          $scope.delete = function (err) {
            var id = $scope.firm._id.id;
            $scope.firm.remove(function (err) {
              if (err) {
                console.log('Firm delete error: ' + err);
                $scope.err = new utility.errObj(err);
                $scope.errSave = true;
                $scope.$apply();
              }
              else {
                var msg = configService.loctxt.firm + configService.loctxt.success_deleted;
                autoClose(msg, id);
              }
            });
          };

          // Cancel btn handler
          $scope.cancel = function () {
            if (timer) {
              $timeout.cancel(timer);
            }
            $modalInstance.dismiss('cancel');
          };

          // Error msg close handler for save/delete error only
          $scope.hideErr = function () {
            $scope.errSave = false;
          };
        }]);
});