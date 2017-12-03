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
  directives.directive('axBusinessBill', ['$rootScope','$filter', 'configService', 'modals', 'dashboard',
    function ($rootScope, $filter, configService, modals, dashboard) {
      var linker = function (scope, element, attrs) {
        console.log("axBusinessBill linker fired");
        //define which items appear in which section of the bill_dec32
        let c = configService.constants,
            unterItems = [c.bcRoom, c.bcPackageItem, c.bcMeals, c.bcKurTax, c.bcPlanDiverses ],
            personal = [c.bcDrink, c.bcFood, c.bcKur, c.bcDienste],
            haveAttributes = false,
            calcResult,
            room,
            rmObj,
            maxBillRows = 10,
            busPachale,
            guestID = null;

        scope.txt = configService.loctxt;
        scope.tax7 = configService.constants.get('roomTax');
        scope.tax19 = configService.constants.get('salesTax');
        scope.today = new Date();

        // build the local select list from the expenseItemArray
        // filter the list by the itemType property. Note we must wait until
        // both properties have been set during the compile phase of the hosting page
        scope.$watchCollection('[reservationVm, room, guest, pauschale]', function (newvals) {
          let extras = {};

          if (newvals[0] && newvals[1] && newvals[2] && newvals[3]  !== undefined) {
            console.log("axBusinessBill watch fired with all parameters " + newvals[1] + ' ' + newvals[2] + ' ' + newvals[3]);
            haveAttributes = true;
            scope.rvm = newvals[0]; // same as reservationVM just less typing
            room = Number(newvals[1]);
            scope.showEdits = scope.rvm.canCheckOut(room);
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


        scope.editFirm = () => {
          let dataObjR = {data: scope.firm, extraData: undefined};
          modals.update(modals.getModelEnum().firm, dataObjR); //no callback
        };

        scope.editGuest = () => {
          let guestID = (scope.guest === scope.rvm.guest1rec.name) ? 
                    scope.rvm.guest1rec._id : (scope.rvm.guest2rec && (scope.guest === scope.rvm.guest2rec.name)) ? scope.rvm.guest2rec._id : null;
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
            let gRec = (scope.rvm.guest1rec.id === val ? 1 : scope.rvm.guest2rec.id === val ? 2 : 0) || {};
            if (gRec > 0) {
              dashboard.getGuestById(val).then((rec) => {
                if (gRec === 1) {
                  scope.rvm.guest1rec = rec;
                } else {
                  scope.rvm.guest2rec = rec;
                }
                console.log(`Event ${event} received with value ${val}`);
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
          }
        });
        /**
         * 
         * @param {*} firm 
         */
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
          if (haveAttributes) {
            scope.rvm.getBillNumber(scope.room, scope.guest).then( function (bnum) {
                  scope.billNumber = bnum;
                }
            );
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