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
          $scope.records = 0;
          $scope.showAll = false;
          $scope.showOne = false;
          $scope.showErr = false;
          $scope.showHome = true;
          $scope.errMsg = '';
          $scope.success = configService.loctxt.importEnded;

          // determine mode based on url, find the last part of the url e.g. /export/tax ... tax
          var mode = $state.current.url.replace(/\/[^/]*[^/]\//, '');
          $scope.mode = mode;
          $scope.txt = configService.loctxt;
          switch (mode) {
            case 'all':
              $scope.showAll = true;
              modals.yesNoShow(configService.loctxt.importWarning, function (result) {
                if (result) {
                  var win = gui.Window.get();
                  fileDialogs.openFile(function (fpath) {
                        $scope.path = fpath;
                        $scope.working = true;
                        $scope.$apply();
                        importExport.importAll(fpath).then(function () {
                          $scope.working = false;
                          $scope.success = configService.loctxt.importEnded + ' - ' + configService.loctxt.appRestart;
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

            case 'one':
              $scope.showOne = true;
              $scope.models = importExport.getAvailableModels();
              $scope.selectedModel = $scope.models[0];
              break;
          }

          $scope.importModel = function (model) {
            var warningText = configService.loctxt.importWarning2a + model.model_name + configService.loctxt.importWarning2b;

            if (!model) return;

            modals.yesNoShow(warningText, function (result) {
              if (result) {
                var win = gui.Window.get();
                fileDialogs.openFile(function (fpath) {
                  $scope.path = fpath;
                  $scope.working = true;
                  $scope.$apply();
                  importExport.importFromFile(fpath, model.value, model.fileType).then(function (cnt) {
                    $scope.working = false;
                    $scope.success = configService.loctxt.importEnded + ' - ' + cnt + ' ' + configService.loctxt.dataItemsWritten;
                    $scope.records = cnt;
                    $scope.complete = true;
                    $scope.showHome = false;
                    $scope.$apply();
                    setTimeout(function () {
                      $state.go('home');
                      //win.reloadDev(); // reload application
                    }, 5000);
                  }, function (err) {
                    $scope.working = false;
                    $scope.showErr = true;
                    $scope.errMsg = err;
                  });
                }, importExport.getDefaultImportDirectory(model), false, [model.fileType]);
              }
              else {
                $state.go('home');
              }
            });
          };

          $scope.home = function () {
            $state.go('home');
          };
        }]);
});