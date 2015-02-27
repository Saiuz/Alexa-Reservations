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
        'importExport',
        'fileDialogs',
        'modals',
        'appConstants',
        function ($scope, $state, $rootScope, configService, importExport, fileDialogs, modals, appConstants) {
          console.log("Export controller fired");
          $scope.appTitle = $rootScope.appTitle;
          $scope.appBrand = $rootScope.appBrand;
          $scope.url = $state.current.url;
          $scope.pageHeading = configService.loctxt.exporting;

          $scope.working = false;
          $scope.complete = false;
          $scope.showErr = false;
          $scope.errMsg = '';

          // determine mode based on url, find the last part of the url e.g. /export/tax ... tax
          var mode = $state.current.url.replace(/\/[^/]*[^/]\//, '');
          $scope.mode = mode;
          $scope.txt = configService.loctxt;
          switch (mode) {
            case 'all':

              fileDialogs.saveAs(function (fpath) {
                    $scope.path = fpath;
                    $scope.working = true;
                    $scope.$apply();
                    importExport.exportAll(fpath).then(function () {
                      $scope.working = false;
                      $scope.complete = true;
                      $scope.$apply();
                      setTimeout(function () {
                        $state.go('home');
                      }, 4000);
                    }, function (err) {
                      $scope.working = false;
                      $scope.showErr = true;
                      $scope.errMsg = err;
                    });
                  },importExport.getDefaultExportFilePath(), ['zip']);
              break;
          }

          $scope.home = function () {
            $state.go('home');
          };
        }]);
});