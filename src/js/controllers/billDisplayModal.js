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
 *        let modalInstance = $modal.open({
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

  controllers.controller('BillDisplayModalCtrl', ['$scope',
    '$modalInstance',
    'modalParams',
    'configService',
    'ReservationVM',
    'modalUtility',
    function ($scope, $modalInstance, modalParams, configService, ReservationVM, utility) {

      //let gui = require('nw.gui');
      let helpers = new utility.Helpers($scope, $modalInstance);
      $scope.txt = configService.loctxt;
      $scope.busPauschale = false;
      $scope.resDetails = false;
      const notFound = configService.loctxt.reservation + ' "' + modalParams.reservation_number + '" ' + configService.loctxt.notFound;
      // Get reservation and prepare the room plan text and handle the special case
      // where we have a group reservation with one bill- need to show the rooms
      ReservationVM.getReservationVM(modalParams.reservation_number, true).then((resVM) => {
        if (resVM.res) {
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
          helpers.dApply();
        } else {
          helper.showLoadErr(notFound);
        }
      }).catch(err => helper.showLoadErr(err));

      //#region - private functions

      //#endregion

    }
  ]);
});