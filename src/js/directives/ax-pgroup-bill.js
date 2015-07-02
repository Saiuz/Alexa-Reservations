/**
 * Directive to generate a Private Group bill. A private group is simply a private individual that reserves more than
 * one room. There is no firm associated with the bill and the main guest is responsible for paying the full bill.
 *
 * The directive attributes are:
 *    reservationVm - a reservation view-model object containing the business reservation.
 *
 * Other business logic:
 *    This bill has one main page that covers room and kurtax and diverses summ which is paid by the main guest. It can
 *    generate a separate itemized bill for  food or drinks.
 */
define(['./module'], function (directives) {
  'use strict';
  directives.directive('axPgroupBill', ['$filter', 'configService',
    function ($filter, configService) {
      var linker = function (scope, element, attrs) {
        console.log("axTourBill linker fired");
        //define which items appear in which section of the bill_dec32
        var c = configService.constants,
            unterItems = [c.bcRoom, c.bcPackageItem, c.bcMeals, c.bcKurTax ],
            personal = [c.bcDrink, c.bcFood, c.bcMeals, c.bcPlanDiverses, c.bcKur, c.bcResources, c.bcDienste],//[c.bcDrink, c.bcFood, c.bcKur, c.bcDienste],
            haveAttributes = false,
            calcResult,
            room,
            rmObj,
            maxBillRows = 7,
            busPachale;

        scope.txt = configService.loctxt;
        scope.tax7 = configService.constants.get('roomTax');
        scope.tax19 = configService.constants.get('salesTax');
        scope.today = new Date();
        scope.roomBills = [];

        // build the local select list from the expenseItemArray
        // filter the list by the itemType property. Note we must wait until
        // both properties have been set during the compile phase of the hosting page
        scope.$watchCollection('[reservationVm]', function (newvals) {
          var extras = {};

          if (newvals[0] !== undefined) {
            console.log("axTourBill watch fired with all parameters " + newvals[1]);
            haveAttributes = true;
            scope.rvm = newvals[0]; // same as reservationVM just less typing
            room = Number(newvals[1]);
            rmObj = scope.rvm.generatePlanRoomString(scope.rvm.res.rooms[0].number, scope.rvm.res.rooms[0].guest);
            busPachale = newvals[3];
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
          var roomBills = [],
              ktext =  scope.rvm.oneBill ? configService.loctxt.aggregatePersonDisplayString : '',
              aggObj = [
                {code: c.bcDrink, text: "Getränke"},
                {code: c.bcFood, text: "Speisen"},
                {code: c.bcKur, text: "Dienste"}
              ],
              bill;

          if (haveAttributes) {
            // Get the main bill expenses rooms and tax. Ignore room/guest specific expenses at this point.
            scope.rvm.getBillNumber(scope.rvm.res.rooms[0].number, scope.guest).then( function (bnum) {
                  scope.billNumber = bnum;
                }
            );
            scope.rvm.generateBillingName();

            // get the total bill and taxes taxes
            calcResult = scope.rvm.calculateTotals([]); //total everything
            scope.sectionTotal = {
              page_title: "Rechnung",
              section_title: "",
              total_text: "Total",
              total: calcResult.sum,
              taxes: calcResult.taxes,
              items: [],
              padding: _padRows(calcResult.detail.length, 0)
            };
            // get rooms and tax etc
            calcResult = scope.rvm.calculateTotals(unterItems, null, null, extras, true, ktext);
            scope.section1 = {
              page_title: "Rechnung",
              section_title: "Unterkunft:",
              total_text: "Gesamtbetrag inklusive Umsatzsteuer",
              total: calcResult.sum,
              taxes: calcResult.taxes,
              items: calcResult.detail,
              padding: _padRows(calcResult.detail.length, maxBillRows)
            };
            // Get other expenses for all rooms
            calcResult = scope.rvm.calculateTotals(personal);
            scope.hasDetails = calcResult.detail.length > 0;
            scope.section2 = {
              page_title: "",
              section_title: "Diverses:",
              total_text: "Total",
              taxes: calcResult.taxes,
              total: calcResult.sum,
              items: scope.rvm.aggregateByBillType(calcResult.detail, aggObj),
              padding: _padRows(calcResult.detail.length, 8)
            };
            scope.section4 = {
              page_title: "Diverses Einzelheiten",
              section_title: "Diverses:",
              total_text: "Diverses Total",
              taxes: calcResult.taxes,
              total: calcResult.sum,
              items: calcResult.detail,
              padding: _padRows(calcResult.detail.length, 10)
            };
          }
        };

        // creates an array used by UI to add blank rows to the table. Contents of array don't matter
        function _padRows (lines, maxRows) {
          var p = [];
          for (var i = maxRows ; i > lines ; i--) {
            p.push(i);
          }
          return p;
        }
      }; //end link function

      return {
        restrict: 'E',
        link: linker,
        templateUrl: './templates/ax-pgroup-bill.html',
        scope: {
          reservationVm: '=',
          details: '='
        }
      };
    }]);
});

