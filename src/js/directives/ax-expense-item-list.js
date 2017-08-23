/**
 * Directive to create a table of Expense items of a particular type. That can be edited and new items created.
 * TODO- Add button to show/hide hidden expenses and implement display logic (hideB)
 */
define(['./module'], function (directives) {
  'use strict';
  directives.directive('axExpenseItemList', ['$filter', '$rootScope', 'configService', 'convert',
    function ($filter, $rootScope, configService, convert) {
      var linker = function (scope, element, attrs) {
        console.log("axExpenseItemList linker fired");

        var filterOnRm = false,
            rNum = 0;

        // build the local select list from the expenseItemArray
        // filter the list by the itemType property. Note we must wait until
        // both properties have been set during the compile phase of the hosting page
        scope.txt = configService.loctxt;
        scope.con = configService.constants;
        scope.hasHidden = false;  //todo-need button that shows if this is true that will allow the toggling of hidden items.
        scope.showHidden = false;
        scope.showRoomText = false;
        scope.selected = {};
        scope.ktax = configService.constants.get("cityTax");
        scope.textPrice = {}; //Object that will hold each item's price in text form. (Needed for handling number format
                              //localization since the xeditable directive doesn;t handle German number format.

         // contains key information about the current items, use by the item filter
        scope.$watchCollection('[reservationVm, itemType, room, guest]', function (newvals) {
          if (newvals[0] && newvals[1] && newvals[2] && newvals[3]) {
            console.log("axExpenseItemList watch fired with all parameters " + newvals[1] + " " + newvals[2] + " " + newvals[3]);
            scope.col1Title = attrs.itemTitle ? attrs.itemTitle : configService.loctxt.item;
            scope.col2Title = attrs.countTitle ? attrs.countTitle : configService.loctxt.times;
            scope.col3Title = attrs.priceTitle ? attrs.priceTitle : configService.loctxt.price;
            scope.rvm = newvals[0];
            filterOnRm = scope.rvm.oneBill && !scope.rvm.oneRoom;
            rNum = Number(newvals[2]);
            buildInitialList();
            scope.selected = scope.itemList.length > 0 ? scope.itemList[0] : {};
            scope.calculateTotals();
          }
        });

        // filters items by {category: itemType, guest: guest, room: room, name: '!' + txt.breakfastInc}
        scope.itemFilter = function (item) {
          return item.category === scope.itemType
                 && item.name !== configService.loctxt.breakfastInc
                 && (filterOnRm ? (item.room === rNum) : (item.guest === scope.guest));
        };
        // calculates the sum of all expense items in the category, may be filtered by user if required.
        // fires an event that something has changed on the root scope so that other directives can listen
        // for it and react accordingly.
        scope.calculateTotals = function () {
          var sum = 0;
          angular.forEach(scope.rvm.res.expenses, function (item) {
            var includeIt = (scope.rvm.oneBill || (item.guest === scope.guest && item.room === Number(scope.room)));
            if (item.category === scope.itemType && includeIt) {
              sum += item.item_total;
            }
          });
          scope.total = sum;
          $rootScope.$broadcast(configService.constants.expensesChangedEvent, {data: scope.itemType});  //Fire event
        };
        scope.toggleHidden = function () {
          scope.showHidden = !scope.showHidden;

        };

        // add the selected expense item to the reservation
        //
        scope.addExpenseItem = function () {
          scope.rvm.addExpenseItemSave(scope.selected, scope.room, scope.guest).then(function () {
            buildInitialList(); // remove added item if required.
            scope.calculateTotals();
          }, function (err) {
            //todo-figure out error handling
          });

        };

        scope.removeItem = function (id) {
          scope.rvm.removeExpenseItemSave(id).then(function () {
            delete scope.textPrice['_' + id];
            scope.calculateTotals();
            buildInitialList(); //need to re-add removed item to the pick list
          }, function (err) {
            //todo-figure out error handling
          });
        };

        // We have edited an expense simply save reservation to lock it in.
        scope.updateExpense = function (id) {
          var item = scope.rvm.res.expenses.id(id),
              price = scope.textPrice['_'+ id.id];

              item.price = convert.deNumberToDecimal(price, true);
           _updateRes(id);
        };

        scope.noKurtax = function(item) {
          item.price = 0;
          _updateRes(item._id);
        };

        scope.discountKurtax = function (item) {
          var dc = configService.constants.get("cityTaxDiscount") / 100.;

          item.price = convert.roundp(scope.ktax * dc, 2);
          _updateRes(item._id);
        };

        scope.fullKurtax = function (item) {
          item.price = scope.ktax;
          _updateRes(item._id);
        };

        scope.credit = function (item) {
          item.credit = item.price;
          item.price = 0;
          _updateRes(item._id);
        };

        scope.reinstate = function (item) {
          item.price = item.credit;
          item.credit = 0;
          _updateRes(item._id);        };
        //Private methods

        var _buildTextPriceObj = function () {
          var tpObj = {}; //build the textPrice object.
          scope.rvm.res.expenses.forEach(function (item){
            var fname = '_' + item._id;
            tpObj[fname] = item.price.toString();
          });
          scope.textPrice = tpObj;
        };

        var _updateRes = function (id) {
          scope.rvm.updateExpenseItemSave(id).then(function () {
            scope.calculateTotals();
          }, function (err) {
            //todo-figure out error handling
          });
        };

        var hasHiddenItems = function () {
          scope.rvm.res.expenses.forEach(function (exp) {
            if (exp.category === attrs.itemType && exp.no_display) {
              scope.hasHidden = true;
            }
          });
        };

        var hasItem = function (name) {
          var exp;
          for (var i=0; i <  scope.rvm.res.expenses.length; i++) {
            exp =  scope.rvm.res.expenses[i];
            if (exp.per_person) {
              if (exp.name === name && exp.guest === scope.guest) {
                return true;
              }
            }
            else {
              if (exp.name === name) {
                return true
              }
            }
          }

          return false;
        };

        // function that determines if an item should be excluded from the item pick list. There are a number reasons:
        // If plan includes breakfast then breakfast should be removed.
        var excludeItem = function (item) {
          if (item.name === configService.loctxt.breakfast) {
            return scope.rvm.includesBreakfast ? true : hasItem(item.name);
          }
          // if plan includes full or half pension then remove both items from list
          if (item.name === configService.loctxt.halfPension || item.name === configService.loctxt.fullPension) {
            return (hasItem(configService.loctxt.halfPensionInc) || hasItem(configService.loctxt.fullPensionInc));
          }

          if (item.one_per) { // if true then only allow one of these items.
            return hasItem(item.name);
          }
          return false;
        };

        // function that builds the initial (filtered) expense item array
        var buildInitialList = function () {
          _buildTextPriceObj();
          hasHiddenItems(); //first check for hidden items
          //scope.itemList = $filter('filter')(scope.itemTypeArray, {category: attrs.itemType, no_display: false}, true);
          scope.itemList = $filter('filter')(scope.rvm.expenseItemTypes, function (item) {
            return (item.category === attrs.itemType
            && !item.no_display && !excludeItem(item));
          });
          scope.selected = scope.itemList[0];
        };


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
          itemTitle: '@',
          countTitle: '@',
          priceTitle: '@'
        }
      };
    }]);
});