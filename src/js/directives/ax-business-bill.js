/**
 * Directive to generate a business bill. It can be used for standard business and group business reservations.
 * the directive attributes are:
 *    reservationVm - a reservation view-model object containing the business reservation.
 *    room - the room number for the business reservation
 *    guest - the name of the guest in the specified room.
 *    pauschale - a boolean if true will aggregate the kurtax, breakfast and parking into a single line item.
 *
 * Other business logic:
 *    Any personal expenses are displayed on a second page. The items are aggregated and counts are adjusted so
 *    that there is only one line item for each type of personal expense.
 */
define(['./module'], function (directives) {
  'use strict';
  directives.directive('axBusinessBill', ['$filter', 'configService',
    function ($filter, configService) {
      var linker = function (scope, element, attrs) {
        console.log("axBusinessBill linker fired");
        //define which items appear in which section of the bill_dec32
        var c = configService.constants,
            unterItems = [c.bcRoom, c.bcPackageItem, c.bcMeals, c.bcKurTax, c.bcPlanDiverses ],
            personal = [c.bcDrink, c.bcFood, c.bcKur, c.bcDienste],
            haveAttributes = false,
            calcResult,
            room,
            rmObj,
            maxBillRows = 10,
            busPachale;

        scope.txt = configService.loctxt;
        scope.tax7 = configService.constants.get('roomTax');
        scope.tax19 = configService.constants.get('salesTax');
        scope.today = new Date();

        // build the local select list from the expenseItemArray
        // filter the list by the itemType property. Note we must wait until
        // both properties have been set during the compile phase of the hosting page
        scope.$watchCollection('[reservationVm, room, guest, pauschale]', function (newvals) {
          var extras = {};

          if (newvals[0] && newvals[1] && newvals[2] && newvals[3] !== undefined) {
            console.log("axBusinessBill watch fired with all parameters " + newvals[1] + ' ' + newvals[2] + ' ' + newvals[3]);
            haveAttributes = true;
            scope.rvm = newvals[0]; // same as reservationVM just less typing
            room = Number(newvals[1]);
            rmObj = scope.rvm.generatePlanRoomString(room, newvals[2]);
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
          if (haveAttributes) {
            calcResult = scope.rvm.calculateTotals(unterItems, scope.room, scope.guest, extras, false, '', busPachale);
            scope.section1 = {
              page_title: "Rechnung",
              section_title: "Unterkunft:",
              total_text: "Gesamtbetrag inklusive Umsatzsteuer",
              total: calcResult.sum,
              taxes: calcResult.taxes,
              items: calcResult.detail,
              padding: _padRows(calcResult.detail.length, maxBillRows)
            };
            calcResult = scope.rvm.calculateTotals(personal, scope.room, scope.guest, extras, true);
            scope.section2 = {
              page_title: "Speisen & Getränke Einzelheit",
              section_title: "Speisen, Getränke & Dienste:",
              total_text: "Total",
              taxes: calcResult.taxes,
              total: calcResult.sum,
              items: calcResult.detail,
              padding: _padRows(calcResult.detail.length, maxBillRows)
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
        templateUrl: './templates/ax-business-bill.html',
        scope: {
          reservationVm: '=',
          room: '@',
          guest: '@',
          pauschale: '='
        }
      };
    }]);
});