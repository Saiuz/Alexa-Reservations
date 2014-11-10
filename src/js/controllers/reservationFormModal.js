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
 *        var modalInstance = $modal.open({
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
 *
 * todo- If plan selected has a specified # of nights then change the nights to match (VM?)
 * todo - FIX: if plan selected with fixed price, price not being passed on to room lookup directive.
 * done - FIX: plan field not being updated properly in reservation.
 * todo - FIX: when new reservation created with default date period, the available rooms is not updated.
 */
define(['./module'], function (controllers) {
  'use strict';

  controllers.controller('ReservationFormModalCtrl',
      ['$scope',
        '$modalInstance',
        'modalParams',
        'Reservation',
        'ReservationVM',
        'configService',
        '$timeout',
        function ($scope, $modalInstance, modalParams, Reservation, ReservationVM, configService, $timeout) {
          console.log("ReservationFormModal controller fired");

          $scope.err = '';
          $scope.errSave = false;
          $scope.errLoad = false;
          $scope.hide = false;
          $scope.actionMsg = '';
          $scope.saveTxt = configService.loctxt.add;
          $scope.cancelTxt = configService.loctxt.cancel;
          $scope.txt = configService.loctxt;
          $scope.deleteMode = false;
          $scope.confirmed = false;
          $scope.roomCount = 0;
          $scope.resourceCount = 0;
          $scope.txt = configService.loctxt;

          // Determine CRUD mode of form.
          // For all but 'C' the query can be by reservation_number property which is unique.
          var mode = modalParams.mode.substring(0, 1).toLowerCase();
          var resNumber = parseInt(modalParams.data);// ? {'_id': modalParams.data} : {'firm_name': modalParams.data};
          var excecuteWatch = false;
          var firstload = false;
          switch (mode) {
            case 'c':
              $scope.title = configService.loctxt.reservation_titleCreate;
              $scope.edit = true;
              $scope.read = false;
              ReservationVM.newReservationVM().then(function (resVM) {
                $scope.rvm = resVM
                $scope.start_date = new Date(resVM.res.start_date);
                $scope.end_date = new Date(resVM.res.end_date);
                excecuteWatch = true;
              });
              break;
            case 'r':
              $scope.title = configService.loctxt.reservation_titleRead;
              $scope.edit = false;
              $scope.read = true;
              $scope.cancelTxt = configService.loctxt.close;
              ReservationVM.getReservationVM(resNumber, true).then(function (resVM) {
                $scope.rvm = resVM;
              }, function (err) {
                console.log('Read Error: ' + err);
                $scope.err = err;
                $scope.errLoad = true;
              });
              break;

            case 'u':
              firstload = true;
              $scope.title = configService.loctxt.reservation_titleEdit;
              ReservationVM.getReservationVM(resNumber).then(function (resVM) {
                $scope.rvm = resVM;
                $scope.start_date = new Date(resVM.res.start_date);
                $scope.end_date = new Date(resVM.res.end_date);
                $scope.availableRooms = resVM.availableRooms;
                $scope.availableResources = resVM.availableResources;
                $scope.edit = true;
                $scope.read = false;
                $scope.saveTxt = configService.loctxt.update;
                excecuteWatch = true;

              }, function (err) {
                $scope.err = err;
                $scope.errLoad = true;
              });
              break;

            case 'd':
              $scope.title = configService.loctxt.reservation_titleDelete;
              $scope.edit = false;
              $scope.read = true;
              $scope.deleteMode = true;
              $scope.cancelTxt = configService.loctxt.close;
              $scope.saveTxt = configService.loctxt.delete;
              ReservationVM.getReservationVM(resNumber, true).then(function (resVM) {
                $scope.rvm = resVM;
              }, function (err) {
                console.log('Read Error: ' + err);
                $scope.err = err;
                $scope.errLoad = true;
              });
              break;
          }

          //watch for changes in certain form fields. This logic deals with input changes that impact the available
          // rooms and resources. Since this logic requires a watch it is handled here not in the VM.
          var ignoreIndex = -1;
          $scope.$watchCollection('[start_date, end_date, rvm.nights, rvm.res.occupants, rvm.res.type, rvm.res.firm]', function (newvars, oldvars) {
            console.log("Watch collection fired " + excecuteWatch);
            if (excecuteWatch) {
              var varIndex = (oldvars[5] !== newvars[5]) ? 5 : (oldvars[4] !== newvars[4]) ? 4 : (oldvars[3] !== newvars[3]) ? 3 : (oldvars[2] !== newvars[2]) ? 2 : (oldvars[1] !== newvars[1]) ? 1 : (oldvars[0] !== newvars[0]) ? 0 : -1;
              console.log("watch index: " + varIndex);
              if (varIndex === -1 || varIndex === ignoreIndex) {
                ignoreIndex = -1;
                return;
              }
              var rdates = {};
              switch (varIndex) {
                case 0:
                  console.log("start_date changed");
                  ignoreIndex = 1; //end_date
                  $scope.rvm.res.start_date = $scope.start_date;
                  rdates = $scope.rvm.calculateEndDate($scope.rvm.res.start_date);
                  $scope.rvm.res.end_date = rdates.end;
                  $scope.end_date = rdates.end;
                  $scope.rvm.updateAvailableRoomsAndResources(rdates, $scope.rvm.res.occupants === 2).then(function (cnt) {
                    $scope.availableRooms = $scope.rvm.availableRooms;
                    $scope.availableResources = $scope.rvm.availableResources;
                  });

                  break;

                case 1:
                  console.log("end_date changed");
                  ignoreIndex = 2; //nights
                  $scope.rvm.res.end_date = $scope.end_date;
                  rdates = $scope.rvm.calculateNights($scope.rvm.res.start_date, $scope.rvm.res.end_date);
                  //scope.res.end_date = rdates.end;
                  $scope.rvm.updateAvailableRoomsAndResources(rdates, $scope.rvm.double_only).then(function (cnt) {
                    $scope.availableRooms = $scope.rvm.availableRooms;
                    $scope.availableResources = $scope.rvm.availableResources;
                  });
                  break;

                case 2:
                  console.log("nights changed ");
                  ignoreIndex = 1; //end_date
                  rdates = $scope.rvm.calculateEndDate($scope.rvm.res.start_date);
                  $scope.rvm.res.end_date = rdates.end;
                  $scope.end_date = rdates.end;
                  $scope.rvm.updateAvailableRoomsAndResources(rdates, $scope.rvm.double_only).then(function (cnt) {
                    $scope.availableRooms = $scope.rvm.availableRooms;
                    $scope.availableResources = $scope.rvm.availableResources;
                  });
                  break;

                case 3:
                  console.log("occupants changed");
                  ignoreIndex = -1; // no watched variables changed
                  // check to see if the plan that is selected is compatible with the current occupancy. If not
                  // then reset the occupants
                  if ($scope.rvm.single_only && $scope.rvm.res.occupants === 2) {
                    $scope.rvm.res.occupants = 1;
                  }
                  else if ($scope.rvm.double_only && $scope.rvm.res.occupants === 1) {
                    $scope.rvm.res.occupants = 2;
                  }
                  rdates = $scope.rvm.cleanResDates();
                  // Update only the room not the resources since the dates are not changing
                  $scope.rvm.updateAvailableRoomsAndResources(rdates, $scope.rvm.double_only, true).then(function (cnt) {
                    //$scope.availableRooms = $scope.rvm.availableRooms;
                    //$scope.availableResources = $scope.rvm.availableResources;
                  });
                  break;

                case 4:
                  if (oldvars[4] !== undefined) {  //This was needed for some reason, the ignore logic didn't work for this.
                    console.log("res. type changed");
                    ignoreIndex = -1; // no watched variables changed
                    $scope.rvm.reservationTypeChanged();
                  }
                  break;

                case 5:
                  // if firm changes and has a new value (not empty) then we must clear the guest field since
                  // guests are filtered by and associated with firms. However, we should not do this if the
                  // firm change is due to loading an existing reservation with a firm. Thus the firstload
                  // parameter.
                  if (firstload) {
                    firstload = false;
                    return;
                  }
                  console.log("Firm changed");
                  if ($scope.rvm.showFirm && $scope.rvm.res.firm && $scope.rvm.res.guest.name) {
                    $scope.rvm.res.guest.name = '';
                  }
                  break;
              }
            }
          });

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
            //perform any pre save form validation  or logic here todo--move to VM, create vm save method
            // generate title (required field)
            if ($scope.rvm.res.firm) {
              $scope.rvm.res.title = $scope.rvm.res.firm + ' (' + $scope.rvm.res.guest.name + ')';
            }
            else {
              $scope.rvm.res.title = $scope.rvm.res.guest.name;
            }
            //save/update firm and return
            $scope.rvm.res.save(function (err) {
              if (err) {
                console.log('Reservation save error: ' + err);
                $scope.err = err;
                $scope.errSave = true;
                $scope.$apply();
              }
              else {
                var msg = (mode === 'c' ? configService.loctxt.reservation + configService.loctxt.success_saved :
                    configService.loctxt.success_changes_saved);
                autoClose(msg, $scope.rvm.res);
              }
            });
          };

          // Delete btn handler
          $scope.delete = function (err) {
            var id = $scope.rvm.res.reservation_number;
            $scope.rvm.res.remove(function (err) {
              if (err) {
                console.log('Reservation delete error: ' + err);
                $scope.err = err;
                $scope.errSave = true;
                $scope.$apply();
              }
              else {
                var msg = configService.loctxt.res + configService.loctxt.success_deleted
                autoClose(msg, id);
              }
            });
          };

          // Cancel btn handler
          $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
          }

          // Error msg close handler for save/delete error only
          $scope.hideErr = function () {
            $scope.errSave = false;
          };
        }]);
});