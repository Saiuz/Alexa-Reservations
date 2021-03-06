/**
 * Controller for the Reservation Modal form. This Modal form manages CRUD operations for the Reservation collection.
 * The form utilizes the angular bootstrap ui Modal directive.
 * Data is passed to the controller via the 'modalParams' object injected into the controller. The object must have
 * two parameters:
 *    modalParams.mode - A string value starting with 'C', 'R', 'U', or 'D'. This determines the operational mode
 *                       of the form and is not case sensitive.
 *    modalParams.data - A property that identifies the instance of the Reservation collection to work with. For a
 *                       Reservation instance, that property is the reservation_number (not the _id). For the create
 *                       ('C') mode, the data property is ignored since the creation process generates a new and
 *                       unique reservation_number.
 *
 * For 'C', 'U' and 'D' operations, successful completion, after pressing the save button, the form will display a
 * success message then automatically close after a pre-defined delay. The form will return the new or updated
 * instance object. In the case of a delete operation, the reservation_number of the deleted object will be returned.
 *
 * The form is activated, and any returned results are handled by the following code:
 *        let modalInstance = $modal.open({
 *                     templateUrl: './templates/reservationFormModal.html',
 *                     controller: 'ReservationFormModalCtrl',
 *                     size: size,
 *                     resolve: {
 *                       modalParams: function () {
 *                         return {data: 1400105, mode: 'Update'};
 *                       }
 *                     }
 *                   });
 *
 *        modalInstance.result.then(function (result) {
 *                     // handle result which is the instance of the Firm collection the modal form worked with.
 *                     // in the case of the delete ('d' mode), the id of the deleted instance is returned.
 *                   });
 *
 * Note the form works with the reservationVM viewModel class to implement some specific UI business logic. The
 * reservationVM also implements some specific domain level business logic when an entity is saved.
 * Dec 01 2017 - Modified Group logic. There is no Group Business with individual bills. For that case, 
 */
