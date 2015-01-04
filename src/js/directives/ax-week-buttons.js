/**
 * axWeekButtons directive provides a set of buttons to advance / decrement a date value by days or weeks.
 */
define(['./module'], function (directives) {
  'use strict';
  directives.directive('axWeekButtons', ['datetime', 'configService',
    function (datetime, configService) {
      var linker = function (scope, element, attrs) {
        console.log("axWeekButtons fired")
        var week = {},
            ignore = false;

        scope.txt = configService.loctxt;
        changeDate();

        function changeDate(days, startDate) {
          ignore = true;
          scope.dateInWeek = days ? datetime.dateOnly(scope.dateInWeek, days)
                                    : startDate ? datetime.dateOnly(startDate)
                                                  : datetime.dateOnly(new Date(Date.now()));
          week = datetime.findWeek(scope.dateInWeek);

          // Before setting directive attributes, make sure they exist
          if (attrs.weekStartDate) {
            scope.weekStartDate = week.weekStart;
          }

          if (attrs.weekEndDate) {
            scope.weekEndDate = week.weekEnd;
          }

          if (attrs.dayInWeek) {
            scope.dayInWeek = week.currentDay;
          }
        }

        // Respond to this variable being changed by the host page.
        scope.$watch('dateInWeek', function(newVal) {
          if (newVal && !ignore) {
            changeDate(null, newVal)
          }
          else {
            ignore = false;
          }
        });

        scope.goNext = function () {
          changeDate(1);
        }
        scope.goNextWeek = function () {
          changeDate(7);
        }
        scope.goNextMonth = function () {
          changeDate(30); //TODO may need to refine go to next month same day?
        }
        scope.goPrev = function() {
          changeDate(-1);
        }
        scope.goPrevWeek = function(){
          changeDate(-7);
        }
        scope.goPrevMonth = function () {
          changeDate(-30);
        }
        scope.goToday = function() {
          changeDate();
        }
      };

      return {
        restrict: 'E',
        link: linker,
        templateUrl: './templates/ax-week-buttons.html',
        scope: {
          weekStartDate: '=',
          weekEndDate: '=',
          dateInWeek: '=',
          dayInWeek: '='
        }
      };

    }]);
});
