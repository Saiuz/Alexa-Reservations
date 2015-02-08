/**
 * Created by bob on 2/7/15.
 */
define(['./module'], function (controllers) {
  'use strict';

  controllers.controller('ExportCtrl',
      ['$scope',
        '$state',
        '$rootScope',
        'configService',
        function ($scope, $state, $rootScope, configService) {
          console.log("Export controller fired")
          $scope.appTitle = $rootScope.appTitle;
          $scope.appBrand = $rootScope.appBrand;
          $scope.url = $state.current.url;
          $scope.pageHeading = configService.loctxt.exporting;

          // determine mode based on url, find the last part of the url e.g. /export/tax ... tax
          var mode = $state.current.url.replace(/\/[^/]*[^/]\//, '');
          $scope.mode = mode;



        }]);
});