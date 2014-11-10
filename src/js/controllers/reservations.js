/**
 * Created by Owner on 05.08.2014.
 * Reservations page controller
 * todo-there is too much business logic in the controller, needs to be factored out into a more extensive model (in progress)
 */
define(['./module'], function (controllers) {
  'use strict';

  controllers.controller('ReservationsCtrl',
      ['$scope',
        '$state',
        '$rootScope',
        function ($scope, $state, $rootScope) {
          console.log("Reservation controller fired");
          $scope.appTitle = $rootScope.appTitle;
          $scope.appBrand = $rootScope.appBrand;
          $scope.url = $state.current.url;
          $scope.pageHeading = "Reservierung";


        }]);
});