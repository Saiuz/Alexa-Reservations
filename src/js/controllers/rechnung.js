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
          // note with tabs, had to imbed selectedReservation in an object:
          $scope.selected = {
            reservation: undefined,
            acCnt: 0,
            ap1Cnt: 0
          };
          //$scope.selectedReservation = {};
          $scope.resCount = 0;
          $scope.resCount2 = 0;
          $scope.pTitle = configService.loctxt.selectReservation;

          $scope.$watch('selected.reservation', function (newval) {
            if (!newval || !newval.number) {  //We expect an object with (res) number, room and guest properties
              $scope.showCharges = false;
              $scope.pTitle = configService.loctxt.selectReservation;
              return;
            }
            // Get reservation and prepare the room plan text and handle the special case
            // where we have a group reservation with one bill- need to show the rooms
            ReservationVM.getReservationVM(newval.number, true).then(function (resVM) {
              if(resVM.res) {
                $scope.rvm = resVM;
                $scope.pTitle = configService.loctxt.bill;
                $scope.showCharges = true;
                $scope.room = newval.room;
                $scope.guest = newval.guest;
                $scope.busPauschale = false;
                $scope.resDetails = false;
                $scope.canCheckOut = resVM.canCheckOut($scope.room);
                //todo-determine type of resivation for bill Need to move logic to VM
                $scope.busRes = resVM.isBusiness;
                $scope.stdRes = resVM.isStandard;
                $scope.kurRes = resVM.isKur;
                $scope.tourRes = resVM.isTour;
              }
            });
          });

          // removes the selected marker on the reservation lists
          $scope.clearSelected = function() {
            if ($scope.selected.reservation) {
              $scope.selected.reservation = undefined;
            }
          };

          //print bill
          $scope.printBill = function() {
            var printContents = $('#billPage').html(); //$('#billPage').innerHTML();
            var popupWin = window.open('', '_blank', 'width=450,height=600,scrollbars=no,menubar=no,toolbar=no,location=no,status=no,titlebar=no');
            popupWin.window.focus();
            popupWin.document.write('<!DOCTYPE html><html><head>' +
            '<link rel="stylesheet" type="text/css" href="css/app.css" />' +
            '</head><body onload="window.print()"><div class="reward-body">' + printContents + '</div></html>');
            popupWin.window.print();
            popupWin.onbeforeunload = function (event) {
              popupWin.close();
              return '.\n';
            };
            popupWin.onabort = function (event) {
              popupWin.document.close();
              popupWin.close();
            }
          };

          $scope.togglePauschale = function () {
            $scope.busPauschale = !$scope.busPauschale;
          };
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
            $scope.selected.reservation = {number: Number($stateParams.resNum), room: Number($stateParams.resRoom), guest: $stateParams.resGuest};
          }
        }]);
});