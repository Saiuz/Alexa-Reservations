/**
 * Directive to provide a delayed input. The value parameter will be updated after a fixed delay. Added the ability
 * to have a minimum characters typed before it triggers. It will also filter out any regex special characters
 * except starting caret '^' characters.
 * This is based on the answer found here:
 * http://stackoverflow.com/questions/18050099/angularjs-how-to-make-inputtext-ngmodel-delay-valued-while-typing
 * Note this directive will not be needed for angular 1.3
 */
define(['./module'], function (directives) {
  'use strict';
  directives.directive('axDelayedInput', ['$timeout',
    function ($timeout) {
      var linker = function (scope, element, attrs) {
        scope.timeout = parseInt(scope.timeout);
        scope.minChars = parseInt(scope.minChars);

        // if the value attribute is externally changed, reflect change in the input box.
        scope.$watch('value', function (newval) {
          scope.currentInputValue = newval;
        });
        scope.update = function () {
          scope.currentInputValue = _cleanInput(scope.currentInputValue);
          if (scope.minChars && scope.currentInputValue.length < scope.minChars) return;
          if (scope.pendingPromise) {
            $timeout.cancel(scope.pendingPromise);
          }

          scope.pendingPromise = $timeout(function () {
            scope.value = scope.currentInputValue;
          }, scope.timeout);
        };

        scope.clear = function () {
          scope.currentInputValue = '';
          scope.value = '';
          if (scope.clearCallback) {
            scope.clearCallback();
          }
        };

        function _cleanInput(val) {
          var clean = /[\\.\#\^\$\|\?\+\(\)\[\{\}\]*]/g, //contains all regex special characters
              startCaret = (val.match(/^\^+/) || []).length ? val.match(/^\^+/)[0].length : 0,
              addCaret = '^^^^^^^^^^^^^^';
          val = val.replace(clean,'');
          if (val || startCaret) {
            return addCaret.substr(0, startCaret) + val;
          }
          else {
            return '';
          }
        }

      }; //end link function

      return {
        restrict: 'E',
        link: linker,
        template: '<div class="input-group"><input class="form-control" type="text" ng-model="currentInputValue"  ng-change="update()" placeholder="{{placeholder}}"/>'
        + '<div class="input-group-btn"><button class="btn btn-small pull-right" type="button" ng-click="clear()">'
        + '<i class="glyphicon glyphicon-remove"></i></button></div></div>',
        scope: {
          value: '=',
          timeout: '@',
          minChars: '@',
          placeholder: '@',
          clearCallback: '='
        }
      };
    }]);
});