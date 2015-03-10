/**
 * Controller for the bill display Modal window. This modal form pops up the bill for a specified reservation
 * Data is passed to the controller via the 'modalParams' object injected into the controller. The object can have
 * have three parameters:
 *    modalParams.reservation_number - The message to display in the modal box.
 *    modalParams.room - Optional text to display in the Yes button (defaults to Yes).
 *    modeParams.guest - Optional text to display in the No button (defaults to No).
 *
 *
 * The form is activated, and the returned result is handled by the following code:
 *        var modalInstance = $modal.open({
 *                     templateUrl: './templates/billDisplayModal.html',
 *                     controller: 'BillDisplayModalCtrl',
 *                     size: size,
 *                     resolve: {
 *                       modalParams: function () {
 *                         return {reservation_number: 150021, room: 7, guest: 'Johanus Schmit'}
 *                     }
 *                   });
 *
 *        modalInstance.result.then(function (result) {
 *                     // no data returned.
 *                   });
 *
 */
define(['./module'], function (controllers) {
  'use strict';

  controllers.controller('BillDisplayModalCtrl',
      ['$scope',
        '$modalInstance',
        'modalParams',
        'configService',
        'ReservationVM',
        function ($scope, $modalInstance, modalParams, configService, ReservationVM) {

          var gui = require('nw.gui');

          $scope.txt = configService.loctxt;

          // Get reservation and prepare the room plan text and handle the special case
          // where we have a group reservation with one bill- need to show the rooms
          ReservationVM.getReservationVM(modalParams.reservation_number, true).then(function (resVM) {
                if(resVM.res) {
                  $scope.rvm = resVM;
                  $scope.pTitle = configService.loctxt.bill;
                  $scope.showCharges = true;
                  $scope.room = modalParams.room;
                  $scope.guest = modalParams.guest;
                  $scope.busPauschale = false;
                  $scope.resDetails = false;
                  $scope.canCheckOut = resVM.canCheckOut($scope.room);
                  $scope.busRes = resVM.isBusiness;
                  $scope.stdRes = resVM.isStandard;
                  $scope.kurRes = resVM.isKur;
                  $scope.tourRes = resVM.isTour;
                  $scope.err="";
                  $scope.hasErr = false;
                }
              },
              function (err) {
                $scope.err= err;
                $scope.hasErr = true;
              });

          //print bill
          $scope.print = function() {
            var printContents = $('#printBill').html(); //$('#billPage').innerHTML();
            var popupWin = window.open('', '_blank', 'width=210mm,height=297mm,scrollbars=no,menubar=no,toolbar=no,location=no,status=no,titlebar=no');
            popupWin.window.focus();
            popupWin.document.write('<!DOCTYPE html><html><head>' +
            '<link rel="stylesheet" type="text/css" href="css/app.css" />' +
            '</head><body onload="window.print()"><div class="bill-print">' + printContents + '</div></html>');
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

          $scope.print2 = function () {
            var printContents = $('#printBill').html();
            var pwin = gui.Window.open('./directives/a4print.html', {
             width: 450,
              height: 600,
              position: 'center',
              toolbar: false,
              menu: false
            });
            pwin.document.write('<!DOCTYPE html><html><head>' +
            '<link rel="stylesheet" type="text/css" href="css/app.css" />' +
            '</head><body onload="window.print()"><div class="bill-print">' + printContents + '</div></html>');
          };

          $scope.close = function () {
            $modalInstance.close();
          }
        }]);
});


