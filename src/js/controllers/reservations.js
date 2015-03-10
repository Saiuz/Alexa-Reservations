/**
 * Created by Owner on 05.08.2014.
 * Reservations page controller. Recalls past and present reservations
 */
define(['./module'], function (controllers) {
  'use strict';

  controllers.controller('ReservationsCtrl',
      ['$scope',
        '$state',
        '$rootScope',
        'configService',
        'dashboard',
        'modals',
        function ($scope, $state, $rootScope, configService, dashboard, modals) {
          console.log("Reservations controller fired");
          $scope.appTitle = $rootScope.appTitle;
          $scope.appBrand = $rootScope.appBrand;
          $scope.url = $state.current.url;
          $scope.pageHeading = configService.loctxt.reservations;

          $scope.txt = configService.loctxt;
          $scope.errShow = false;
          $scope.errMsg = '';
          $scope.working = false;
          $scope.pastOnly = false; //Todo connect to a UI object, currently turned off - will need a watch to handle logic
          $scope.selectedYear = new Date().getFullYear();
          $scope.selectedMonth = new Date().getMonth();
          $scope.reservations = [];
          _buildTabs();

          // When year tab changes
          $scope.yearSelected = function (year) {
            var curMo = new Date().getMonth(),
                curYr = new Date().getFullYear(),
                isCurYr = year === curYr;

            $scope.errShow = false;
            $scope.selectedYear = year;
            // if 'pastOnly', activate/deactivate month tabs based on year and reselect if current selected tab is to be deactivated
            if ($scope.pastOnly) {
              $scope.months.forEach(function (mobj) {
                mobj.disabled = isCurYr && mobj.mm > curMo;
                if (mobj.disabled && mobj.active && mobj.mm > curMo) {
                  mobj.active = false;
                  $scope.months[curMo].active = true;
                  $scope.selectedMonth = curMo;
                }
              });
            }
            _getData();
          };

          // When month tab changes
          $scope.monthSelected = function (month) {
            $scope.errShow = false;
            $scope.selectedMonth = month;
            _getData();
          };

          // Edit active reservations, if a reservation is late checkin, redirect to home page, if late checkout,
          // redirect to rechnung
          $scope.edit= function (resNum) {
            var model = modals.getModelEnum().reservation,
                dataObj = {data: resNum};
            modals.update(model,dataObj,function(result) {
              _getData();
            });
          };

          $scope.viewBill = function (resNum, room, guest) {
            modals.billShow(resNum, room, guest);
          };

          $scope.view = function (resNum) {
            var model = modals.getModelEnum().reservation,
                dataObj = {data: resNum};
            modals.read(model,dataObj);
          };

          // Builds the initial tabs Sets and sets active tabs to current year, current month
          function _buildTabs() {
             var mo = [],
                 yr = [],
                 curMo = new Date().getMonth(),
                 curYr = new Date().getFullYear(),
                 lastYr = $scope.pastOnly ? curYr : curYr + 1,
                 ix = 0,
                 mobj, yobj;

             for (var i = curYr - 2; i <= lastYr; i++) {
               yobj = {
                 year: i,
                 active: i === $scope.selectedYear
               };
               yr.push(yobj);
             }
             configService.calendarInfo.monthsAbrv.forEach(function (m) {
               mobj = {
                 month: m,
                 active: ix === $scope.selectedMonth,
                 disabled: $scope.pastOnly && ix > curMo,
                 mm: ix
               };
               mo.push(mobj);
               ix++;
             });
            $scope.years = yr;
            $scope.months = mo;
          }

          function _getData() {
            $scope.working = true;
            dashboard.getReservationsInMonth($scope.selectedMonth, $scope.selectedYear).then(function (results) {
              $scope.reservations = results;
              $scope.working = false;
            }, function(err) {
              $scope.working = false;
              $scope.errShow = true;
              $scope.errMsg = err;
            });
          }

          _getData(); // find any for the default year and month
        }]);
});