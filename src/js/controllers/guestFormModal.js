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
 * For 'C', 'U' and 'D' operations, successful completion, after pressing the save button, the form will display a
 * success message then automatically close after a pre-defined delay. The form will return the new or updated
 * instance object. In the case of a delete operation, the _id of the deleted object will be returned.
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
        '$timeout',
        'utility',
        function ($scope, $modalInstance, modalParams, Guest, dbEnums, configService, $timeout, utility) {
          console.log("guestFormModal controller fired");
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
          $scope.bdate1 = undefined;
          $scope.bdate2 = undefined;

          $scope.firmPrice = 0; // required by firm lookup but not used in this form.
          $scope.salutations = dbEnums.getSalutationEnum();

          // Determine CRUD mode of form.
          // For all but 'C' the query can be by id or by the unique_name property.
          var mode = modalParams.mode.substring(0, 1).toLowerCase();
          var qry = parseInt(modalParams.data) ? {'_id': parseInt(modalParams.data)} : {'unique_name': modalParams.data};
          var notFound = configService.loctxt.guest + ' "' + modalParams.data + '" ' + configService.loctxt.notFound;
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
                  for (var i = 0; i < $scope.salutations.length; i++) {
                    if ($scope.salutations[i] === modalParams.data[0]) {
                      $scope.guest.salutation = $scope.salutations[i];
                      break;
                    }
                  }
                  $scope.guest.first_name = modalParams.data[1];
                  $scope.guest.last_name = modalParams.data[2];
                  break;
              }
              break;
            case 'r':
              $scope.title = configService.loctxt.guest_titleRead;
              Guest.findOne(qry, function (err, guest) {
                if (err) {
                  $scope.err = new utility.errObj(err);
                  $scope.errLoad = true;
                }
                else {
                  if (guest) {
                    $scope.guest = guest;
                    $scope.bdate1 = guest.birthday;
                    $scope.bdate2 = guest.birthday_partner;
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
              $scope.title = configService.loctxt.guest_titleUpdate;
              Guest.findOne(qry, function (err, guest) {
                if (err) {
                  $scope.err = new utility.errObj(err);
                  $scope.errLoad = true;
                }
                else {
                  if (guest) {
                    $scope.guest = guest;
                    $scope.bdate1 = guest.birthday;
                    $scope.bdate2 = guest.birthday_partner;
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
              $scope.title = configService.loctxt.guest_titleDelete;
              Guest.findOne(qry, function (err, guest) {
                if (err) {
                  $scope.err = new utility.errObj(err);
                  $scope.errLoad = true;
                }
                else {
                  if (guest) {
                    $scope.guest = guest;
                    $scope.bdate1 = guest.birthday;
                    $scope.bdate2 = guest.birthday_partner;
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


          // need to separate the birthday date fields from the model. When the date picker is linked to the
          // model date fields, the German date format entry created strange behavior, even with the datepicker fix.
          // we now watch for a change in the birthday date field and when we have a valid date, we update
          // the Mongoose model.
          $scope.$watchCollection('[bdate1, bdate2]', function (newVals) {
            console.log("bdate watch fired " + newVals);
            if (newVals[0] !== undefined) {
              $scope.guest.birthday = newVals[0];
            }
            if (newVals[1] !== undefined) {
              $scope.guest.birthday_partner = newVals[1];
            }
          });

          // for date pickers
          $scope.openBday1 = function ($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.openedBday1 = true;
            //$scope.openEnd = false;
          };
          // for date pickers
          $scope.openBday2 = function ($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.openedBday2 = true;
            //$scope.openEnd = false;
          };

          $scope.dateOptions = {
            formatYear: 'yy',
            startingDay: 1,
            showWeeks: false,
            currentText: 'Heute',
            closeText: 'OK'
          };
          $scope.dateFormat = "dd.MM.yyyy";

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
            //perform any pre save form validation here
            // if the salutation contains '' then set the salutation field to undefined
            if ($scope.guest.salutation === '') {
              $scope.guest.salutation = undefined;
            }
            //save guest and return
            $scope.guest.save(function (err) {
              if (err) {
                console.log('Guest save error: ' + err);
                $scope.err = err;
                $scope.errSave = true;
                $scope.$apply();
              }
              else {
                var msg = (mode === 'c' ? configService.loctxt.guest + configService.loctxt.success_saved :
                    configService.loctxt.success_changes_saved);
                autoClose(msg, $scope.guest);
              }
            });
          };

          // Delete btn handler
          $scope.delete = function () {
            var id = $scope.guest._id.id;
            $scope.guest.remove(function (err) {
              if (err) {
                console.log('Guest delete error: ' + err);
                $scope.err = new utility.errObj(err);
                $scope.errSave = true;
                $scope.$apply();
              }
              else {
                var msg = configService.loctxt.guest + configService.loctxt.success_deleted;
                autoClose(msg, id);
              }
            });
          };

          // Cancel btn handler
          $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
          };

          // Error msg close handler
          $scope.hideErr = function () {
            $scope.errSave = false;
          };

        }]);
});