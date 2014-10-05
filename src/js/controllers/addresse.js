/**
 * Created by Owner on 05.08.2014.
 *
 * Controller for address (Guest information) page
 */
define(['./module'], function (controllers) {
  'use strict';

  controllers.controller('AddresseCtrl',
      ['$scope',
        '$state',
        '$rootScope',
        function ($scope, $state, $rootScope) {
          console.log("Addresse  controller fired")
          $scope.appTitle = $rootScope.appTitle;
          $scope.appBrand = $rootScope.appBrand;
          $scope.url = $state.current.url;

        }]);
});