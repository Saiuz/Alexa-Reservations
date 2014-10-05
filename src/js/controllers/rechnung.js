/**
 * Created by Owner on 05.08.2014.
 *
 * Controller for rechnungen (bills)
 */
define(['./module'], function (controllers) {
  'use strict';

  controllers.controller('RechnungCtrl',
      ['$scope',
        '$state',
        '$rootScope',
        '$stateParams',
        'ReservationVM',
        'dashboard',
        'Reservation',
        function ($scope, $state, $rootScope, $stateParams, ReservationVM, dashboard, Reservation) {
          console.log("Rechnung  controller fired") ;
          $scope.appTitle = $rootScope.appTitle;
          $scope.appBrand = $rootScope.appBrand;
          $scope.url = $state.current.url;
          $scope.pageHeading = "Rechnungen";

          $scope.rvm = ReservationVM;
          $scope.showCharges = false;
          // for reservation-list directive
          $scope.selectedReservation = 0;
          $scope.listDate = new Date();


          $scope.$watch('selectedReservation', function (newval) {
            ReservationVM.getReservation(newval).then(function (res) {
              if(res) {
                $scope.res = res;
                $scope.showCharges = true;
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