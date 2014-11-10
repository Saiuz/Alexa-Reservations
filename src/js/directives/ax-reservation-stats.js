/**
 * Created by Owner on 05.08.2014.
 *
 * Directive that will display a table of reservation statistics
 */
define(['./module'], function (directives) {
  'use strict';
  directives.directive('axReservationStats', ['Reservation', 'dashboard', 'datetime', function (Reservation, dashboard, datetime) {

    var linker = function (scope, element, attrs) {
      scope.stats = [
          [0,0,26,20,6],
          [1,11,25,19,6],
          [0,2,36,24,12],
          [0,0,38,26,12],
          [11,1,27,21,6],
          [0,0,28,21,7],
          [1,0,27,20,7]
      ];
      scope.currentDay = 0;
      scope.weekStart = null;
      scope.weekEnd = null;

      scope.$watch('dateInWeek', function (newval, oldval) {
        console.log('Res Stats Directive watch fired, value is: ' + newval + ' | ' + oldval);
        var week = datetime.findWeek(newval, false); // week starts monday
        scope.currentDay = week.currentDay;
        scope.weekStart = week.weekStart;
        scope.weekEnd = week.weekEnd;
        // get stats array from dashboard service

      });
    };

    return {
      restrict: 'A',
      link: linker,
      templateUrl: './templates/ax-reservation-stats.html',
      scope: {
        dateInWeek: '='
      }
    }
  }]);
});