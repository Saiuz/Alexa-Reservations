/**
 * Directive to generate a standard bill for a person in a double room who is part of a business reservation.  
 * The directive attributes are:
 *    reservationVm - a reservation view-model object containing the business reservation.
 *    room - the room number for the business reservation
 *    guest - the name of the guest in the specified room.
 *    details -  a boolean that if true will show a detailed list of miscellaneous items on a second page
 *
 * Other business logic:
 *    similar to standard-bill directive except that the room and guest is input rather than determined from 
 *    reservation.
 *    The bill shows the room information, has a section for Kurtax and a section for Diverses. The kurtax section is
 *    aggregated if there are 2 people in the room. Under the Diverses section, drinks and eats are shown as totals.
 *    There is an option to have a second page where the Diverses detail is shown.
 */
define(['./module'], function (directives) {
    'use strict';
    directives.directive('axStandardbBill', ['$filter', 'configService', 'convert',
        function ($filter, configService, convert) {
            var linker = function (scope, element, attrs) {
                console.log("axStandardbBill linker fired");
                //define which items appear in which section of the bill_dec32
                var c = configService.constants,
                    unterItems = [c.bcRoom, c.bcPackageItem, c.bcExtraRoom],
                    kurtax = [c.bcKurTax],
                    other = [c.bcDrink, c.bcFood, c.bcMeals, c.bcPlanDiverses, c.bcKur, c.bcResources, c.bcDienste],
                    haveAttributes = false,
                    calcResult,
                    room,
                    rmObj,
                    detailedPage;

                scope.txt = configService.loctxt;
                scope.tax7 = configService.constants.get('roomTax');
                scope.tax19 = configService.constants.get('salesTax');
                scope.today = new Date();

                // build the local select list from the expenseItemArray
                // filter the list by the itemType property. Note we must wait until
                // both properties have been set during the compile phase of the hosting page
                scope.$watchCollection('[reservationVm, room, guest, details]', function (newvals) {
                    var extras = {};

                    if (newvals[0] && newvals[1] !== undefined) {
                        console.log("axStandardBill watch fired with all parameters " + newvals[1]);
                        haveAttributes = true;
                        scope.rvm = newvals[0]; // same as reservationVM just less typing
                        scope.ktax = convert.roundp(configService.constants.get("cityTax") * scope.rvm.res.nights, 2);
                        room = Number(newvals[1]);
                        scope.guest = newvals[2];
                        rmObj = scope.rvm.generatePlanRoomString(room, scope.guest);
                        detailedPage = newvals[3];
                        // build 'vocabulary' that expense display strings may need.
                        extras['planName'] = rmObj.displayText;
                        extras['planPrice'] = scope.rvm.planPrice;
                        extras['perPerson'] = "" //only for one person scope.rvm.res.occupants === 2 ? configService.loctxt.forTwoPeople : '';
                        extras['roomType'] = scope.rvm.res.rooms[0].room_type;
                        extras['guestCnt'] = 1; //only for one person scope.rvm.res.occupants;
                        updateData(extras);
                    }
                });

                var updateData =  function(extras) {
                    var ktext =  scope.rvm.oneBill ? configService.loctxt.aggregatePersonDisplayString : '',
                        aggObj = [];
                    let gRec = (scope.rvm.guest1rec.name == scope.guest ? scope.rvm.guest1rec : scope.rvm.guest2rec) || {};
                    scope.address1 = gRec.address1;
                    scope.address2 = gRec.address2;
                    scope.post_code = gRec.post_code;
                    scope.city = gRec.city;
                    scope.country = gRec.country;

                    if (haveAttributes) {
                        scope.rvm.getBillNumber(room, scope.guest).then( function (bnum) {
                                scope.billNumber = bnum;
                            }
                        );
                        scope.rvm.generateBillingName();

                        // get the total bill and taxes taxes
                        calcResult = scope.rvm.calculateTotals([],room, scope.guest); //total everything
                        scope.sectionTotal = {
                            page_title: "Rechnung",
                            section_title: "",
                            total_text: "Total",
                            total: calcResult.sum,
                            taxes: calcResult.taxes,
                            items: [],
                            padding: _padRows(calcResult.detail.length, 0)
                        };
                        calcResult = scope.rvm.calculateTotals(unterItems, room, scope.guest, extras, false);
                        scope.section1 = {
                            page_title: "",
                            section_title: "Unterkunft:",
                            total_text: "Total",
                            total: calcResult.sum,
                            taxes: calcResult.taxes,
                            items: calcResult.detail,
                            padding: _padRows(calcResult.detail.length, 3)
                        };
                        calcResult = scope.rvm.calculateTotals(kurtax, scope.room, scope.guest, extras, true, ktext);
                        scope.section2 = {
                            page_title: "",
                            section_title: "Kurtaxe:",
                            total_text: "Total",
                            taxes: calcResult.taxes,
                            total: calcResult.sum,
                            items: calcResult.detail,
                            padding: _padRows(calcResult.detail.length, 2)
                        };
                        calcResult = scope.rvm.calculateTotals(other, room, scope.guest);
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
                templateUrl: './templates/ax-standardb-bill.html',
                scope: {
                    reservationVm: '=',
                    room: '@',
                    guest: '@',
                    details: '='
                }
            };
        }]);
});

