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
            calcResult = scope.rvm.calculateTotals([], scope.room, scope.guest);
            scope.section0text = "Rechnung Total"; //todo - move to configService
            scope.section0total = calcResult.sum;
            scope.section0taxes = calcResult.taxes;

            scope.section1text = "Unterkunft Summe ";  //todo - move to configService
            calcResult = scope.rvm.calculateTotals(unterItems, scope.room, scope.guest, extras, true);
            scope.section1total = calcResult.sum;
            scope.section1items = calcResult.detail.slice(0);

            scope.section2text = "Kurtaxe Summe ";
            calcResult = scope.rvm.calculateTotals(kurtaxItems, scope.room, scope.guest, extras, true, ktext);
            scope.section2total = calcResult.sum;
            scope.section2items = calcResult.detail.slice(0);

            scope.section3text = "Kur-und Heilmittel Summe ";
            calcResult = scope.rvm.calculateTotals(kurItems, scope.room, scope.guest, extras, false);
            scope.section3total = calcResult.sum;
            scope.section3items = calcResult.detail.slice(0);

            scope.section4text = "Diverses Summe ";
            calcResult = scope.rvm.calculateTotals(miscItems, scope.room, scope.guest, extras, false);
            scope.section4total = calcResult.sum;
            scope.section4items = calcResult.detail.slice(0);
          }
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