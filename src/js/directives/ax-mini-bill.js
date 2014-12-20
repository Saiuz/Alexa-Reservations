/**
 * Created by Owner on 12/12/2014.
 */
define(['./module'], function (directives) {
  'use strict';
  directives.directive('axMiniBill', ['$filter', '$rootScope', 'configService', 'convert',
    function ($filter, $rootScope, configService, convert) {
      var linker = function (scope, element, attrs) {
        console.log("axMiniBill linker fired");
        var c = configService.constants,
            unterItems = [c.bcRoom, c.bcPackageItem],
            kurtaxItems = [c.bcKurTax],
            kurItems = [c.bcKur],
            miscItems = [c.bcExtraRoom, c.bcMeals, c.bcResources, c.bcPlanDiverses, c.bcFoodDrink],
            calcResult = {sum: 0, detail: [], totalsTaxes: {}},
            haveAttributes = false,
            room,
            rmObj;

        // Expense detail object, for a bill
        var LineItem = function (expItem, extras) {
          this.text = convert.formatDisplayString(expItem, extras);
          this.total = expItem.item_total;
        };

        // build the local select list from the expenseItemArray
        // filter the list by the itemType property. Note we must wait until
        // both properties have been set during the compile phase of the hosting page
        scope.txt = configService.loctxt;
        scope.isCollapsed0 = true;
        scope.isCollapsed1 = true;
        scope.isCollapsed2 = true;
        scope.isCollapsed3 = true;
        scope.isCollapsed4 = true;

        scope.$watchCollection('[reservationVm, room, guest]', function (newvals) {
          var extras = {};

          if (newvals[0] && newvals[1] && newvals[2]) {
            console.log("axMiniBill watch fired with all parameters " + newvals[1] + ' ' + newvals[2]);
            haveAttributes = true;
            scope.rvm = newvals[0];
            room = Number(newvals[1]);
            rmObj = scope.rvm.generatePlanRoomString(room, newvals[2]);

            // build 'vocabulary' that expense display strings may need.
            extras['planName'] = rmObj.displayText;
            extras['planPrice'] = scope.rvm.planPrice;
            extras['perPerson'] =  scope.rvm.res.occupants === 2 ? configService.loctxt.forTwoPeople : '';
            extras['roomType'] = scope.rvm.res.rooms[0].room_type;
            extras['guestCnt'] = scope.rvm.res.occupants;
            updateData(extras);
          }
        });

        // Respond to event  for expense item changes
        scope.$on(configService.constants.expensesChangedEvent, function(event, result) {
          if (scope.rvm && scope.room && scope.guest) { //ignore events before directive is initialized
            console.log("axMiniBill expense change event fired " + result.data);
            updateData();
          }
        });

        var updateData =  function(extras) {
          var ktext =  scope.rvm.oneBill ? configService.loctxt.aggregatePersonDisplayString : '';

          if (haveAttributes) {
            calcResult = calculateTotals([]);
            scope.section0text = "Rechnung Total"; //todo - move to configService
            scope.section0total = calcResult.sum;
            scope.section0taxes = calcResult.taxes;

            scope.section1text = "Unterkunft Summe ";  //todo - move to configService
            calcResult = calculateTotals(unterItems, extras, true);
            scope.section1total = calcResult.sum;
            scope.section1items = calcResult.detail.slice(0);

            scope.section2text = "Kurtaxe Summe ";
            calcResult = calculateTotals(kurtaxItems, extras, true, ktext);
            scope.section2total = calcResult.sum;
            scope.section2items = calcResult.detail.slice(0);

            scope.section3text = "Kur-und Heilmittel Summe ";
            calcResult = calculateTotals(kurItems, extras, false);
            scope.section3total = calcResult.sum;
            scope.section3items = calcResult.detail.slice(0);

            scope.section4text = "Diverses Summe ";
            calcResult = calculateTotals(miscItems, extras, false);
            scope.section4total = calcResult.sum;
            scope.section4items = calcResult.detail.slice(0);
          }
        };

        var calculateTotals = function (incItems, extras, aggregate, aggrTxt) {
          var net19 = 0,
              sum19 = 0,
              net7 = 0,
              sum7 = 0,
              tax19 = 0,
              tax7 = 0;

          calcResult.sum = 0;
          calcResult.detail = [];

          angular.forEach(scope.rvm.res.expenses, function (item) {
            var includeIt = (scope.rvm.oneBill || (item.guest === scope.guest && item.room === Number(scope.room))),
                inCategory = ( !incItems || incItems.length === 0 ||  incItems.indexOf(item.bill_code) !== -1);

            if (inCategory && includeIt) {
              if (!item.no_display || item.is_room) {
                calcResult.detail.push(new LineItem(item, extras));
              }

              calcResult.sum += item.item_total;
              if (item.low_tax_rate) {
                tax7 += item.item_tax;
                net7 += item.item_tax_net;
                sum7 += item.item_tax_total;
              }
              else {
                tax19 += item.item_tax;
                net19 += item.item_tax_net;
                sum19 += item.item_tax_total;
              }
            }
          });

          calcResult.taxes = {
            tax7: tax7,
            net7: net7,
            sum7: sum7,
            tax19: tax19,
            net19: net19,
            sum19: sum19
          };

          if (aggregate) {
            calcResult.detail = aggregateItems(calcResult.detail, aggrTxt, extras); // aggregate the same expenses into one item
          }

          return calcResult;
        };

        // Function that will aggregate the descriptive items in the source array by combining all items
        // with the same description into one item in which the item's total is the sum of all duplicate items.
        var aggregateItems = function (sourceArr, aggrText, extras) {
          var aggArr = [],
              firstOne = true,
              ix;

          sourceArr.forEach(function (item) {
            if (firstOne) {
              item.icount = 1; //add a property to the original item to keep track of the number of times aggregated
              aggArr.push(item);
              firstOne = false;
            }
            else {
              ix = _hasDetailItem(item, aggArr);
              if (ix !== -1) {
                aggArr[ix].total += item.total;
                aggArr[ix].icount++;
                aggArr[ix].display_string = aggrText;
              }
              else {
                item.icount = 1;
                aggArr[ix].display_string = aggrText
                aggArr.push(item);
              }
            }
          });

          // Now remove the count property and add the supplied text along with the count if provided
          aggArr.forEach( function (item) {
              if (aggrText && item.icount > 1) {
                item.text = convert.formatDisplayString(item, extras);
              }
            delete item.icount;
            delete item.display_string;
          });

          return aggArr; //currently does nothing
        };

        var _hasDetailItem = function (item, arr) {
           var ix = -1;
          for (var i = 0; i < arr.length; i++) {
            if (arr[i].text === item.text) {
              ix = i;
              break;
            }
          }

          return ix;
        };

      }; //end link function

      return {
        restrict: 'AE',
        link: linker,
        templateUrl: './templates/ax-mini-bill.html',
        scope: {
          reservationVm: '=',
          room: '@',
          guest: '@'
        }
      };
    }]);
});