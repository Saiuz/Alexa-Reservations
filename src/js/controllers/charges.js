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
        'Reservation',
        function ($scope, $state, $rootScope, $stateParams, ReservationVM, dashboard, Reservation) {
          console.log("Charges  controller fired") ;
          $scope.appTitle = $rootScope.appTitle;
          $scope.appBrand = $rootScope.appBrand;
          $scope.url = $state.current.url;
          $scope.pageHeading = "Gebühren";

          $scope.showCharges = false;
          // for reservation-list directive
          $scope.selectedReservation = 0;
          $scope.listDate = new Date();
          dashboard.getItemTypeListExcept('').then(function(items){
            $scope.itemTypes = items;
          });

          $scope.$watch('selectedReservation', function (newval) {
            ReservationVM.getReservationVM(newval, true).then(function (resVM) {
              if(resVM.res) {
                $scope.rvm = resVM;
                $scope.res = resVM.res;
                $scope.showCharges = true;
                $scope.expenses = [];   // for testing, get the reservations expenses
                //var newitem = resVM.res.expenses.create({name: 'test'});
                //$scope.expenses.push(newitem);
              }
            });
          });

          if ($stateParams.resNum && $stateParams.resNum > 0){
             ReservationVM.getReservationVM($stateParams.resNum, true).then(function (resVM){
               if(resVM.res) {
                 $scope.rvm = resVM;
                 $scope.res = resVM.res;
                 $scope.showCharges = true;
               }
             });
          }
        }]);
});
