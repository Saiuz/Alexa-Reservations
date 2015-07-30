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
        'datetime',
        function ($scope, $state, $rootScope, configService, importExport, fileDialogs, modals, appConstants, datetime) {
          console.log("Export controller fired");
          var taxDate;
          $scope.appTitle = $rootScope.appTitle;
          $scope.appBrand = $rootScope.appBrand;
          $scope.url = $state.current.url;
          $scope.pageHeading = configService.loctxt.exporting;

          $scope.working = false;
          $scope.complete = false;
          $scope.records = 0;
          $scope.showAll = false;
          $scope.showOne = false;
          $scope.showTax = false;
          $scope.showErr = false;
          $scope.showHome = true;
          $scope.errMsg = '';

          // determine mode based on url, find the last part of the url e.g. /export/tax ... tax
          var mode = $state.current.url.replace(/\/[^/]*[^/]\//, '').toLowerCase();
          $scope.mode = mode;
          $scope.showAll = (mode === 'all');
          $scope.showOne = (mode === 'one');
          $scope.showTax = (mode === 'tax');
          $scope.txt = configService.loctxt;
          switch (mode) {
            case 'all':
              $scope.showAll = true;
              fileDialogs.saveAs(function (fpath) {
                    $scope.path = fpath;
                    $scope.working = true;
                    $scope.$apply();
                    importExport.exportAll(fpath).then(function () {
                      $scope.working = false;
                      $scope.complete = true;
                      $scope.showHome = false;
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

            case 'one':
              $scope.showOne = true;
              $scope.models = importExport.getAvailableModels();
              $scope.selectedModel = $scope.models[0];
              break;

            case 'tax':
              taxDate = datetime.dateOnly(new Date(), -15); //Backup 15 days to get the month.
              $scope.showTax = true;
              $scope.startDate = datetime.findMonthDates(taxDate).monthStart;
              $scope.endDate = datetime.findMonthDates(taxDate).monthEnd;
              //displayCalendar
              break
          }

          // for date pickers
          $scope.openStart = function ($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.openedStart = true;
            //$scope.openEnd = false;
          };
          $scope.openEnd = function ($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.openedEnd = true;
            //$scope.openStart=false;
          };
          $scope.dateOptions = {
            formatYear: 'yy',
            startingDay: 1,
            showWeeks: false,
            currentText: configService.loctxt.today,
            closeText: configService.loctxt.ok
          };
          $scope.dateFormat = "dd.MM.yyyy";


          // Starts the export process based on the model chosen
          $scope.exportModel = function (model) {
            //get file path and name
            fileDialogs.saveAs(function (fpath) {
              $scope.path = fpath;
              $scope.working = true;
              $scope.$apply();
              importExport.exportToFile(fpath, model.value, model.fileType).then(function (cnt) {
                $scope.working = false;
                $scope.records = cnt;
                $scope.complete = true;
                $scope.showHome = false;
                $scope.$apply();
                setTimeout(function () {
                  $state.go('home');
                }, 4000);
              }, function (err) {
                $scope.working = false;
                $scope.showErr = true;
                $scope.errMsg = err;
              });
            },importExport.getDefaultExportFilePath(mode,model.model_name,model.fileType), [model.fileType]);
          };

          // Starts the generation and export of the tax report
          $scope.taxReport = function () {
            //get file path and name
            fileDialogs.saveAs(function (fpath) {
              $scope.path = fpath;
              $scope.working = true;
              $scope.$apply();
              importExport.exportTaxes(fpath, $scope.startDate, $scope.endDate).then(function (cnt) {
                $scope.working = false;
                $scope.records = cnt;
                $scope.complete = true;
                $scope.showHome = false;
                $scope.$apply();
                setTimeout(function () {
                  $state.go('home');
                }, 4000);
              }, function (err) {
                $scope.working = false;
                $scope.showErr = true;
                $scope.errMsg = err;
              });
            },importExport.getDefaultTaxFilePath($scope.startDate, $scope.endDate), ['csv']);

          };

          $scope.home = function () {
            $state.go('home');
          };
        }]);
});