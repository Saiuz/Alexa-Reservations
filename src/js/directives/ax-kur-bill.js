/**
 * Directive to generate a Kur bill.  The directive attributes are:
 *    reservationVm - a reservation view-model object containing the business reservation.
 *    room - the room number for the business reservation
 *    guest - the name of the guest in the specified room.
 *
 * Other business logic:
 *    The bill shows the room information, has a section for Kurtax, Kur-und Heilmittel and a section for Diverses.
 *    For Kur bills, if there are two people in the room, each gets a separate bill so we filter on room and guest.
 *    Under the Diverses section, drinks and eats are shown as totals.
 *    Kur Logic:
 *      For VAK and AOK & Andere The Kur Expenses do not show up on the total bill price. They show up on a separate
 *      page only, however, there is a fixed prescription charge "Rezeptgebühr (in contsants) that shows up under
 *      Kur & Heilmittel section. For these plans, there may be a copay also that shows up here.
 *      For Private insurance, the total K&H shows up across from the Kur & Heilmittel heading and is included in the
 *      total plan. Private plans don't have copay.
 */
define(['./module'], function (directives) {
  'use strict';
  directives.directive('axKurBill', ['$filter', 'configService', 'dbEnums', 'convert',
    function ($filter, configService, dbEnums, convert) {
      var linker = function (scope, element, attrs) {
        console.log("axKurBill linker fired");
        //define which items appear in which section of the bill_dec32
        var c = configService.constants,
            unterItems = [c.bcRoom, c.bcPackageItem, c.bcKurPackageItem, c.bcExtraRoom],
            kurtax = [c.bcKurTax],
            kur = [c.bcKur,c.bcKurPackageItem],
            other = [c.bcDrink, c.bcFood, c.bcMeals, c.bcPlanDiverses, c.bcResources, c.bcDienste],
            haveAttributes = false,
            calcResult,
            rmObj,
            insurance; //insurance

        scope.txt = configService.loctxt;
        scope.tax7 = configService.constants.get('roomTax');
        scope.tax19 = configService.constants.get('salesTax');
        scope.today = new Date();
        scope.copayMsg = configService.loctxt.minus + ' ' + configService.constants.get('ownContribution') + '% '
                        +configService.loctxt.copay;
        scope.prescMsg = configService.loctxt.minus + ' ' + configService.loctxt.prescription_charge;

        // build the local select list from the expenseItemArray
        // filter the list by the itemType property. Note we must wait until
        // both properties have been set during the compile phase of the hosting page
        scope.$watchCollection('[reservationVm, room, guest]', function (newvals) {
          var extras = {},
              room;

          if (newvals[0] && newvals[1] && newvals[2]) {
            console.log("axKurBill watch fired with all parameters " + newvals[1] + ' ' + newvals[2]);
            haveAttributes = true;
            scope.rvm = newvals[0]; // same as reservationVM just less typing
            scope.ktax = convert.roundp(configService.constants.get("cityTax") * scope.rvm.res.nights, 2);
            //get insurance
            if (scope.rvm.res.occupants === 2) {
              insurance = (scope.guest === scope.rvm.res.rooms[0].guest) ? scope.rvm.res.insurance : scope.rvm.res.insurance2;
            }
            else {
              insurance = scope.rvm.res.insurance;
            }

            scope.isPrivate = insurance === dbEnums.getReservationInsuranceEnum()[3];

            room = Number(newvals[1]);
            rmObj = scope.rvm.generatePlanRoomString(room, scope.guest);
            // build 'vocabulary' that expense display strings may need.
            extras['planName'] = rmObj.displayText;
            extras['planPrice'] = scope.rvm.planPrice;
            extras['perPerson'] =  scope.rvm.res.occupants === 2 && scope.rvm.oneBill ? configService.loctxt.forTwoPeople : '';
            extras['roomType'] = scope.rvm.res.rooms[0].room_type;
            extras['guestCnt'] = scope.rvm.res.occupants;
            updateData(extras);
          }
        });

        var updateData =  function(extras) {
          var ktext =  scope.rvm.oneBill ? configService.loctxt.aggregatePersonDisplayString : '',
              aggObj = [];

          if (haveAttributes) {
            scope.rvm.getBillNumber(scope.room, scope.guest).then( function (bnum) {
                  scope.billNumber = bnum;
                }
            );
            // get the total bill and taxes taxes
            calcResult = scope.rvm.calculateTotals([], scope.room, scope.guest, extras, false, '', false, !scope.isPrivate); //total everything
            scope.sectionTotal = {
              page_title: "Rechnung",
              section_title: "",
              total_text: "Total",
              total: calcResult.sum,
              taxes: calcResult.taxes,
              items: [],
              padding: _padRows(calcResult.detail.length, 0)
            };
            // save any copay and prescription charges
            scope.copay = calcResult.copay;
            scope.prescription = calcResult.prescription;
            scope.copTotal = calcResult.copay + calcResult.prescription;

                calcResult = scope.rvm.calculateTotals(unterItems, scope.room, scope.guest, extras, false);
            scope.section1 = {
              page_title: "",
              section_title: "Unterkunft:",
              total_text: "Total",
              total: calcResult.sum,
              taxes: calcResult.taxes,
              items: calcResult.detail,
              padding: _padRows(calcResult.detail.length, 3)
            };
            calcResult = scope.rvm.calculateTotals(kurtax, scope.room, scope.guest, extras, false);
            scope.section2 = {
              page_title: "",
              section_title: "Kurtaxe:",
              total_text: "Total",
              taxes: calcResult.taxes,
              total: calcResult.sum,
              items: calcResult.detail,
              padding: _padRows(calcResult.detail.length, 2)
            };
            calcResult = scope.rvm.calculateTotals(other, scope.room, scope.guest);
            aggObj = [
              {code: c.bcDrink, text: "Getränke"},
              {code: c.bcFood, text: "Speisen"},
              {code: c.bcKur, text: "Dienste"}
            ];
            scope.hasDetails = calcResult.detail.length > 0;
            scope.section3 = {
              page_title: "",
              section_title: "Diverses:",
              total_text: "Total",
              taxes: calcResult.taxes,
              total: calcResult.sum,
              items: scope.rvm.aggregateByBillType(calcResult.detail, aggObj),
              padding: _padRows(calcResult.detail.length, 8)
            };
            calcResult = scope.rvm.calculateTotals(kur, scope.room, scope.guest, extras, false, '', false, false);
            scope.section4 = {
              page_title: "Rechnung",
              section_title: "Kur-und Heilmittel:",
              total_text: "Gesamt Summe",
              taxes: calcResult.taxes,
              total: calcResult.sum,
              items: calcResult.detail,
              hiddenSum: calcResult.hiddenSum,
              diff: calcResult.sum - calcResult.hiddenSum,
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
        templateUrl: './templates/ax-kur-bill.html',
        scope: {
          reservationVm: '=',
          room: '@',
          guest: '@'
        }
      };
    }]);
});

