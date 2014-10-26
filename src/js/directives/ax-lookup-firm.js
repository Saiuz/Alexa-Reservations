/**
 * This directive provides a firm lookup input field with a pop-up form that gives the ability to add a new firm
 * to the firm collection.
 *
 */
define(['./module'], function (directives) {
  'use strict';
  directives.directive('axLookupFirm', ['dashboard', 'Firm', function (dashboard, Firm) {

    var linker = function (scope, element, attrs) {
      var ignoreWatch = false;
      var names = [];

      scope.loading = false;
      scope.axfirm = '';
      scope.selectedFirm = {};
      scope.notFound = false;

      scope.getFirms = function (val) {
        scope.loading = true;
        return dashboard.firmNameLookup(val).then(function (result) {
          console.log(val + " returns: " + result.length);
          names = [];
          if (result.length > 0) {
            for (var i = 0; i < result.length; i++) {  // using native for for speed
              names.push({name: result[i].firm_name, id: result[i]._id});
            }
          }
          scope.loading = false;
          scope.notFound = (names.length === 0);
          return names;
        });
      };

      scope.firmChanged = function ($item, $model, $label) {
        ignoreWatch = true;
        scope.firm = $item.name;
        scope.selectedFirm = $item;
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
          scope.notFound = false;
        }
        else {
          var found = false;
          if (names.length > 0) { //find the name in the current list if it exists.
            for (var j = 0; j < names.length; j++) {
              if (names[j].name === scope.firm) {
                scope.selectedFirm = names[j];
                scope.axfirm = names[j].name;
                found = true;
              }
            }
          }
          if (names.length === 0 || !found) { //if not there then find in db
            dashboard.getFirmByName(scope.firm).then(function (result) {
              names = [];
              if (result) {
                names.push({name: result.firm_name, id: result._id});
                scope.selectedFirm = names[0];
                scope.axfirm = names[0].name;
              }
            });
          }
          scope.notFound = (names.length === 0);
        }

        console.log("Firm Name watch fired, " + newval);
      });

      scope.newFirm = function () {
        //todo--bring up new Firm form. (part of guest VM? or directive
      }
    };

    return {
      restrict: 'E',
      link: linker,
      templateUrl: './templates/ax-lookup-firm.html',
      scope: {
        firm: '=', // the value of the input field (firm)
        displayOnly: '='
      }
    };
  }]);
});
