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
 *        let modalInstance = $modal.open({
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

  controllers.controller('GuestFormModalCtrl', ['$scope',
    '$rootScope',
    '$modalInstance',
    'modalParams',
    'Guest',
    'Reservation',
    'dbEnums',
    'configService',
    'modalUtility',
    function ($scope, $rootScope, $modalInstance, modalParams, Guest, Reservation, dbEnums, configService, utility) {
      console.log("guestFormModal controller fired");

      let helpers = new utility.Helpers($scope, $modalInstance);
      let oldName = '';
      $scope.actionMsg = '';
      $scope.saveTxt = configService.loctxt.add;
      $scope.cancelTxt = configService.loctxt.cancel;
      $scope.txt = configService.loctxt;
      $scope.deleteMode = false;
      $scope.confirmed = false;
      $scope.bdate1 = undefined;
      $scope.bdate2 = undefined;
      $scope.disableFirm = modalParams.extraData.disableFirm || false;
      $scope.firmPrice = 0; // required by firm lookup but not used in this form.
      $scope.salutations = dbEnums.getSalutationEnum();

      // Determine CRUD mode of form.
      // For all but 'C' the query can be by id or by the unique_name property.
      const mode = modalParams.mode.substring(0, 1).toLowerCase();
      const qry = typeof (modalParams.data) === 'object' ? {
        '_id': modalParams.data
      } : {
        'unique_name': modalParams.data
      };
      const notFound = configService.loctxt.guest + ' "' + modalParams.data + '" ' + configService.loctxt.notFound;
      switch (mode) {
        case 'c':
          $scope.title = configService.loctxt.guest_titleCreate;
          $scope.edit = true;
          $scope.guest = new Guest();
          if (modalParams.extraData.firm) {
            $scope.guest.firm = modalParams.extraData.firm;
          }
          switch (modalParams.data.length) { //pre-populate name fields from input parameters
            case 1:
              $scope.guest.last_name = modalParams.data[0];
              break;
            case 2:
              $scope.guest.first_name = modalParams.data[0];
              $scope.guest.last_name = modalParams.data[1];
              break;
            case 3:
              //try to match salutation
              for (let i = 0; i < $scope.salutations.length; i++) {
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
          Guest.findOne(qry).then((guest) => {
            if (guest) {
              $scope.guest = guest;
              $scope.bdate1 = guest.birthday;
              $scope.bdate2 = guest.birthday_partner;
              $scope.edit = false;
              $scope.read = true;
              $scope.cancelTxt = configService.loctxt.close;
              helpers.dApply();
            } else {
              helpers.showLoadErr(notFound);
            }
          }).catch(err => helpers.showLoadErr(err));
          break;

        case 'u':
          $scope.title = configService.loctxt.guest_titleUpdate;
          Guest.findOne(qry).then((guest) => {
            if (guest) {
              oldName = guest.name;
              $scope.guest = guest;
              $scope.bdate1 = guest.birthday;
              $scope.bdate2 = guest.birthday_partner;
              $scope.edit = true;
              $scope.read = false;
              $scope.saveTxt = configService.loctxt.update;
              helpers.dApply();
            } else {
              helpers.showLoadErr(notFound);
            }
          }).catch(err => helpers.showLoadErr(err));
          break;

        case 'd':
          $scope.title = configService.loctxt.guest_titleDelete;
          Guest.findOne(qry).then((guest) => {
            if (guest) {
              $scope.guest = guest;
              $scope.bdate1 = guest.birthday;
              $scope.bdate2 = guest.birthday_partner;
              $scope.edit = false;
              $scope.read = true;
              $scope.deleteMode = true;
              $scope.cancelTxt = configService.loctxt.close;
              $scope.saveTxt = configService.loctxt.delete;
              helpers.dApply();
            } else {
              helpers.showLoadErr(notFound);
            }
          }).catch(err => helpers.showLoadErr(err));
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

      //#region - modal button click methods
      // save button handler  Save the guest but then retrieve the guest object
      /**
       * Save button handler. Saves the guest object. If the name has been changed, then
       * it will update any existing, open (not checked out) reservations with the corrected
       * name.
       */
      $scope.save = function () {
        $scope.err = new utility.ErrObj();
        //perform the pre save form validation here
        // 12/17 - Now allowing for no salutation 
        // if (!$scope.guest.salutation || $scope.guest.salutation === '') {
        //   $scope.err.push(configService.loctxt.val_invalidSalutation);
        // }
        if (!$scope.guest.last_name) { //Must have a last name at least
          $scope.err.push(configService.loctxt.val_invalidLastName)
        }
        if ($scope.err.hasErrors()) {
          helpers.showSaveError();
          return;
        }
        //TODO - after guest saved, if name has changed update existing reservations with new guest names...
        //save guest and return
        $scope.guest.save().then(() => {
          let msg = (mode === 'c' ? configService.loctxt.guest + configService.loctxt.success_saved :
            configService.loctxt.success_changes_saved);
          $rootScope.$broadcast(configService.constants.resGuestEditedEvent, $scope.guest.id); //fire guestEdited event    

          //Update any reservations if needed
          if (oldName && $scope.guest.name !== oldName) {
            _updateResNames().then(() =>  helpers.autoClose(msg, $scope.guest)).catch((err) => helpers.showSaveError(err));
          } else {
            helpers.autoClose(msg, $scope.guest);
          }
        }).catch((err) => helpers.showSaveError(err));
      }

      // Delete btn handler
      $scope.delete = function () {
        let id = $scope.guest._id;
        $scope.guest.remove().then(() => {
          let msg = configService.loctxt.guest + configService.loctxt.success_deleted;
          helpers.autoClose(msg, id);
        }).catch((err) => helpers.showSaveError(err));
      };

      //#endregion

      //#region - private functions
      /**
       * Updates open reservations with a new name. that contain the old name. This method 
       * updates the guest fields in the reservation, as well as in the rooms, expenses and
       * bills document arrays. Note: I could not get the routine to work by finding all of 
       * the matching reservations then updating and saveing each one in the list. (second
       * update always failed with a version error). I had to first find all of the ids then
       * retrieve, modify and save each reservation separately.
       */
      async function _updateResNames() { 
        try {
          let guest = $scope.guest;
          //let nameParts = utility.parseNameString(guest.name);

          let res = await Reservation.find({ //Guest name field
            $and: [{
              checked_out: {
                $exists: false
              }
            }, {
              $or: [{"guest.id": guest._id},{"guest2.id": guest._id}]              
            }]
          }).lean().distinct('_id');
          for(let ix = 0; ix < res.length; ix++) {
            let r = await Reservation.findById(res[ix]);
            let resOldName;
            let newName = guest.name;
            if (r.guest.id.equals(guest._id)) {
              resOldName = r.guest.name;
              r.guest.name = newName;
            } else if (r.guest2 && r.guest2.id && r.guest2.id.equals(guest._id)) {
              resOldName = r.guest2.name;
              r.guest2.name = newName;
            }
            r.rooms.forEach((rm) => {
              if (rm.guest === resOldName) {
                rm.guest = newName;
              } else if (rm.guest2 === resOldName) {
                rm.guest2 = newName;
              }
            });
            r.expenses.forEach((ex) => {
              if (ex.guest === resOldName) {
                ex.guest = newName
              }
            });
            r.bill_numbers.forEach((bn) => {
              if (bn.guest === resOldName) {
                bn.guest = newName;
              }
            });
            await r.save();
          }
        } catch (err) {
          throw err;
        }
      }
      //#endregion          
    }
  ]);
});