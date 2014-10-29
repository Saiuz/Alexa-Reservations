/**
 * Directive to fix input problem with the angular-ui datepicker. This directive was from:
 * http://developer.the-hideout.de/?p=119
 * The problem is discussed here:   https://github.com/angular-ui/bootstrap/issues/956#issuecomment-23942738
 * I modified the code to minimize the "invalid date" messages the datepicker throws when you are entering partial date
 * strings.
 * Also modified year to allow two digit entry where 14 = 2014 not 1914.
 */
define(['./module'], function (directives) {
  'use strict';
  directives.directive('dateFix', ['dateFilter', function (dateFilter) {
    // return the directive link function. (compile function not needed)
    return {
      restrict: 'EA',
      require: 'ngModel', // get a hold of NgModelController

      link: function (scope, element, attrs, ngModel) {

        var format = attrs.datepickerPopup;
        var maxDate = scope[attrs.max];
        var minDate = scope[attrs.min];
        var datefilter = dateFilter;
        var model = ngModel;

        ngModel.$parsers.push(function (viewValue) {
          var newDate = model.$viewValue;
          var date = null;

          // pass through if we clicked date from popup
          if (typeof newDate === "object" || newDate == "") return newDate;

          // build a new date according to initial localized date format
          if (format === "dd.MM.yyyy") {
            // extract day, month and year
            var month = 0;
            var splitted = newDate.split('.');
            var day = parseInt(splitted[0]);
            var curYear = new Date().getFullYear();

            switch (splitted.length) {
              case 1:
                date = new Date(1900,0,1); //make it a valid date object but as far in past as possible
                break;
              case 2:
                month = parseInt(splitted[1]) - 1;
                if (!month) {  // handles something like 23.
                  month = 0;
                }
                date = new Date(curYear,month, day);
                break;
              case 3:
                month = parseInt(splitted[1]) - 1;
                var year = parseInt(splitted[2]);
                year = year ? year < 100 ? year + 2000 : year : curYear;
                date = new Date(year, month, day);
                break;
            }

            // if maxDate,minDate is set make sure we do not allow greater values
            if (maxDate && date > maxDate) date = maxDate;
            if (minDate && date < minDate) date = minDate;

            model.$setValidity('date', true);
            model.$setViewValue(date);
          }
          return date ? date : viewValue;
        });

        element.on('keydown', {scope: scope, varOpen: attrs.isOpen}, function (e) {
          var response = true;
          // the scope of the date control
          var scope = e.data.scope;
          // the variable name for the open state of the popup (also controls it!)
          var openId = e.data.varOpen;

          switch (e.keyCode) {
            case 13: // ENTER
              scope[openId] = !scope[openId];
              // update manually view
              if (!scope.$$phase) scope.$apply();
              response = false;
              break;

            case 9: // TAB
              scope[openId] = false;
              // update manually view
              if (!scope.$$phase) scope.$apply();
              break;
          }

          return response;
        });

        // set input to the value set in the popup, which can differ if input was manually!
        element.on('blur', {scope: scope}, function (e) {
          // the value is an object if date has been changed! Otherwise it was set as a string.
          if (typeof model.$viewValue === "object") {
            element.context.value = isNaN(model.$viewValue) ? "" : dateFilter(model.$viewValue, format);
            if (element.context.value == "") model.$setValidity('required', false);
          }
        });
      }
    };
  }]);
});
