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

            ReservationVM.getReservationVM(newval.number, true).then(function (resVM) {
              if(resVM.res) {
                $scope.rvm = resVM;
                //$scope.res = resVM.res;
                $scope.showCharges = true;
                $scope.room = newval.room;
                $scope.guest = newval.guest;
                $scope.planText = '****'
                // logic to generate the Zimmer Plan text todo-may need to encapsulate and use for bill generation
                var extras = null;
                var rm = resVM.getRoomExpenseInReservation(newval.room, newval.guest);
                if (rm) {
                  var plan = resVM.getPlanInReservation();
                  if (resVM.isGroup && !resVM.oneBill) { //group business reservation
                    var rmObj = resVM.getRoomInReservation(newval.room);
                    extras = {roomType: rmObj.room_type, price: rmObj.price};
                    $scope.planText = convert.formatDisplayString(rm,extras);
                  }
                  else if (resVM.isGroup && resVM.oneBill) { //group tour reservation.
                   extras = {nights: resVM.res.nights, occupants: resVM.res.occupants};
                    $scope.planText = convert.formatDisplayString(plan,extras);
                  }
                  else if (resVM.oneRoom && resVM.oneBill) { //should cover standard reservations
                    extras = {nights: resVM.res.nights, roomprice: rm.price};
                     if (plan.is_plan) {
                        extras.perPerson = resVM.res.occupants === 2 ? configService.loctxt.forTwoPeople : '';
                     }
                    $scope.planText = convert.formatDisplayString(plan,extras);
                  }
                  else if (resVM.oneRoom && !resVM.oneBill) { // covers business and kur plans
                    extras = {nights: resVM.res.nights, roomprice: rm.price};
                    if (plan.is_plan) {
                      extras.perPerson = resVM.res.occupants === 2 ? configService.loctxt.forTwoPeople : '';
                    }
                    $scope.planText = convert.formatDisplayString(plan,extras);
                  }
                }

              }
            });
          });

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
