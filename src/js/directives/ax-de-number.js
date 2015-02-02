/**
 * A directive to use on an input field that will accept decimal numbers. It will convert numbers entered in
 * German format 1.000,33 to US format 1000.33. The directive is applied as an attribute on an input of type="text".
 * It is important that the input type is "text".
 * Usage: <input type="text" ng-model="price" ax-de-number />
 */
define(['./module'], function (directives) {
  'use strict';
  directives.directive('axDeNumber', ['$filter', 'convert', function ($filter, convert) {
    var linker = function (scope, element, attrs, modelCtrl) {
      //convert from model to view format
      modelCtrl.$formatters.push(function(input) {
        if (input == null) {
          return;
        }
        input = input.toString();
        return $filter('number')(input);
      });
      //convert from view to model format
      return modelCtrl.$parsers.push(function(input) {
        if (input == null) {
          return;
        }
        return convert.deNumberToDecimal(input);
      });
    };

    return {
      require: 'ngModel',
      link: linker
    };
  }]);
});
