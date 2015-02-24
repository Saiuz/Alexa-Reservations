/**
 * Directive to create a list for the App constants Collection. The only editable value is either the nvalue or svalue
 * parameter.
 * Note: Using an isActive attribute. This gives control to the host to turn the list on or off.
 */
define(['./module'], function (directives) {
  'use strict';
  directives.directive('axAppContantsList', ['AppConstants', '$filter', 'convert', function (AppConstants, $filter, convert) {
    var linker = function (scope, element, attrs, modelCtrl) {
      scope.items = [];
      scope.show = false;
      scope.hasErr = false;
      scope.errMsg = '';
      scope.textNum = {}; //Object that will hold each contants' numeric value in text form. (Needed for handling
      //number format localization since the xeditable directive doesn;t handle German number format.

      scope.$watch('isActive', function (newVal) {
        if (newVal) {
          AppConstants.find().exec(function (err, clist) {
            if (err) {
              scope.hasErr = true;
              scope.errMsg = err;
            }
            else {
              scope.hasErr = false;
              _convertNumToText(clist);
              scope.items = clist;
              scope.show = true;
            }
            scope.$apply();
          });

        }
        else {
          scope.show = false;
          scope.hasErr = false;
          scope.items = []; //If we are not active then clear items and hide contents of directive
        }
      });

      scope.updateConstant = function (id) { //id is the numeric value not the _id object.
        var num = scope.textNum['_' + id].replace(/[^0-9,.]/g, '');
        var item = _findItem(id);

        if (item) {
          item.nvalue = num ? convert.deNumberToDecimal(num, true) : item.svalue ? undefined : 0; //need to have some value if the string value is not defined
          item.save(function (err) {
            if (err && num) {
              scope.textNum['_' + id] = '*error*';
            }
            scope.$apply();
          });
        }
      };

      function _convertNumToText(clist) {
        var txObj = {};
        clist.forEach(function (c) {  //convert all numeric values to text
          if (c.nvalue) {
            txObj['_' + c._id.id] = $filter('number')(c.nvalue, 2);
          }
        });
        scope.textNum = txObj;
      }

      function _findItem(id) {
        var item;
        scope.items.forEach(function (c) {
          if (c._id.id === id) {
            item = c;
          }
        });
        return item;
      }

    };

    return {
      restrict: 'E',
      link: linker,
      templateUrl: './templates/ax-app-constants-list.html',
      scope: {
        isActive: '=' // if true then we are on a dom element that is visible.
      }
    };
  }]);
});
