/**
 * This directive provides a firm lookup input field with a pop-up form that gives the ability to add a new firm
 * to the firm collection or edit the selected firm.
 * Directive parameters:
 *      firm         - The name of the firm to be displayed or that was selected by the user
 *      firmPrice    - The room price of the firm to be displayed or that was selected by the user
 *      displayOnly  - If true then it will only display the value of the firm. No selection capabilities
 *      firmCallback -
 */
define(['./module'], function (directives) {
  'use strict';
  directives.directive('axLookupFirm', ['dashboard', 'Firm', 'modals', function (dashboard, Firm, modals) {

    var linker = function (scope, element, attrs) {
      var ignoreWatch = false;
      var names = [];

      scope.loading = false;
      scope.axfirm = '';
      scope.selectedFirm = {};
      scope.notFound = false;
      scope.canClear = false;

      scope.getFirms = function (val) {
        scope.loading = true;
        return dashboard.firmNameLookup(val).then(function (result) {
          console.log(val + " returns: " + result.length);
          names = [];
          if (result.length > 0) {
            for (var i = 0; i < result.length; i++) {  // using native for for speed
              names.push({name: result[i].firm_name, id: result[i]._id, price: result[i].room_price});
            }
          }
          scope.loading = false;
          scope.notFound = (names.length === 0);
          scope.canClear = !scope.notFound;
          return names;
        });
      };

      scope.clearFirm = function () {
        ignoreWatch = true;
        scope.axfirm = '';
        scope.selectedFirm = {};
        scope.notFound = false;
        scope.canClear = false;
        scope.firm = '';
      };

      scope.editFirm = function () {
        var model = modals.getModelEnum().firm,
            dataObj = {data: scope.selectedFirm ? scope.selectedFirm.id : 0, extraData: undefined};

        modals.update(model, dataObj, function (result) {
          console.log("Modal returned: " + result);
          names = [{name: result.firm_name, id: result._id, price: result.room_price}];
          scope.selectedFirm = names[0];
          scope.axfirm =  result.firm_name;
          scope.firm = result.firm_name;
          scope.firmPrice = result.room_price;
          scope.notFound = false;
          if (scope.firmCallback) {
            scope.firmCallback(result);
          }
        });
      };

      scope.firmChanged = function ($item, $model, $label) {
        ignoreWatch = true;
        scope.firm = $item.name;
        scope.selectedFirm = $item;
        scope.firmPrice = $item.price;
        scope.canClear = true;
        if (scope.firmCallback) {
          scope.firmCallback(result);
        }
        //_updateTitle();
      };

      scope.$watch('firm', function (newval) {
        // Don't trigger watch action if variable is updated vi firmChanged method.
        if (ignoreWatch) {
          ignoreWatch = false;
          return;
        }
        // if newval is undefined or empty then clear the name lookup field and drop down
        // else find the name (based on id from the db)
        if (newval === undefined || newval === '') {
          scope.selectedFirm = {};
          scope.axfirm = '';
          scope.firmPrice = 0;
          scope.notFound = false;
          scope.canClear = false;
        }
        else {
          var found = false;
          if (names.length > 0) { //find the name in the current list if it exists.
            for (var j = 0; j < names.length; j++) {
              if (names[j].name === scope.firm) {
                scope.selectedFirm = names[j];
                scope.axfirm = names[j].name;
                scope.firmPrice = names[j].price;
                scope.notFound = false;
                found = true;
                scope.canClear = true;
                if (scope.firmCallback) {
                  scope.firmCallback(result);
                }
              }
            }
          }
          if (names.length === 0 || !found) { //if not there then find in db
            dashboard.getFirmByName(scope.firm).then(function (result) {
              names = [];
              if (result) {
                names.push({name: result.firm_name, id: result._id, price: result.room_price});
                scope.selectedFirm = names[0];
                scope.axfirm = names[0].name;
                scope.firmPrice = names[0].price;
                scope.notFound = false;
                scope.canClear = true;
                if (scope.firmCallback) {
                  scope.firmCallback(result);
                }
              }
            });
          }
        }

        console.log("Firm Name watch fired, " + newval);
      });

      scope.newFirm = function (size) {   //TODO convert to use modals service-add reference to module.
        var model = modals.getModelEnum().firm,
            dataObj = {data: scope.axfirm ? scope.axfirm : '', extraData: undefined};
        //if the name in the input field is in the db then ignore the button click
        if (names.length !== 0 && scope.axfirm) {
          return;
        }
        scope.canClear = true;
        modals.create(model, dataObj, function (result) {
          console.log("Firm Modal returned: " + result);
          names = [
            {name: result.firm_name, id: result._id, price: result.room_price}
          ];
          scope.selectedFirm = names[0]
          scope.axfirm = result.firm_name;
          scope.firm = result.firm_name;
          scope.firmPrice = result.room_price;
          scope.notFound = false;
          if (scope.firmCallback) {
            scope.firmCallback(result);
          }
        });
      };
    };

    return {
      restrict: 'E',
      link: linker,
      templateUrl: './templates/ax-lookup-firm.html',
      scope: {
        firm: '=', // the value of the input field (firm)
        firmPrice: '=', // the negotiated room price of the selected firm
        displayOnly: '=',
        firmCallback: '=' // optional method to call when the selectedFirm (internal parameter changes.
      }
    };
  }]);
});
