/**
 * axWeekButtons directive provides a set of buttons to advance / decrement a date value by days, weeks or months or to
 * any date via a datepicker button that allows the user to pick any date via a pop-up datepicker.
 * The directive has two attributes that the hosting controller/directive can assign scope properties to:
 *    pickedDate - this is the only required attribute. It contains the "picked" date. It is up to the host to initialize
 *                 this attribute.
 *    startSunday - If attribute contains the string 'true', then the week will start on Sunday.
 *
 * NOTE: There is a bug in the datepicker in this and other directives that is preventing the startSunday value
 * from being read correctly. Not sure why.
 */
define(['./module'], function (directives) {
  'use strict';
  directives.directive('axWeekButtons', ['datetime', 'configService', function (datetime, configService) {
      var linker = function (scope, element, attrs) {
        console.log("axWeekButtons fired")
        var sundayStart = attrs.startSunday === 'true';

        scope.txt = configService.loctxt;
        scope.opended = false;

        scope.goPick = function ($event) {  // launches date picker pop-up
          $event.preventDefault();
          $event.stopPropagation();
          scope.opened = true;

        };

        // NOTE: this is currently ignored, hard wired json object for datepicker-options. Could not get
        // the starting day to work as shown in examples!
        scope.dateOptions = {
          formatYear: 'yy',
          startingDay: sundayStart ? 0 : 1
        };

        scope.dateFormat = "dd.MM.yyyy";

        // button function to change the date value
        scope.goDate = function (offset) {
          if (offset === 0) {
            scope.pickedDate = datetime.dateOnly(new Date());
          }
          else {
            scope.pickedDate = datetime.dateOnly(scope.pickedDate, offset);
          }
        }
      };

      return {
        restrict: 'E',
        link: linker,
        templateUrl: './templates/ax-week-buttons.html',
        scope: {
          pickedDate: '=',
          startSunday: '@'
        }
      };

    }]);
});
