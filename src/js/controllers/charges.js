/**
 * Created by Owner on 05.08.2014.
 *
 * Controller for charges
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

          $scope.rvm = ReservationVM;
          $scope.showCharges = false;
          // for reservation-list directive
          $scope.selectedReservation = 0;
          $scope.listDate = new Date();
          dashboard.getItemTypeListExcept('Zimmer Plan').then(function(items){
            $scope.itemTypes = items;
            $scope.expenses = []; // for testing only
            var temp = new Reservation();
            var newitem = temp.expenses.create({name: items[0].item_name, count: 1, price: items[0].default_unit_price})
            $scope.expenses.push(newitem);
          });

          $scope.$watch('selectedReservation', function (newval) {
            ReservationVM.getReservation(newval).then(function (res) {
              if(res) {
                $scope.res = res;
                $scope.showCharges = true;
                $scope.expenses = [];   // for testing, get the reservations expenses
                var newitem = res.expenses.create({name: 'test'});
                $scope.expenses.push(newitem);
              }
            });
          });

          if ($stateParams.resNum && $stateParams.resNum > 0){
             ReservationVM.getReservation($stateParams.resNum).then(function (res){
               $scope.res = res;
               $scope.showCharges = true;
             });
          }
        }]);
});
