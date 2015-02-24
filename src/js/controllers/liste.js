/**
 * Created by Owner on 05.08.2014.
 *
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
          console.log("Addresse  controller fired") ;

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
          $scope.appTitle = $rootScope.appTitle;
          $scope.appBrand = $rootScope.appBrand;
          $scope.url = $state.current.url;

          $scope.constActive = true;

          $scope.selected = function (tab) {
            for (var p in $scope.tabsActive) {
              if (p === tab) {
                $scope.tabsActive[p] = true;
              }
              else {
                $scope.tabsActive[p] = false;
              }
            }

          }
        }]);
});