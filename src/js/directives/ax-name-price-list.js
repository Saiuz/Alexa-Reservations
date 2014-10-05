/**
 * directive used for adding/editing/removing items from an array of ExpenseItem objects
 * (such as resources and expenses)
 */
define(['./module'], function (directives) {
  'use strict';
  directives.directive('axNamePriceList', ['Reservation', function (Reservation) {
    var linker = function (scope, element, attrs) {
       scope.addExpenseItem = function () {
         var temp = new Reservation();
         var item = temp.expenses.create(
             {
               name: 'leer'
             }
         );
         scope.itemTypeArray.push(item);
       };
      scope.showItem = function (item) {
       var selected = [];
        if (item.name) {
          return item_name;
        }
        else {
          return item.name = 'leer';
        }
      }
    };

    return {
      restrict: 'E',
      link: linker,
      templateUrl: './templates/namePriceList.html',
      scope: {
        itemTypeArray: '=',
        expenseItemArray: '=',
        emptySourceText: '@'
        // todo-extend for count and plan price logic
      }
    };
  }]);
});