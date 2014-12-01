/**
 * Directive to create a table of Expense items of a particular type. That can be edited and new items created.
 * todo- calculate and display running total amount for items of the specific type
 * todo- add a default value to the item list and  value for when item list is empty (more attributes?)
 * todo- callback function when item has been added/edited (so controller/model can save values in db)
 * TODO- fix add logic, add button to add item not on change of item selection
 */
define(['./module'], function (directives) {
  'use strict';
  directives.directive('axExpenseItemList', ['ExpenseItem', '$filter', 'configService',
        function (ExpenseItem, $filter, configService) {
    var linker = function (scope, element, attrs) {
      console.log("axExpenseItemList linker fired");

      // build the local select list from the expenseItemArray
      // filter the list by the itemType property. Note we must wait until
      // both properties have been set during the compile phase of the hosting page
      scope.txt = configService.loctxt;
      scope.hideB = false;  //todo-need button that shows if this is true that will allow the toggling of hidden items.
      scope.selected = {};

      var curItemInfo = []; // contains key information about the current items, use by the item filter

      scope.$watchCollection('[reservationVm, itemType, room, guest, hide]', function (newvals) {
        console.log("axExpenseItemList filter fired");
        if (newvals[0] && newvals[1] && newvals[2] && newvals[3]) {
          scope.col1Title = attrs.itemTitle ? attrs.itemTitle : configService.loctxt.item;
          scope.col2Title = attrs.countTitle ? attrs.countTitle : configService.loctxt.times;
          scope.col3Title = attrs.priceTitle ? attrs.priceTitle : configService.loctxt.price;
          scope.rvm = newvals[0];
          buildInitialList();
          scope.selected = scope.itemList.length > 0  ? scope.itemList[0] : {};
          scope.calculateTotals();
        }
        if (newvals[4]) {
          scope.hideB = newvals[3] === 'true';
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
      //var filterOutExistingItems = function () {
      //  scope.itemList = $filter('filter')(scope.itemList, {_id: 0}, function (actual) {
      //    return isNotIn(actual);
      //  });
      //};

      // Retrieves the name guest and room properties of the current items that are of the specified category,
      // this list is used to filter out the items that allow for only one item per person or per room
      var getCurrentItems = function () {
        curItemInfo = [];
        scope.rvm.res.expenses.forEach(function (exp) {
          if (item.category === attrs.itemType) {
            var item = {
              name: exp.name,
              guest: exp.guest,
              room: exp.room
            };
            curItemInfo.push(item);
          }
        })
      };

      // function that determines if an item should be excluded from the item pick list. There are a number reasons:
      // If plan includes breakfast then breakfast should be removed.
      var excludeItem = function (item) {
        if (item.name === configService.loctxt.breakfast) {
          return scope.rvm.includesBreakfast;
        }

        return false;
      };

      // function that builds the initial (filtered) expense item array
      var buildInitialList = function () {
        //scope.itemList = $filter('filter')(scope.itemTypeArray, {category: attrs.itemType, no_display: false}, true);
        scope.itemList = $filter('filter')(scope.rvm.expenseItemTypes,function(item){
         return (item.category === attrs.itemType
                 && !item.no_display && !excludeItem(item));
        });
        //filterOutExistingItems();
      };

      // function that checks that a particular expense item type is not already added to
      // the expense items array
      //var isNotIn = function (id) {
      //  var found = true;
      //  angular.forEach(scope.expenseItemArray, function (item) {
      //    if (item.type_id === id) {
      //      found = false;
      //    }
      //  });
      //  return found;
      //};

      // add the selected expense item to the reservation
      //
      scope.addExpenseItem = function () {
        scope.rvm.addExpenseItemSave(scope.selected, scope.room, scope.guest).then(function (){
          scope.calculateTotals();
        }, function(err){
          //todo-figure out error handling
        });

      };

      scope.removeItem = function (id) {
        scope.rvm.res.expenses.id(id).remove();
        scope.rvm.res.save(function (err) {
          if (err) {
            //todo-figure out error handling
          }
          else {
            console.log(scope.rvm.res);
            scope.calculateTotals();
          }
        });
        //scope.rvm.removeExpenseItemSave(id).then(function (){
        //  scope.calculateTotals();
        //  buildInitialList(); //need to re-add removed item to the pick list
        //}, function(err){
        //  //todo-figure out error handling
        //});
      };

      // We have edited an expense simply save reservation to lock it in.
      scope.updateExpense = function() {
        scope.rvm.res.save(function (err) {
          if (err) {
            //todo-figure out error handling
          }
          else {
            scope.calculateTotals();
          }
        });

      }
    }; //end link function

    return {
      restrict: 'AE',
      link: linker,
      templateUrl: './templates/ax-expense-item-list.html',
      scope: {
        reservationVm: '=',
        itemType: '@',
        room: '@',
        guest: '@',
        defaultCount: '@',
        maxCount: '@',
        itemTitle: '@',
        countTitle: '@',
        priceTitle: '@',
        hide: '@'
      }
    };
  }]);
});