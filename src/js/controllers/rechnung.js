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

          $scope.showCharges = false;
          // for reservation-list directive
          $scope.selectedReservation = 0;
          $scope.listDate = new Date();


          $scope.$watch('selectedReservation', function (newval) {
            if (!newval) return;
            ReservationVM.getReservationVM(newval.number, true).then(function (resVM) {
              if(resVM.res) {
                $scope.rvm = resVM;
                $scope.showCharges = true;
                $scope.selectedReservation = resVM.res.reservation_number;
              }
            });
          });

          if ($stateParams.resNum && $stateParams.resNum > 0){
            ReservationVM.getReservationVM($stateParams.resNum).then(function (res){
              $scope.res = res;
              $scope.showCharges = true;
            });
          }
        }]);
});