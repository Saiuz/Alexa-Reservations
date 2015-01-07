/**
 * axWeekButtons directive provides a set of buttons to advance / decrement a date value by days, weeks or months. It
 * focuses on an interval of the week that the picked date resides in. In addition to the buttons, it also has a
 * datepicker button that allows the user to pick any date.
 * The directive has four attributes that the hosting controller/directive can assign scope properties to:
 *    pickedDate - this is the only required attribute. It contains the selected date. It can be set initially
 *                 when the directive is first compiled but further modifications to this value externally are
 *                 ignored. If the hosting code wants to set the date after the initial setup, it needs to use the
 *                 'DATE_BTN' event that this directive responsds to.
 *    weekStartDate - Will contain the date of the start of the week that the picked date falls into. (defaults to Monday)
 *    weekEndDate - Will contain the date of the end of the week that the picked date falls into. (defaults to Sunday)
 *    startSunday - If attribute contains the string 'true', then the week will start on Sunday.
 *
 * These attributes, should not be changed by
 * the host code. If the host code wants to change the value of the pickedDate then it should fire a 'weekButtonsSetEvent'
 * event and pass it the date to set the pickedDate property to. This is needed to avoid issues if the host is watching
 * this property.
 */
define(['./module'], function (directives) {
  'use strict';
  directives.directive('axWeekButtons', ['datetime', 'configService', function (datetime, configService) {
      var linker = function (scope, element, attrs) {
        console.log("axWeekButtons fired")
        var week = {},
            ignore = false,
            setByChange = true,
            sundayStart = attrs.startSunday === 'true';

        scope.txt = configService.loctxt;
        scope.opended = false;

        // changes the date attributes to either a preset value or by a number of days.
        function changeDate(days, startDate) {
          scope.pickedDate = days ? datetime.dateOnly(scope.pickedDate, days)
                                    : startDate ? datetime.dateOnly(startDate)
                                                  : datetime.dateOnly(new Date(Date.now()));
          setByChange = true;
          scope.dpdate = scope.pickedDate;
          week = datetime.findWeek(scope.pickedDate, sundayStart);

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

        // Respond to these variables being changed by the host page. The pickedDate is only responded to
        // once.
        scope.$watchCollection('[pickedDate, startSunday]', function(newvals) {
          console.log('*** ax-week-buttons watch fired ' + newvals[0] + '|' + newvals[1] + ' ' + ignore);
          if (newvals[0] && !ignore) {
            ignore = true; //one shot only
            changeDate(null, newvals[0])
          }
          if (newvals[1]) {
            sundayStart = newvals[1] === 'true';
            changeDate(null, scope.pickedDate); //don't change picked date, just week start and end attributes
          }
        });

        // date piker stuff
        scope.$watch('dpdate', function(newval) {
           if (newval) {
             if (setByChange) {
               setByChange = false;
             }
             else {
               changeDate(null, newval);
             }
           }
        });

        scope.goPick = function ($event) {
          $event.preventDefault();
          $event.stopPropagation();
          scope.opened = true;
          //$scope.openEnd = false;
        };
        scope.dateOptions = {
          formatYear: 'yy',
          startingDay: 1,
          showWeeks: false,
        };
        scope.dateFormat = "dd.MM.yyyy";

        // respond to an event to change the calendar date
        scope.$on(configService.constants.weekButtonsSetEvent, function (event, dateval) {
          console.log('*** ax-week-buttons ON event fired ', dateval);
           if (datetime.isDate(dateval)) {
             changeDate(null,dateval);
             //scope.$apply();
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
          pickedDate: '=',
          weekStartDate: '=',
          weekEndDate: '=',
          startSunday: '@'
        }
      };

    }]);
});
