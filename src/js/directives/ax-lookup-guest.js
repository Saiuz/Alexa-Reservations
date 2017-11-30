/**
 * This directive provides a guest lookup input field with a pop-up form that gives the ability to add a new guest
 * to the guest collection.
 * todo-add wildcard search?
 */
define(['./module'], function (directives) {
  'use strict';
  directives.directive('axLookupGuest', ['dashboard', 'Guest', 'modals', function (dashboard, Guest, modals) {

    var linker = function (scope, element, attrs) {
      var ignoreWatch = false;
      var names = [];

      scope.loading = false;
      scope.axguest = '';
      scope.selectedGuest = {};
      scope.notFound = false;
      scope.canClear = false;

      // retrieves guest names that match the the value in val. See the guestNameLookup method for details about
      // wild cards etc.
      scope.getGuests = function (val) {
        scope.loading = true;
        return dashboard.guestNameLookup(val, scope.firm).then(function (result) {
          console.log(val + " returns: " + result.length);
          names = [];
          if (result.length > 0) {
            for (var i = 0; i < result.length; i++) {  // using native for for speed
              names.push({dname: result[i].unique_name, name: result[i].name, id: result[i]._id, firm: result[i].firm, partner: result[i].partner});
            }
//            angular.forEach(result,function(item){
//              names.push({dname: item.unique_name, name: item.name, id: item._id});
//            });
          }
          scope.loading = false;
          scope.notFound = (names.length === 0);
          scope.canClear = !scope.notFound;
          scope.$apply();
          return names;
        });
      };

      scope.clearGuest = function () {
        ignoreWatch = true;
        scope.axguest = '';
        scope.selectedGuest = {};
        scope.notFound = false;
        scope.canClear = false;
        scope.guest = {};
      };

      scope.editGuest = function () {
        var model = modals.getModelEnum().guest,
            dataObj = {data: scope.selectedGuest ? scope.selectedGuest.id : 0, extraData: undefined};

        modals.update(model, dataObj, function (result) {
          console.log("Modal returned: " + result);
          names = [{dname: result.unique_name, name: result.name, id: result._id, firm: result.firm, partner: result.partner}];
          scope.selectedGuest = names[0];
          if (scope.guestCallback) {
            scope.guestCallback(result);
          }
          scope.axguest =  result.unique_name;
          scope.guest = {name: result.name, id: result._id};
          scope.notFound = false;
        });
      };

      scope.guestChanged = function ($item, $model, $label) {
        ignoreWatch = true;
        scope.guest = {name: $item.name, id: $item.id};
        scope.selectedGuest = $item;
        if (scope.guestCallback) {
          scope.guestCallback($item);
        }
        scope.canClear = true;
        //_updateTitle();
      };
      scope.$watch('guest.name', function (newval) {
        // Don't trigger watch action if variable is updated vi guestChanged method.
        if (ignoreWatch) {
          ignoreWatch = false;
          return;
        }
        // if newval is undefined or empty then clear the name lookup field and drop down
        // else find the name (based on id from the db)
        if (newval === undefined || newval === '') {
          scope.selectedGuest = {};
          scope.axguest = '';
          scope.notFound = false;
          scope.canClear = false;
        }
        else {
          var found = false;
          if (names.length > 0) { //find the name in the current list if it exists.
            for (var j = 0; j < names.length; j++) {
              if (names[j].id.id === scope.guest.id.id) {
                scope.selectedGuest = names[j];
                if (scope.guestCallback) {
                  scope.guestCallback(names[j]);
                }
                scope.axguest = names[j].dname;
                scope.notFound = false;
                found = true;
                scope.canClear = true;
              }
            }
          }
          if (names.length === 0 || !found) { //if not there then find in db
            dashboard.getGuestById(scope.guest.id).then(function (result) {
              names = [];
              if (result && result.name) {
                names.push({dname: result.unique_name, name: result.name, id: result._id, firm: result.firm, partner: result.partner});
                scope.selectedGuest = names[0];
                if (scope.guestCallback) {
                  scope.guestCallback(result);
                }
                scope.axguest = names[0].dname;
                scope.notFound = false;
                scope.canClear = true;
                scope.$apply();
              }
            });
          }
        }

        console.log("Guest Name watch fired, " + newval);
      });

      scope.newGuest = function (size) {
        var model = modals.getModelEnum().guest,
            dataObj = {data: scope.axguest ? scope.axguest.split(' ') : [], extraData: scope.firm};

        //if the name in the input field is in the db then ignore the button click
        if (names.length !== 0 && scope.axguest) {
          return;
        }
        scope.canClear = true;
        modals.create(model, dataObj, function (result) {
          console.log("Modal returned: " + result);
          names = [{dname: result.unique_name, name: result.name, id: result._id, firm: result.firm, partner: result.partner}];
          scope.selectedGuest = names[0];
          if (scope.guestCallback) {
            scope.guestCallback(result);
          }
          scope.axguest =  result.unique_name;
          scope.guest = {name: result.name, id: result._id};
          scope.notFound = false;
        });
      };
    };

    return {
      restrict: 'E',
      link: linker,
      templateUrl: './templates/ax-lookup-guest.html',
      scope: {
        guest: '=', // the value of the input field (guest)
        firm: '=', // if provided, will be used to limit the guest lookup to guests that are associated with the specific firm.
        displayOnly: '=',
        guestCallback: '=' // optional method to call when the selectedGuest (internal parameter changes.
      }
    };
  }]);
});