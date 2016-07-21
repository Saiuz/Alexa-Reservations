/*
 * Controller for other List maintenance
 */
define(['./module'], function (controllers) {
  'use strict';

  controllers.controller('ListeCtrl',
      ['$scope',
        '$state',
        '$rootScope',
        'dbEnums',
        'configService',
        function ($scope, $state, $rootScope, dbEnums, configService) {
          console.log("List controller fired") ;
          
          $scope.txt = configService.loctxt;
          $scope.appTitle = $rootScope.appTitle;
          $scope.appBrand = $rootScope.appBrand;
          $scope.url = $state.current.url;
          $scope.pageHeading = 'Liste';
          //Get the value of room plan +-weeks saved in local storage default to +-1
          configService.get("RoomPlanWeeks", 1).then(function(val){
            $scope.rmPlanWks = val;
            $scope.currWeeks = val === 1 ? configService.loctxt.weekPlan3 : configService.loctxt.weekPlan5;
          });

          $scope.tabsActive = {
            Addresse: true,
            Firma: false,
            Diverses: false,
            Kur: false,
            Zimmer: false,
            Andere: false
          };
          $scope.tabsDiverses = [
            {
              title: configService.loctxt.dine,
              category: dbEnums.getItemTypeEnum()[2], //Speisen
              lowTax: false
            },
            {
              title: configService.loctxt.drink,
              category: dbEnums.getItemTypeEnum()[3], //Getränke
              lowTax: false
            },
            {
              title: configService.loctxt.services,
              category: dbEnums.getItemTypeEnum()[4], //Dienste
              lowTax: false
            }
          ];
          $scope.tabsKur = [
            {
              title: dbEnums.getItemTypeEnum()[5],
              category: dbEnums.getItemTypeEnum()[5], //VDAK
              lowTax: true
            },
            {
              title: dbEnums.getItemTypeEnum()[6],
              category: dbEnums.getItemTypeEnum()[6], //AOK & Andere
              lowTax: true
            },
            {
              title: dbEnums.getItemTypeEnum()[7],
              category: dbEnums.getItemTypeEnum()[7], //Privat
              lowTax: true
            }
          ];

          $scope.constActive = true;

          $scope.selected = function (tab) {
            for (var p in $scope.tabsActive) {
              $scope.tabsActive[p] = p === tab;
            }
          };
          
          $scope.weekSpanChanged = function (weeks) {
            configService.set("RoomPlanWeeks", weeks)
            $scope.currWeeks = weeks === 1 ? configService.loctxt.weekPlan3 : configService.loctxt.weekPlan5;
          };
        }]);
});