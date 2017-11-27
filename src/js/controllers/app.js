define(['./module'], function (controllers) {
  'use strict';

  controllers.controller('AppCtrl',
      ['$scope',
       '$rootScope',
        'dbInit',
        'dbConfig',
        'configService',
        'datetime',
        '$state',
        'fileExecUtil',
        function ($scope, $rootScope, dbInit, dbConfig, configService, datetime,
                  $state, fileExecUtil) {
          //var gui = nw.guirequire('nw.gui');
          var zoomPercent = 100,
              win = nw.Window.get(),
              taskCnt = 0,
              MAX_TASKS = 5,
              shortCuts = [];

          console.log("App controller fired");
          $rootScope.firstTime = true; //Only set to false when app ready event is handled
          
          // Set the saved date for the home page room plan to the current date
          configService.set('planDate', datetime.dateOnly(new Date()));

          // set up the app directories
          fileExecUtil.prepAppDirectories().then(() => console.log("App directories created")).catch((err) => console.error(err));
          // add global keyboard shortcuts

          shortCuts.push(new nw.Shortcut({
            key : "Ctrl+Shift+R",
            active : () => {
              console.log("Global desktop keyboard shortcut: " + this.key + " active.");
              shortCuts.forEach((sc) => nw.App.unregisterGlobalHotKey(sc));
              chrome.runtime.reload();
            },
            failed : (msg) => {
              // :(, fail to register the |key| or couldn't parse the |key|.
              console.log("Shortcut failed:" + msg);
            }
          }));
          shortCuts.push(new nw.Shortcut({
            key : "Ctrl+Shift+D",
            active : function() {
              console.log("Global desktop keyboard shortcut: " + this.key + " active.");
              win.showDevTools();
            },
            failed : function(msg) {
              // :(, fail to register the |key| or couldn't parse the |key|.
              console.log(msg);
            }
          }));
          shortCuts.push(new nw.Shortcut({
            key : "Ctrl+Shift+O",
            active : function() {
              console.log("Global desktop keyboard shortcut: " + this.key + " active.");
              zoomPercent += 10;
              win.zoomLevel = Math.log(zoomPercent/100) / Math.log(1.2);
            },
            failed : function(msg) {
              // :(, fail to register the |key| or couldn't parse the |key|.
              console.log(msg);
            }
          }));
          shortCuts.push(new nw.Shortcut({
            key : "Ctrl+Shift+I",
            active : function() {
              console.log("Global desktop keyboard shortcut: " + this.key + " active.");
              zoomPercent -= 10;
              win.zoomLevel = Math.log(zoomPercent/100) / Math.log(1.2);
            },
            failed : function(msg) {
              // :(, fail to register the |key| or couldn't parse the |key|.
              console.log(msg);
            }
          }));
          shortCuts.forEach((sc) => {
            console.log("Registering shortcut for: " + sc.key);
            nw.App.registerGlobalHotKey(sc);
          });

          //$tooltipProvider.options({});

          // Listen for specific menu events and respond by navigating to a particular state.
          $scope.$on('export-tax', function (e, menu, item) {
            $state.go('export_tax');
          });
          
          $scope.$on('export-address', function (e, menu, item) {
            $state.go('export_address');
          });

          $scope.$on('export-one', function (e, menu, item) {
            $state.go('export_one');
          });

          $scope.$on('export-all', function (e, menu, item) {
            $state.go('export_all');
          });

          $scope.$on('import-one', function (e, menu, item) {
            $state.go('import_one');
          });

          $scope.$on('import-all', function (e, menu, item) {
            $state.go('import_all');
          });

          $scope.$on('reset-db', function (e, menu, item) {
            dbConfig.disconnectDB().then(() => {
              dbConfig.reconnectDB().then(() => {
                $state.go('home');
              });
            });
          });
          $scope.$on('close-app', function (e, menu, item) { //brut force close
            dbConfig.disconnectDB();
            win.close(true);
            App.quit();
          });

          // Add base db collections if needed.  This must be at end of module

          // Default Constant values. These are constant values that are used throughout the program but that have
          // values that can be changed but the user. Note the name properties should not be edited since these are used
          // to reference the constants throughout the program
          dbInit.InitModels().then(() => {
            $rootScope.$broadcast(configService.constants.appReadyEvent, {});
            console.log("app.js complete");
          }).catch((err) => {
            console.error(err);
          })
        }]);
});
