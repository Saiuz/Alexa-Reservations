/**
 * Directive to create a table of Expense items of a particular type. That can be edited and new items created.
 * todo- calculate and display running total amount for items of the specific type
 * todo- add a default value to the item list and  value for when item list is empty (more attributes?)
 * todo- callback function when item has been added (so controller/model can save values in db)
 */
define(['./module'], function (directives) {
  'use strict';
  directives.directive('axExpenseItemList', ['Reservation', '$filter', function (Reservation, $filter) {
    var linker = function (scope, element, attrs) {
      console.log("axExpenseItemList linker fired");

      // build the local select list from the expenseItemArray
      // filter the list by the itemType property. Note we must wait until
      // both properties have been set during the compile phase of the hosting page
      scope.col1Title = attrs.itemTitle ? attrs.itemTitle : 'Item';
      scope.col2Title = attrs.countTitle ? attrs.countTitle : 'Count';
      scope.col3Title = attrs.priceTitle ? attrs.priceTitle : 'Price';
      scope.$watchCollection('[itemTypeArray, itemType, expenseItemArray]', function (newvals) {
        console.log("axExpenseItemList filter fired");
        if (newvals[0] && newvals[1] && newvals[2]) {
          buildInitialList();
          scope.calculateTotals();
        }
      });

      scope.calculateTotals = function() {
        var sum = 0;
        angular.forEach(scope.expenseItemArray, function (item) {
          if (item.category === scope.itemType) {
            sum += (item.count * item.price);
          }
        });
         scope.total = sum;
      } ;

      // removes items from the displayed item types list that have already been added to
      // the expenseItems array.
      var filterOutExistingItems = function () {
        scope.itemList = $filter('filter')(scope.itemList, {_id: 0}, function (actual) {
          return isNotIn(actual);
        });
      };

      // function that builds the initial (filtered) expense item array
      var buildInitialList = function () {
        scope.itemList = $filter('filter')(scope.itemTypeArray, {category: attrs.itemType}, true);
        filterOutExistingItems();
      };

      // function that checks that a particular expense item type is not already added to
      // the expense items array
      var isNotIn = function (id) {
        var found = true;
        angular.forEach(scope.expenseItemArray, function (item) {
          if (item.type_id === id) {
            found = false;
          }
        });
        return found;
      };

      // add the selected expense item to the reservation
      //
      scope.addExpenseItem = function () {
        var temp = new Reservation();
        var ix = scope.selected;
        var item = temp.expenses.create(
            {
              name: ix.item_name,
              code: ix.item_code,
              count: (attrs.maxCount ? Number(attrs.maxCount) : 1),
              price: ix.default_unit_price,
              item_type: scope.itemType,
              type_id: ix._id.id,
              display_string: ix.display_string,
              taxable_rate: ix.taxable_rate,
              multiple_allowed: ix.multiple_allowed
            }
        );
        scope.expenseItemArray.push(item);
        scope.calculateTotals();
        // now remove the added item from the list of item types
        filterOutExistingItems();
      };

      scope.removeItem = function (index) {
        scope.expenseItemArray.splice(index, 1);
        scope.calculateTotals();
        buildInitialList(); //need to re-add removed item to the pick list
      }

      scope.selected = {};
    };

    return {
      restrict: 'AE',
      link: linker,
      templateUrl: './templates/ax-expense-item-list.html',
      scope: {
        itemTypeArray: '=',
        expenseItemArray: '=',
        itemType: '@',
        defaultCount: '@',
        maxCount: '@',
        itemTitle: '@',
        countTitle: '@',
        priceTitle: '@'
        // todo-extend for count and plan price logic
      }
    };
  }]);
});