/**
 * Controller for the yes/no Modal form. This is a simple small alert type modal that displays a message and has two
 * buttons which default to Yes or No. The modal returns true if the Yes button is pressed or false if the No button
 * is pressed. The button text can be changed. The modal is called with a
 * Data is passed to the controller via the 'modalParams' object injected into the controller. The object can have
 * have four parameters:
 *    modalParams.message - The message to display in the modal box.
 *    modalParams.yes - Optional text to display in the Yes button (defaults to Yes).
 *    modeParams.no - Optional text to display in the No button (defaults to No).
 *    modeParams.level - Optional text that can determine the background color, the values mimic the Bootstrap
 *                       alert colors and can be 'success', 'info', 'warning', 'danger'. The default is 'info'.
 *
 *
 * The form is activated, and the returned result is handled by the following code:
 *        let modalInstance = $modal.open({
 *                     templateUrl: './templates/eventFormModal.html',
 *                     controller: 'EventFormModalCtrl',
 *                     size: size,
 *                     resolve: {
 *                       modalParams: function () {
 *                         return {message: 'Hi There', yes: 'Ja', no: 'Nein', level: 'warn'}
 *                     }
 *                   });
 *
 *        modalInstance.result.then(function (result) {
 *                     // handle result which is true (yes) or false (no).
 *                   });
 *
 */
define(['./module'], function (controllers) {
  'use strict';

  controllers.controller('YesNoFormModalCtrl',
      ['$scope',
        '$modalInstance',
        'modalParams',
        'configService',
        function ($scope, $modalInstance, modalParams, configService) {

          $scope.msg = modalParams.message ? modalParams.message : '*******';
          $scope.yesButton = modalParams.yes ? modalParams.yes : configService.loctxt.yes;
          $scope.noButton = modalParams.no ? modalParams.no : configService.loctxt.noNeg;
          $scope.bgClass = 'alert-info';
          if (modalParams.level) {
            switch (modalParams.level.substr(0,1).toLowerCase()) {
              case 's':
                $scope.bgClass = 'alert-success';
                break;
              case 'w':
                $scope.bgClass = 'alert-warning';
                break;
              case 'd':
                $scope.bgClass = 'alert-danger';
                break;
            }
          }
          $scope.sayYes = function () {
            $modalInstance.close(true);
          }
          $scope.sayNo = function () {
            $modalInstance.close(false);
          }
        }]);
});

