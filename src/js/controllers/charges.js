/**
 * Created by Owner on 05.08.2014.
 *
 * Controller for charges  todo - make viewmodel or extend ReservationVM for any business logic
 */
define(['./module'], function (controllers) {
  'use strict';

  controllers.controller('ChargesCtrl',
      ['$scope',
        '$state',
        '$rootScope',
        '$stateParams',
        'ReservationVM',
        'dashboard',
        'configService',
        'convert',
        function ($scope, $state, $rootScope, $stateParams, ReservationVM, dashboard, configService, convert) {
          console.log("Charges  controller fired") ;
          $scope.appTitle = $rootScope.appTitle;
          $scope.appBrand = $rootScope.appBrand;
          $scope.url = $state.current.url;
          $scope.pageHeading = "Gebühren";

          $scope.txt = configService.loctxt;
          $scope.showCharges = false;
          $scope.showHiddenExpenses = false;
          $scope.planText = '***';

          // for reservation-list directive
          $scope.selectedReservation = 0;
          $scope.listDate = new Date();

          dashboard.getItemTypeListExcept('').then(function(items){
            $scope.itemTypes = items;
          });

          $scope.$watch('selectedReservation', function (newval) {
            if (!newval) return;
            // Get reservation and prepare the room plan text and handle the special case
            // where we have a group reservation with one bill- need to show the rooms
            ReservationVM.getReservationVM(newval.number, true).then(function (resVM) {
              if(resVM.res) {
                $scope.rvm = resVM;
                //$scope.res = resVM.res;
                $scope.showCharges = true;
                $scope.room = newval.room;
                $scope.guest = newval.guest;
                $scope.gRooms = [];

                $scope.planText = '****'
                // logic to generate the Zimmer Plan text todo-may need to encapsulate and use for bill generation
                var extras = null;
                var rmExp = resVM.getRoomExpenseInReservation(newval.room, newval.guest);
                if (rmExp) {
                  var rmObj = resVM.getRoomInReservation(newval.room);
                  $scope.roomGuest1 = rmObj.guest;
                  $scope.roomGuest2 = rmObj.guest2;
                  var plan = resVM.getPlanInReservation();
                  if (resVM.isGroup && !resVM.oneBill) { //group business reservation
                    extras = {roomType: rmObj.room_type, price: rmObj.price};
                    $scope.planText = convert.formatDisplayString(rmExp,extras);
                  }
                  else if (resVM.isGroup && resVM.oneBill) { //group tour reservation.
                   extras = {nights: resVM.res.nights, occupants: resVM.res.occupants};
                    $scope.planText = convert.formatDisplayString(plan,extras);

                    // for this case we need to create buttons for each room
                    resVM.res.rooms.forEach(function(rm) {
                      $scope.gRooms.push({room: rm.number, guest: rm.guest});
                    })
                  }
                  else if (resVM.oneRoom && resVM.oneBill) { //should cover standard reservations
                    extras = {nights: resVM.res.nights, roomprice: rmExp.price};
                     if (plan.is_plan) {
                        extras.perPerson = resVM.res.occupants === 2 ? configService.loctxt.forTwoPeople : '';
                     }
                    $scope.planText = convert.formatDisplayString(plan,extras);
                  }
                  else if (resVM.oneRoom && !resVM.oneBill) { // covers business and kur plans
                    extras = {nights: resVM.res.nights, roomprice: rmExp.price};
                    if (plan.is_plan) {
                      extras.perPerson = resVM.res.occupants === 2 ? configService.loctxt.forTwoPeople : '';
                    }
                    $scope.planText = convert.formatDisplayString(plan,extras);
                  }
                }

              }
            });
          });

          $scope.changeGuest = function(guest) {
            $scope.guest = guest;
          };

          // Todo- this is broke, if we still want to navigate here we will need the reslink info not just the number.
          if ($stateParams.resNum && $stateParams.resNum > 0){
             ReservationVM.getReservationVM($stateParams.resNum, true).then(function (resVM){
               if(resVM.res) {
                 $scope.rvm = resVM;
                 //$scope.res = resVM.res;
                 $scope.showCharges = true;
               }
             });
          }
        }]);
});
