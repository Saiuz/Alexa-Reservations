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
        'configService',
        function ($scope, $state, $rootScope, $stateParams, ReservationVM, dashboard, configService) {
          $scope.appTitle = $rootScope.appTitle;
          $scope.appBrand = $rootScope.appBrand;
          $scope.url = $state.current.url;
          $scope.pageHeading = configService.loctxt.bills;

          $scope.txt = configService.loctxt;
          $scope.showCharges = false;
          // for reservation-list directive
          $scope.selectedReservation;
          $scope.resCount = 0;
          $scope.pTitle = configService.loctxt.selectReservation;

          $scope.$watch('selectedReservation', function (newval) {
            if (!newval || !newval.number) return; //We expect an object with (res) number, room and guest properties
            // Get reservation and prepare the room plan text and handle the special case
            // where we have a group reservation with one bill- need to show the rooms
            ReservationVM.getReservationVM(newval.number, true).then(function (resVM) {
              if(resVM.res) {
                $scope.rvm = resVM;
                $scope.pTitle = configService.loctxt.bill;
                $scope.showCharges = true;
                $scope.room = newval.room;
                $scope.guest = newval.guest;
                $scope.canCheckOut = resVM.canCheckOut($scope.room);
              }
            });
          });

          // Checkout the reservation or the individuals part of the reservation.
          // todo- currently just sets the checkout flag.
          $scope.checkout = function () {
            $scope.rvm.checkOut($scope.room).then(function () {
              $scope.canCheckOut = false;
              $rootScope.$broadcast(configService.constants.reservationChangedEvent, {data: $scope.rvm.res.reservation_number});
            },function (err) {
              $scope.err = err;
              $scope.errSave = true;
            });
          };

          // See if we were passed a reservation link in the URL
          if ($stateParams.resNum && $stateParams.resNum > 0){
            $scope.selectedReservation = {number: Number($stateParams.resNum), room: Number($stateParams.resRoom), guest: $stateParams.resGuest};
          }
        }]);
});