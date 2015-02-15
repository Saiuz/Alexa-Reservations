/**
 * Created by bob on 2/7/15.
 */
define(['./module'], function (controllers) {
  'use strict';

  controllers.controller('ImportCtrl',
      ['$scope',
        '$state',
        '$rootScope',
        'configService',
        'importExport',
        'fileDialogs',
        'modals',
        'appConstants',
        function ($scope, $state, $rootScope, configService, importExport, fileDialogs, modals, appConstants) {
          console.log("Import controller fired");
          var gui = require('nw.gui');

          $scope.appTitle = $rootScope.appTitle;
          $scope.appBrand = $rootScope.appBrand;
          $scope.url = $state.current.url;
          $scope.pageHeading = configService.loctxt.importing;

          $scope.working = false;
          $scope.complete = false;
          $scope.showErr = false;
          $scope.showHome = false;
          $scope.errMsg = '';
          $scope.success = configService.loctxt.importEnded;

          // determine mode based on url, find the last part of the url e.g. /export/tax ... tax
          var mode = $state.current.url.replace(/\/[^/]*[^/]\//, '');
          $scope.mode = mode;
          $scope.txt = configService.loctxt;
          switch (mode) {
            case 'all':
              modals.yesNoShow(configService.loctxt.importWarning, function (result) {
                if (result) {
                  var win = gui.Window.get();
                  $scope.showHome = true;
                  fileDialogs.openFile(function (fpath) {
                        $scope.path = fpath;
                        $scope.working = true;
                        $scope.$apply();
                        importExport.importAll(fpath).then(function () {
                          $scope.working = false;
                          $scope.success = configService.loctxt.importEnded + ' - ' + 'Application will restart in 5 seconds';
                          $scope.complete = true;
                          $scope.showHome = false;
                          $scope.$apply();
                          setTimeout(function () {
                            win.reloadDev(); // reload application
                          }, 5000);
                        }, function (err) {
                          $scope.working = false;
                          $scope.showErr = true;
                          $scope.errMsg = err;
                        });
                      }, importExport.getDefaultImportDirectory(), ['zip']);
                }
                else {
                  $state.go('home');
                }
              });
              break;
          }

          $scope.home = function () {
            $state.go('home');
          };
        }]);
});