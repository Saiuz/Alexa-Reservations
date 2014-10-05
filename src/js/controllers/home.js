define(['./module'], function (controllers) {
  'use strict';

  controllers.controller('HomeCtrl',
      ['$scope',
        '$state',
        '$rootScope',
        'datetime',
        function ($scope, $state, $rootScope, datetime) {
          console.log("Home controller fired")
          //local variables
          var week = {};

          var changeDate = function (days) {
            $scope.theDate = days ? datetime.dateOnly($scope.theDate, days) : datetime.dateOnly(new Date(Date.now()));
            week = datetime.findWeek($scope.theDate);
            $scope.weekStart = week.weekStart;
            $scope.weekEnd = week.weekEnd;
            $scope.theNextDate = datetime.dateOnly($scope.theDate, + 1);

          }
          // other scope variables
          // Required for nav and page header
          $scope.appTitle = $rootScope.appTitle;
          $scope.appBrand = $rootScope.appBrand;
          $scope.url = $state.current.url;

          $scope.theDate = datetime.dateOnly(new Date(Date.now()));
          week = datetime.findWeek($scope.theDate);
          $scope.weekStart = week.weekStart;
          $scope.weekEnd = week.weekEnd;
          $scope.theNextDate = datetime.dateOnly($scope.theDate, 1);
          $scope.selectedReservation = 0;
          $scope.pageHeading = "Zimmer Plan " // + $scope.theDate.getDate() + '.' + ($scope.theDate.getMonth() + 1) + '.' + $scope.theDate.getFullYear()
          $scope.showDetails = ($scope.selectedReservationId > 0);

          // scope functions:
          $scope.goNext = function () {
             changeDate(1);
          }
          $scope.goNextWeek = function () {
            changeDate(7);
          }
          $scope.goPrev = function() {
            changeDate(-1);
          }
          $scope.goPrevWeek = function(){
            changeDate(-7);
          }
          $scope.goToday = function() {
            changeDate();
          }
          $scope.clearSelected = function() {
            $scope.selectedReservation = 0;
          }
        }]);
});
