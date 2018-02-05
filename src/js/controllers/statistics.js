define(['./module'], function (controllers) {
  'use strict';
  /**
   * Controller to display the hotel occupancy and revenue statistics along with a 
   * graph of the data. The data is shown by year.
   */
  controllers.controller('StatisticsCtrl', ['$scope',
    '$state',
    '$rootScope',
    'configService',
    'dashboard',
    'statCalculations',
    function ($scope, $state, $rootScope, configService, dashboard, statCalculations) {
      console.log("Statistics controller fired");
      $scope.appTitle = $rootScope.appTitle;
      $scope.appBrand = $rootScope.appBrand;
      $scope.url = $state.current.url;
      $scope.pageHeading = configService.loctxt.statistics;

      $scope.txt = configService.loctxt;
      $scope.errShow = false;
      $scope.errMsg = '';
      $scope.working = false;
      $scope.selectedYear = new Date().getFullYear();
      $scope.months = configService.calendarInfo.monthsAbrv;
      $scope.mData = [];

      //$scope.selectedMonth = new Date().getMonth();
      $scope.labels = configService.calendarInfo.monthsAbrv;
      $scope.series = ['Occupancy', 'ADR', 'RevPAR'];
      $scope.data = [];

      $scope.chartOptions = {
        legend: {
          display: true,
          position: 'top'
        }
      };
      $scope.onClick = function (points, evt) {
        console.log(points, evt);
      };
      _buildTabs();

      // When year tab changes
      $scope.yearSelected = function (year) {
        var curMo = new Date().getMonth(),
          curYr = new Date().getFullYear(),
          isCurYr = year === curYr;

        $scope.errShow = false;
        $scope.selectedYear = year;
        _getData();
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
        $scope.years = yr;
        //$scope.months = mo;
      }

      /**
       * Retrieve raw room data for the selected year and calculate
       * the statistics for display. Only the monthly stats are 
       * displayed.
       */
      function _getData() {
        $scope.working = true;
        let start = new Date($scope.selectedYear, 0, 1);
        let end = new Date($scope.selectedYear, 11, 31);
        dashboard.findResDailyStatistics(start, end).then((results) => {
          let stats = statCalculations.calculateRevenueMetrics(results);
          $scope.mData = stats.monthlyResults;
          let dar = [];
          let o = $scope.mData.map((m) => {
            return m.occupancy;
          });
          let a = $scope.mData.map((m) => {
            return m.ADR;
          });
          let r = $scope.mData.map((m) => {
            return m.RevPAR;
          });
          dar.push(o);
          dar.push(a);
          dar.push(r);
          $scope.data = dar;
          $scope.working = false;
          $scope.$apply();
        }).catch((err) => {
          $scope.working = false;
          $scope.errShow = true;
          $scope.errMsg = err;
          $scope.$apply();
        });
      }

      //_getData(); // find any for the default year and month
    }
  ]);
});