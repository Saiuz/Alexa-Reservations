/**
 * Created by Owner on 10/13/2014.
 * ToDo-some how need to get the directive to update inputs on first page load. May have to let the hosting page control the creation of the reservation. Not sure what is going on.
 * todo-try to move all lists and objects required for ui into ReservationVM and as much logic as possible. May want to make the
 * todo-VM model a true factory that creates a new instance of the vm with its underlying reservation. Not sure if that will help.Another alternative is to put some of the logic into the
 * todo-database model.
 */
define(['./module'], function (directives) {
  'use strict';
  directives.directive('axReservation', ['ReservationVM', function (ReservationVM) {

    var linker = function (scope, element, attrs) {
      console.log("ax-reservation: linker function fired")
      var excecuteWatch = false;
      scope.rvm = ReservationVM;
      scope.res = {};
      scope.resTypeOptions = [];
      scope.availableRooms = [];
      scope.availableResources = [];
      scope.planPrice = 0;
      scope.roomCount = 0;
      scope.resourceCount = 0;

      var rOpts = [];
      angular.forEach(scope.rvm.resTypeList, function (item) {
        rOpts.push({value: item, text: item});
      });
      scope.resTypeOptions = rOpts;
      scope.occupantOptions = [
        {value: 1, text: '1'},
        {value: 2, text: '2'},
        {value: 3, text: '3+'}
      ];

      scope.resTypeChange =  function() {
        ReservationVM.reservationTypeChanged();
        scope.roomPlanChanged();
      };

      scope.roomPlanChanged = function () {
        ReservationVM.roomPlanChanged();
        // Add any cleanup logic. For example, any hidden fields that do not show should clear the
        // the corresponding reservations field.
        if (!ReservationVM.showFirm){
          scope.res.firm = '';
        }
        if (!ReservationVM.showInsurance) {
          scope.res.insurance = '';
        }
        // Add logic to change occupants if the plan is single_only or double_only and the occupant numbers
        // don't match.
        if (ReservationVM.double_only && scope.res.occupants === 1) {
          scope.res.occupants = 2;
        }
        else if (ReservationVM.single_only && scope.res.occupants > 1) {
          scope.res.occupants = 1;
        }
      };

      // other one time initialization
      // for reservation type radio button control

      scope.$watch('reservationNumber', function (newval, oldval) {
        if (newval !== undefined) {
          excecuteWatch = false;
          if (newval) {
            // retrieve reservation
            console.log("Get existing reservation");
            ReservationVM.getReservation(newval).then(function (res) {
              scope.res = res;
              scope.availableRooms = ReservationVM.availableRooms;
              scope.availableResources = ReservationVM.availableResources;
              scope.planPrice = ReservationVM.planPrice;
              excecuteWatch = true;
            });
          }
          else {
            // create new reservation
            console.log("Create new reservation");
            ReservationVM.newReservation().then(function (res) {
              scope.res = res;
              var rOpts = [];
              angular.forEach(scope.rvm.resTypeList, function (item) {
                rOpts.push({value: item, text: item});
              });
              scope.resTypeOptions = rOpts;
              scope.planPrice = ReservationVM.planPrice;
              excecuteWatch = true;
            });
          }
        }
      });

      //watch for changes in certain form fields
      var ignoreIndex = -1;
      scope.$watchCollection('[res.start_date, res.end_date, rvm.nights, res.occupants, res.type]', function (newvars, oldvars) {
        console.log("Watch collection fired " + excecuteWatch);
        if (excecuteWatch) {

          var varIndex = (oldvars[4] !== newvars[4]) ? 4 : (oldvars[3] !== newvars[3]) ? 3 : (oldvars[2] !== newvars[2]) ? 2 : (oldvars[1] !== newvars[1]) ? 1 : (oldvars[0] !== newvars[0]) ? 0 : -1;
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
              rdates = ReservationVM.calculateEndDate(scope.res.start_date);
              scope.res.end_date = rdates.end;
              ReservationVM.updateAvailableRoomsAndResources(rdates, scope.res.occupants === 2).then(function (cnt) {
                scope.availableRooms = ReservationVM.availableRooms;
                scope.availableResources = ReservationVM.availableResources;
              });

              break;

            case 1:
              console.log("end_date changed");
              ignoreIndex = 2; //nights
              rdates = ReservationVM.calculateNights(scope.res.start_date, scope.res.end_date);
              scope.res.end_date = rdates.end;
              ReservationVM.updateAvailableRoomsAndResources(rdates, scope.res.occupants === 2).then(function (cnt) {
                scope.availableRooms = ReservationVM.availableRooms;
                scope.availableResources = ReservationVM.availableResources;
              });

              break;

            case 2:
              console.log("nights changed ");
              ignoreIndex = 1; //end_date
              rdates = ReservationVM.calculateEndDate(scope.res.start_date);
              scope.res.end_date = rdates.end;
              ReservationVM.updateAvailableRoomsAndResources(rdates, scope.res.occupants === 2).then(function (cnt) {
                scope.availableRooms = ReservationVM.availableRooms;
                scope.availableResources = ReservationVM.availableResources;
              });

              break;

            case 3:
              console.log("occupants changed");
              ignoreIndex = -1; // no watched variables changed
              // check to see if the plan that is selected is compatible with the current occupancy. If not
              // then reset the occupants
              if (ReservationVM.single_only && scope.res.occupants === 2) {
                scope.res.occupants = 1;
              }
              else if (ReservationVM.double_only && scope.res.occupants === 1) {
                scope.res.occupants = 2;
              }
              rdates = ReservationVM.cleanResDates(scope.res);
              // Update only the room not the resources since the dates are not changing
              ReservationVM.updateAvailableRoomsAndResources(rdates, scope.res.occupants === 2, true).then(function (cnt) {
                scope.availableRooms = ReservationVM.availableRooms;
                scope.availableResources = ReservationVM.availableResources;
              });
              break;

            case 4:
              if (oldvars[4] !== undefined) {  //This was needed for some reason, the ignore logic didn't work for this.
                console.log("res. type changed");
                ignoreIndex = -1; // no watched variables changed
                ReservationVM.reservationTypeChanged(scope.res.type);

                // If there is a plan price then it is assumed to be a per person price so we multiply by the number of occupants
                // If there is only one person then we add any single person up-charge.
                scope.planPrice = ReservationVM.planPrice + (scope.res.occupants === 1 ? ReservationVM.singleSurcharge : 0) * scope.res.occupants;
              }
              break;
          }
        }
      });

      // for date pickers
      scope.openStart = function ($event) {
        $event.preventDefault();
        $event.stopPropagation();
        scope.openedStart = true;
        //$scope.openEnd = false;
      };
      scope.openEnd = function ($event) {
        $event.preventDefault();
        $event.stopPropagation();
        scope.openedEnd = true;
        //$scope.openStart=false;
      };
      scope.dateOptions = {
        formatYear: 'yy',
        startingDay: 1,
        showWeeks: false,
        currentText: 'Heute',
        closeText: 'OK'
      };
      scope.dateFormat = "dd.MM.yyyy";
    };

    var controller = function ($scope) {
      console.log("ax-reservation: controller fired.")
    };
    return {
      restrict: 'E',
      link: linker,
      controller: controller,
      templateUrl: './templates/ax-reservation.html',
      scope: {
        reservationNumber: '='
      }
    }
  }]);
});