define(['./module'], function (controllers) {
  'use strict';

  controllers.controller('ReservationFormModalCtrl', ['$scope',
    '$rootScope',
    '$modalInstance',
    'modalParams',
    'Reservation',
    'ReservationVM',
    'configService',
    'datetime',
    'modalUtility',
    function ($scope, $rootScope, $modalInstance, modalParams, Reservation, ReservationVM, configService, datetime, utility) {
      console.log("ReservationFormModal controller fired");

      let helpers = new utility.Helpers($scope, $modalInstance);
      $scope.actionMsg = '';
      $scope.saveTxt = configService.loctxt.add;
      $scope.cancelTxt = configService.loctxt.cancel;
      $scope.txt = configService.loctxt;
      $scope.deleteMode = false;
      $scope.confirmed = false;
      $scope.resourceCount = 0;
      $scope.txt = configService.loctxt;

      // Determine CRUD mode of form.
      // For all but 'C' the query can be by reservation_number property which is unique.
      let mode = modalParams.mode.substring(0, 1).toLowerCase(),
        resNumber = parseInt(modalParams.data), // ? {'_id': modalParams.data} : {'firm_name': modalParams.data};
        extraData = modalParams.extraData,
        executeWatch = false,
        firstLoad = false,
        start = modalParams.extraData ? modalParams.extraData.start : undefined,
        end = modalParams.extraData ? modalParams.extraData.end : undefined;

      switch (mode) {
        case 'c':
          $scope.title = configService.loctxt.reservation_titleCreate;
          $scope.edit = true;
          $scope.read = false;
          ReservationVM.newReservationVM(start, end).then((resVM) => { // start and end dates passed into VM factory constructor
            $scope.rvm = resVM;
            if (extraData) {
              $scope.title = extraData.room ? $scope.title + ' (' + configService.loctxt.selectedRoom + ' ' + extraData.room + ')' : $scope.title; //todo-can we figure out how to pre select room?
              $scope.start_date = new Date(resVM.res.start_date); // update scope properites for date pickers
              $scope.end_date = new Date(resVM.res.end_date);
              executeWatch = true;
            } else {
              $scope.start_date = new Date(resVM.res.start_date);
              $scope.end_date = new Date(resVM.res.end_date);
              executeWatch = true;
            }
            helpers.dApply();
          }).catch(err => helpers.showLoadErr(err));
          break;
        case 'r':
          $scope.title = configService.loctxt.reservation_titleRead;
          $scope.edit = false;
          $scope.read = true;
          $scope.cancelTxt = configService.loctxt.close;
          ReservationVM.getReservationVM(resNumber, true).then((resVM) => {
            $scope.rvm = resVM;
            helpers.dApply();
          }).catch(err => helpers.showLoadErr(err));
          break;

        case 'u':
          firstLoad = true;
          $scope.title = configService.loctxt.reservation_titleUpdate;
          ReservationVM.getReservationVM(resNumber).then((resVM) => {
            $scope.rvm = resVM;
            $scope.start_date = new Date(resVM.res.start_date);
            $scope.end_date = new Date(resVM.res.end_date);
            $scope.availableRooms = resVM.availableRooms;
            $scope.availableResources = resVM.availableResources;
            $scope.edit = true;
            $scope.read = false;
            $scope.saveTxt = configService.loctxt.update;
            executeWatch = true;
            helpers.dApply();
          }).catch(err => helpers.showLoadErr(err));
          break;

        case 'd':
          $scope.title = configService.loctxt.reservation_titleDelete;
          $scope.edit = false;
          $scope.read = true;
          $scope.deleteMode = true;
          $scope.cancelTxt = configService.loctxt.close;
          $scope.saveTxt = configService.loctxt.delete;
          ReservationVM.getReservationVM(resNumber, true).then((resVM) => {
            $scope.rvm = resVM;
            helpers.dApply();
          }).catch(err => helpers.showLoadErr(err));
          break;
      }

      //watch for changes in certain form fields. This logic deals with input changes that impact the available
      // rooms and resources. Since this logic requires a watch it is handled here not in the VM.
      let ignoreIndex = -1;
      $scope.$watchCollection('[start_date, end_date, rvm.nights, rvm.res.occupants, rvm.res.type, rvm.res.firm, rvm.res.guest.id, rvm.res.guest2.id]', function (newvars, oldvars) {
        console.log(">>>Watch collection fired " + executeWatch);
        if (executeWatch) {
          let varIndex = (oldvars[7] !== newvars[7]) ? 7 :
            (oldvars[6] !== newvars[6]) ? 6 :
            (oldvars[5] !== newvars[5]) ? 5 :
            (oldvars[4] !== newvars[4]) ? 4 :
            (oldvars[3] !== newvars[3]) ? 3 :
            (oldvars[2] !== newvars[2]) ? 2 :
            (oldvars[1] !== newvars[1]) ? 1 :
            (oldvars[0] !== newvars[0]) ? 0 : -1;
          console.log("***watch index: " + varIndex + ' ignore: ' + ignoreIndex);
          if (varIndex === -1 || varIndex === ignoreIndex) {
            ignoreIndex = -1;
            return;
          }
          let rdates = {};
          switch (varIndex) {
            case 0:
              console.log("start_date changed");
              ignoreIndex = 1; //end_date
              $scope.rvm.res.start_date = $scope.start_date;
              $scope.rvm.res.start_dse = datetime.daysSinceEpoch($scope.rvm.res.start_date);
              rdates = $scope.rvm.calculateEndDate($scope.rvm.res.start_date);
              $scope.rvm.res.end_date = rdates.end;
              $scope.rvm.res.end_dse = datetime.daysSinceEpoch($scope.rvm.res.end_date);
              $scope.end_date = rdates.end;
              $scope.rvm.updateAvailableRoomsAndResources().then((cnt) => {
                helpers.dApply();
              });

              break;

            case 1:
              console.log("end_date changed");
              ignoreIndex = 2; //nights
              $scope.rvm.res.end_date = $scope.end_date;
              $scope.rvm.res.end_dse = datetime.daysSinceEpoch($scope.rvm.res.end_date);
              $scope.rvm.calculateNights();
              $scope.rvm.updateAvailableRoomsAndResources().then((cnt) => {
                helpers.dApply();
              }).catch(err => helpers.showLoadErr(err));;
              break;

            case 2:
              console.log("nights changed ");
              ignoreIndex = 1; //end_date
              rdates = $scope.rvm.calculateEndDate($scope.rvm.res.start_date);
              $scope.rvm.res.end_date = rdates.end;
              $scope.rvm.res.end_dse = datetime.daysSinceEpoch($scope.rvm.res.end_date);
              $scope.end_date = rdates.end;
              $scope.rvm.updateAvailableRoomsAndResources().then((cnt) => {
                helpers.dApply();
              }).catch(err => helpers.showLoadErr(err));;
              break;

            case 3:
              console.log("occupants changed");
              ignoreIndex = -1; // no watched variables changed
              // check to see if the plan that is selected is compatible with the current occupancy. If not
              // then reset the occupants. Allow 1 occupant in a double room
              // If the plan is a standard reservation or Kur reservation and the occupancy changes and the
              // single only, double only flags are set we need to remove the guests from the reservation
              // we may not collect the correct information for the second person so remove all guests from the
              // reservation.

              if ($scope.rvm.single_only && $scope.rvm.res.occupants > 1) {
                $scope.rvm.res.occupants = 1;
                oldvars[3] = 1;
                break;
              }
              //else if ($scope.rvm.single_only || $scope.rvm.double_only) {
              //  $scope.rvm.res.guest = null;
              //  $scope.rvm.res.guest2 = null;
              //}
              if ($scope.rvm.oneBill && $scope.rvm.oneRoom) {
                $scope.rvm.updateGuestDataFromDb().then(() => {
                  $scope.rvm.occupantsChanged().then((cnt) => {
                    helpers.dApply();
                  }).catch(err => helpers.showLoadErr(err));;
                }).catch(err => helpers.showLoadErr(err));;
              } else {
                $scope.rvm.occupantsChanged().then((cnt) => {
                  helpers.dApply();
                }).catch(err => helpers.showLoadErr(err));;
              }
              break;

            case 4:
              if (oldvars[4] !== undefined) { //This was needed for some reason, the ignore logic didn't work for this.
                console.log("res. type changed");
                ignoreIndex = -1; // no watched variables changed
                $scope.rvm.reservationTypeChanged();
              }
              break;

            case 5:
              // if firm changes and has a new value (not empty) then we must clear the guest field since
              // guests are filtered by and associated with firms. However, we should not do this if the
              // firm change is due to loading an existing reservation with a firm. Thus the firstLoad
              // parameter.
              if (firstLoad) {
                firstLoad = false;
                return;
              }
              console.log("Firm changed");
              if ($scope.rvm.showFirm && $scope.rvm.res.firm && $scope.rvm.res.guest.name) {
                $scope.rvm.res.guest = {
                  name: '',
                  id: 0
                };
                if ($scope.rvm.res.guest2) {
                  $scope.rvm.res.guest2 = {
                    name: '',
                    id: 0
                  };
                }
              }
              break;

            case 6:
              ignoreIndex = -1; // no watched variables changed
              $scope.rvm.guestChanged(); // perform any BL needed
              break;

            case 7:
              ignoreIndex = -1;
              $scope.rvm.guestChanged(true); // perform any BL needed, true indicates second guest changed
          }
        }
      });

      // callback for when the Guest name changes. If firm is active and selected guest has a firm associated with it
      // then the firm is updated with the firm associated with the guest
      $scope.guestChanged = function (guest) {
        if (guest) {
          console.log("Guest changed: " + guest.firm);
          if ($scope.rvm.showFirm && guest.firm) {
            $scope.rvm.res.firm = guest.firm;
          }
        }
      };

      // for date pickers
      $scope.openStart = function ($event) {
        $event.preventDefault();
        $event.stopPropagation();
        $scope.openedStart = true;
        //$scope.openEnd = false;
      };
      $scope.openEnd = function ($event) {
        $event.preventDefault();
        $event.stopPropagation();
        $scope.openedEnd = true;
        //$scope.openStart=false;
      };
      $scope.dateOptions = {
        formatYear: 'yy',
        startingDay: 1,
        showWeeks: false,
        currentText: configService.loctxt.today,
        closeText: configService.loctxt.ok
      };
      $scope.dateFormat = "dd.MM.yyyy";

       // modal button click methods
      // save button handler
      $scope.save = function () {
        //perform any pre save logic and form validation
        $scope.rvm.beforeSave().then(() => {
          $scope.rvm.res.save().then(() => {
            $scope.rvm.afterSave().then(() => {
              let msg = (mode === 'c' ? configService.loctxt.reservation + configService.loctxt.success_saved :
                configService.loctxt.success_changes_saved);
                let evData = {
                  data: $scope.rvm.res.reservation_number,
                  sDate: $scope.rvm.res.start_date
                }
              $rootScope.$broadcast(configService.constants.reservationChangedEvent, evData);
              $rootScope.$emit(configService.constants.reservationChangedEvent, evData);
              console.log("reservation form: sending res. changed event");
              helpers.autoClose(msg, $scope.rvm.res);
            }).catch((err) => helpers.showSaveError(err)); //after save
          }).catch((err) => helpers.showSaveError(err)); //save
        }).catch((err) => helpers.showSaveError(err)); //before save
      };

      // Delete btn handler
      $scope.delete = function () {
        let id = $scope.rvm.res.reservation_number;
        $scope.rvm.res.remove().then(() => {
            let msg = `${configService.loctxt.reservation} ${id} ${configService.loctxt.success_deleted}`;
            $rootScope.$broadcast(configService.constants.reservationChangedEvent, {
              data: id
            }); //broadcast change event
            $rootScope.$emit(configService.constants.reservationChangedEvent, {
              data: id
            }); //broadcast change event
            console.log("reservation form: sending res. changed event");
            helpers.autoClose(msg, id);
        }).catch(err => helpers.showSaveError(err));
      };

      //#region - private functions
      
      //#endregion
    }
  ]);
});