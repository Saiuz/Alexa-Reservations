/**
 * Controller for the Guest Modal form. The Guest Modal form manages CRUD operations for the Guest collection.
 * The form utilizes the angular bootstrap ui Modal directive.
 * Data is passed to the controller via the 'modalParams' object injected into the controller. The object must have
 * two parameters:
 *    modalParams.mode - A string value starting with 'C', 'R', 'U', or 'D'. This determines the operational mode
 *                       of the form and is not case sensitive.
 *    modalParams.data - A property that identifies the instance of the Guest collection to work with or an optional
 *                       guest name that will be parsed into name parts and placed in the salutation, first and last
 *                       name inputs when creating a new instance (mode 'C'). Which name fields get populated depend
 *                       on the number of words in the name provided.
 *
 * Successful closing of the form returns the Guest instance or the id of the Guest instance in the case of a delete
 * operation.
 *
 * The form is activated, and any returned results are handled by the following code:
 *        var modalInstance = $modal.open({
 *                     templateUrl: './templates/guestFormModal.html',
 *                     controller: 'GuestFormModalCtrl',
 *                     size: size,
 *                     resolve: {
 *                       modalParams: function () {
 *                         return {data: 'Dr. John Doe', mode: 'Create'};
 *                       }
 *                     }
 *                   });
 *
 *        modalInstance.result.then(function (result) {
 *                     // handle result which is the instance of the Firm collection the modal form worked with.
 *                     // in the case of the delete ('d' mode), the id of the deleted instance is returned.
 *                   });
 *
 * todo - work out delete logic - if we delete, should we add more info to reservation guest object for old reservations?
 */
define(['./module'], function (controllers) {
  'use strict';

  controllers.controller('GuestFormModalCtrl',
      ['$scope',
        '$modalInstance',
        'modalParams',
        'Guest',
        'dbEnums',
        'configService',
        function ($scope, $modalInstance, modalParams, Guest, dbEnums, configService) {
          console.log("guestFormModal controller fired")
          $scope.err = '';
          $scope.errSHow= false;
          $scope.saveTxt = configService.loctxt.add;
          $scope.cancelTxt = configService.loctxt.cancel;
          $scope.txt = configService.loctxt;
          $scope.deleteMode = false;
          $scope.confirmed = false;

          // needed for select for salutation field
          var sal = [
            {value: 0, name: '***'}
          ];
          var s = dbEnums.getSalutationEnum();
          var ix = 1;
          angular.forEach(s, function (item) {
            sal.push({value: ix, name: item});
            ix++;
          });
          $scope.salutations = sal;
          $scope.selSalutation = sal[0];
          $scope.salutationChanged = function () {
            if ($scope.selSalutation.value === 0) {
              $scope.guest.salutation = '';
            }
            else {
              $scope.guest.salutation = $scope.selSalutation.name;
            }
          };

          // Determine CRUD mode of form.
          // For all but 'C' the query can be by id or by the unique_name property.
          var mode = modalParams.mode.substring(0, 1).toLowerCase();
          var qry = parseInt(modalParams.data) ? {'_id': modalParams.data} : {'unique_name': modalParams.data};
          switch (mode) {
            case 'c':
              $scope.title = configService.loctxt.guest_titleCreate;
              $scope.edit = true;
              $scope.guest = new Guest();
              switch (modalParams.data.length) {
                case 1:
                  $scope.guest.last_name = modalParams.data[0];
                  break;
                case 2:
                  $scope.guest.first_name = modalParams.data[0];
                  $scope.guest.last_name = modalParams.data[1];
                  break;
                case 3:
                  //try to match salutation
                  for (var i = 0; i < sal.length; i++) {
                    if (sal[i].name === modalParams.data[0]) {
                      break;
                    }
                  }
                  $scope.selSalutation = sal[i];
                  $scope.guest.first_name = modalParams.data[1];
                  $scope.guest.last_name = modalParams.data[2];
                  break;
              }
              break;
            case 'r':
              $scope.title = configService.loctxt.guest_titleRead;
              Guest.findOne(qry, function (err, guest) {
                if (err) {
                  $scope.err = err;
                  $scope.errShow = true;
                }
                else {
                  if (guest){
                  $scope.guest = guest;
                  $scope.bdate1 = guest.birthday;
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
              $scope.title = configService.loctxt.guest_titleUpdate;
              Guest.findOne(qry, function (err, guest) {
                if (err) {
                  $scope.err = err;
                  $scope.errShow = true;
                }
                else {
                  if (guest) {
                    $scope.guest = guest;
                    $scope.bdate1 = guest.birthday;
                    $scope.edit = true;
                    $scope.read = false;
                    $scope.saveTxt = configService.loctxt.update;
                  }
                  else {
                    $scope.err = configService.loctxt.item_notFound;
                    $scope.errShow = true;
                  }
                  $scope.$apply();
                }
              });
              break

            case 'd':
              $scope.title = configService.loctxt.guest_titleDelete;
              Guest.findOne(qry, function (err, guest) {
                if (err) {
                  $scope.err = err;
                  $scope.errShow = true;
                }
                else {
                  if (guest){
                    $scope.guest = guest;
                    $scope.bdate1 = guest.birthday;
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


          // need to separate the birthday date fields from the model. When the date picker is linked to the
          // model date fields, the German date format entry created strange behavior, even with the datepicker fix.
          // we now watch for a change in the birthday date field and when we have a valid date, we update
          // the Mongoose model.
          $scope.bdate1 = undefined;
          $scope.$watch('bdate1', function(newVal){
            console.log("bdate1 watch fired " + newVal);
             if (newVal !== undefined) {
                 $scope.guest.birthday = newVal;
               //}
             }
          });

          // for date pickers
          $scope.openBday1 = function ($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.openedBday1 = true;
            //$scope.openEnd = false;
          };
          $scope.openBday2 = function ($event) {
            $event.preventDefault();
            $event.stopPropagation();
            scope.openedBday2 = true;
            //$scope.openStart=false;
          };
          $scope.dateOptions = {
            formatYear: 'yy',
            startingDay: 1,
            showWeeks: false,
            currentText: 'Heute',
            closeText: 'OK'
          };
          $scope.dateFormat = "dd.MM.yyyy";


          // modal button click methods
          $scope.save = function () {
            //perform any pre save form validation here
            //save guest and return
            $scope.guest.save(function (err) {
              if (err) {
                console.log('Guest save error: ' + err);
                $scope.err = err;
                $scope.errShow = true;
                $scope.$apply();
              }
              else {
                console.log('New Guest saved: ' + $scope.guest._id.id)
                $modalInstance.close($scope.guest);
              }
            });
          };

          // Delete btn handler
          $scope.delete = function (err) {
            if (err){
              console.log('Guest delete error: ' + err);
              $scope.err = err;
              $scope.errShow = true;
              $scope.$apply();
            }
            else {
              var id = $scope.guest._id.id;
              $scope.guest.remove(function(err) {
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