/**
 * Created by bob on 1/14/15.
 */
define(['./module'], function (directives) {
  'use strict';
  directives.directive('axBusinessBill', ['$filter', 'configService', 'convert',
    function ($filter, configService, convert) {
      var linker = function (scope, element, attrs) {
        console.log("axBusinessBill linker fired");
        //define which items appear in which section of the bill_dec32
        var c = configService.constants,
            unterItems = [c.bcRoom, c.bcPackageItem, c.bcMeals, c.bcKurTax, c.bcPlanDiverses ],
            personal = [c.bcFoodDrink, c.bcKur],
            haveAttributes = false,
            calcResult,
            room,
            rmObj,
            maxBillRows = 10;

        scope.txt = configService.loctxt;
        scope.tax7 = configService.constants.get('roomTax');
        scope.tax19 = configService.constants.get('salesTax');
        scope.today = new Date();

        // build the local select list from the expenseItemArray
        // filter the list by the itemType property. Note we must wait until
        // both properties have been set during the compile phase of the hosting page
        scope.$watchCollection('[reservationVm, room, guest]', function (newvals) {
          var extras = {};

          if (newvals[0] && newvals[1] && newvals[2]) {
            console.log("axBusinessBill watch fired with all parameters " + newvals[1] + ' ' + newvals[2]);
            haveAttributes = true;
            scope.rvm = newvals[0]; // same as reservationVM just less typing
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

        var updateData =  function(extras) {
          var ktext =  scope.rvm.oneBill ? configService.loctxt.aggregatePersonDisplayString : '';

          if (haveAttributes) {
            calcResult = scope.rvm.calculateTotals(unterItems, scope.room, scope.guest, extras, true);
            scope.section1 = {
              text: "Unterkunft Summe ",
              total: calcResult.sum,
              taxes: calcResult.taxes,
              items: calcResult.detail.slice(0),
              padding: _padRows(calcResult.detail.length)
            };
            calcResult = scope.rvm.calculateTotals(personal, scope.room, scope.guest, extras, true);
            scope.section2 = {
              text: "Speisen & Getranke Einzelheit",
              taxes: calcResult.taxes,
              total: calcResult.sum,
              items: calcResult.detail.slice(0)
            };
          }
        };

        // creates an array used by UI to add blank rows to the table. Contents of array don't matter
        function _padRows (lines) {
          var p = [];
          for (var i = maxBillRows ; i > lines ; i--) {
            p.push(i);
          }
          return p;
        }
      }; //end link function

      return {
        restrict: 'AE',
        link: linker,
        templateUrl: './templates/ax-business-bill.html',
        scope: {
          reservationVm: '=',
          room: '@',
          guest: '@'
        }
      };
    }]);
});