/**
 * Directive to generate a Tour Group bill. It can be used for standard business and group business reservations.
 *
 * The directive attributes are:
 *    reservationVm - a reservation view-model object containing the business reservation.
 *
 * Other business logic:
 *    This bill has one main page that covers room and kurtax which is paid by the tour company. It then generates
 *    individual bills for all guests that have any expenses on their room such as food or drinks.
 */
define(['./module'], function (directives) {
  'use strict';
  directives.directive('axTourBill', ['$rootScope','$filter', 'configService', 'modals', 'dashboard',
    function ($rootScope, $filter, configService, modals, dashboard) {
      var linker = function (scope, element, attrs) {
        console.log("axTourBill linker fired");
        //define which items appear in which section of the bill_dec32
        var c = configService.constants,
            unterItems = [c.bcRoom, c.bcPackageItem, c.bcMeals, c.bcKurTax ],
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
        scope.roomBills = [];

        // build the local select list from the expenseItemArray
        // filter the list by the itemType property. Note we must wait until
        // both properties have been set during the compile phase of the hosting page
        scope.$watchCollection('[reservationVm, pauschale]', function (newvals) {
          var extras = {};

          if (newvals[0] !== undefined) {
            console.log("axTourBill watch fired with all parameters " + newvals[1]);
            haveAttributes = true;
            scope.rvm = newvals[0]; // same as reservationVM just less typing
            scope.showEdits = scope.rvm.canCheckOut(scope.rvm.res.rooms[0].number);
            scope.guest = scope.rvm.res.guest.name; //original guest name
            //room = Number(newvals[1]);
            rmObj = scope.rvm.generatePlanRoomString(scope.rvm.res.rooms[0].number, scope.rvm.res.rooms[0].guest);
            busPachale = newvals[1];
            // build 'vocabulary' that expense display strings may need.
            extras['planName'] = rmObj.displayText;
            extras['planPrice'] = scope.rvm.planPrice;
            extras['perPerson'] =  scope.rvm.res.occupants === 2 ? configService.loctxt.forTwoPeople : '';
            extras['roomType'] = scope.rvm.res.rooms[0].room_type;
            extras['guestCnt'] = scope.rvm.res.occupants;
            updateData(extras);
          }
        });

        
        scope.editFirm = function () {
          let dataObjR = {data: scope.firm, extraData: undefined};
          modals.update(modals.getModelEnum().firm, dataObjR); //no callback
        };

        scope.editGuest = () => {
          let guestID = scope.rvm.res.guest.id;
          if (guestID) {
            let dataObjR = {data: guestID, extraData: undefined};
            modals.update(modals.getModelEnum().guest, dataObjR); //no callback
          }
        };
        /**
         * Respond to firm edited event update the firm/address info in the current
         * reservation in the VM. Note we don't need to update the reservation since
         * it was updated by the firm edit modal.
         */
        scope.$on(configService.constants.firmEditedEvent, (event, firm) => {
          if (scope.rvm && firm) {
            updateAddress(firm);
            scope.$apply();
            console.log(`Event ${event.name} received with firm ${firm.firm_name}`);
          }
        });
        /**
         * Respond to the guest edited event. Update the name of the guest and save
         * the new information in the reservation VM (Guest name gets updated)
         */
        scope.$on(configService.constants.resGuestEditedEvent, (event, val) => {
          if (scope.rvm) {
            dashboard.getGuestById(val).then((rec) => {
              scope.rvm.guest1rec = rec;
              console.log(`Event ${event} received for guest ${val.name}`);
              if (scope.guest !== rec.name) {
                $rootScope.$broadcast(configService.constants.guestNameChangedEvent, { oldName: scope.guest, newName: rec.name });
                scope.guest = rec.name;
              }
              scope.$apply();
            }).catch((err) => {
              scope.err = err;
              scope.hasErr = true;
              console.error(err);
            });
          }
        });

      var updateAddress = function (firm) {
        if (firm) {
          scope.firm = firm.firm_name;
          scope.address1 = firm.address1;
          scope.address2 = firm.address2;
          scope.post_code = firm.post_code;
          scope.city = firm.city;
          scope.country = firm.country;
        } else {
          scope.firm = scope.rvm.res.firm;
          scope.address1 = scope.rvm.res.address1;
          scope.address2 = scope.rvm.res.address2;
          scope.post_code = scope.rvm.res.post_code;
          scope.city = scope.rvm.res.city;
          scope.country = scope.rvm.res.country;
        }
      }
        var updateData =  function(extras) {
          updateAddress();
          var roomBills = [],
              ktext =  scope.rvm.oneBill ? configService.loctxt.aggregatePersonDisplayString : '',
              bill;

          if (haveAttributes) {
            // Get the main bill expenses rooms and tax. Ignore room/guest specific expenses at this point.
            scope.rvm.getBillNumber(scope.rvm.res.rooms[0].number, scope.guest).then( function (bnum) {
                  scope.billNumber = bnum;
                }
            );

            calcResult = scope.rvm.calculateTotals(unterItems, null, null, extras, true, ktext, busPachale);
            scope.section1 = {
              page_title: "Rechnung",
              section_title: "Unterkunft:",
              total_text: "Gesamtbetrag inklusive Umsatzsteuer",
              total: calcResult.sum,
              taxes: calcResult.taxes,
              items: calcResult.detail,
              padding: _padRows(calcResult.detail.length, maxBillRows)
            };
            // check for individual room expenses
            scope.rvm.res.rooms.forEach(function (rm) {
              calcResult = scope.rvm.calculateTotals(personal, rm.number, rm.guest, extras, false);
              if (calcResult.sum) {
                bill = {
                  page_title: "Rechnung für Zimmer " + rm.number,
                  section_title: "Persönliche Ausgaben:",
                  total_text: "Total",
                  taxes: calcResult.taxes,
                  total: calcResult.sum,
                  items: calcResult.detail,
                  padding: _padRows(calcResult.detail.length, maxBillRows),
                  room: rm.number,
                  guest: rm.guest
                };
                roomBills.push(bill);
              }
            });

            scope.roomBills = roomBills;
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
        templateUrl: './templates/ax-tour-bill.html',
        scope: {
          reservationVm: '=',
          pauschale: '='
        }
      };
    }]);
});
