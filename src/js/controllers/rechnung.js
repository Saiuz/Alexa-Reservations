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
        'datetime',
        'modals',
        function ($scope, $state, $rootScope, $stateParams, ReservationVM, dashboard, configService, datetime, modals) {
          let currRoom;
          let resInURL = false;

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
          $scope.pTitle = configService.loctxt.bills + ' - ' + configService.loctxt.selectReservation;

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
                $scope.busRes = resVM.isBusiness;
                $scope.stdRes = resVM.isStandard;
                $scope.kurRes = resVM.isKur;
                $scope.tourRes = resVM.isTour;
                $scope.pGroupRes = resVM.isPrivateGroup;
                $scope.err="";
                $scope.hasErr = false;
                currRoom = resVM.getRoomInReservation(newval.room);
                $scope.showSecond = resVM.isBusiness && currRoom.guest_count === 2; //etc
                $scope.busstdRes = resVM.isBusiness && $scope.showSecond && resVM.guestInRoomHasKurtax($scope.guest, $scope.room);
                if ($scope.busstdRes) {
                  $scope.busRes = false;
                  $scope.secondPrivate = $scope.busstdRes;
                }
                else {
                  $scope.secondPrivate = false;
                }
                $scope.$apply();
              }
            }).catch((err) => {
                $scope.err= err;
                $scope.hasErr = true;
                console.error(err);
              });
          });

          $scope.$on(configService.constants.guestNameChangedEvent, (event, val) => {
            $scope.guest = val.newName;
          });

          // removes the selected marker on the reservation lists
          $scope.clearSelected = function() {
            if ($scope.selected.reservation && !resInURL) {
              $scope.selected.reservation = undefined;
            }
            resInURL = false; //only check first time through
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

          // converts this person's bill from a business to a private bill. Adds kurtax.
          // or reverts a private bill back to a business bill and removes kurtax.
          // Note we also must toggle address and take guest's address not firm's address
          $scope.toggleSecond = function () {
            if ($scope.secondPrivate) {
              $scope.rvm.addKurtaxForGuestInRoom($scope.guest, $scope.room).then( function () {
                $scope.busRes = false;
                $scope.busstdRes = true;
              }, function(err) {
                $scope.err = err;
                $scope.hasErr = true;
              });
             } else {
              $scope.rvm.removeKurtaxForGuestInRoom($scope.guest, $scope.room).then( function () {
              $scope.busRes = true;
              $scope.busstdRes = false;
              }, function(err) {
                $scope.err = err;
                $scope.hasErr = true;
              });
            }
          };
          // Checkout the reservation or the individuals part of the reservation.
          // todo- currently just sets the checkout flag.
          $scope.checkout = function () {
            var cdse = datetime.daysSinceEpoch(datetime.dateOnly(new Date())),
                rdse = datetime.daysSinceEpoch(datetime.dateOnly($scope.rvm.res.end_date));

            // first check that we are not checking out early. If so then ask if we want to continue.
            if (cdse < rdse) {
              modals.yesNoShow(configService.loctxt.wantToCheckout,function (result) {
                if (result) {
                  $scope.rvm.checkOut($scope.room, $scope.guest).then(function () {
                    $scope.canCheckOut = false;
                    $rootScope.$broadcast(configService.constants.reservationChangedEvent, {data: $scope.rvm.res.reservation_number});
                    $scope.clearSelected();
                    $scope.$apply();
                  }, function (err) {
                    $scope.err = err;
                    $scope.hasErr = true;
                  });
                }
              });
            }
            else {
              $scope.rvm.checkOut($scope.room, $scope.guest).then(function () {
                $scope.canCheckOut = false;
                $rootScope.$broadcast(configService.constants.reservationChangedEvent, {data: $scope.rvm.res.reservation_number});
                $scope.clearSelected();
                $scope.$apply();
              }, function (err) {
                $scope.err = err;
                $scope.hasErr = true;
              });
            }
          };

          // See if we were passed a reservation link in the URL
          if ($stateParams.resNum && $stateParams.resNum > 0){
            resInURL = true;
            $scope.selected.reservation = {number: Number($stateParams.resNum), room: Number($stateParams.resRoom), guest: $stateParams.resGuest};
          }
        }]);
});