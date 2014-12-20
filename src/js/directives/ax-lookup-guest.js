/**
 * This directive provides a guest lookup input field with a pop-up form that gives the ability to add a new guest
 * to the guest collection.
 * todo-add wildcard search?
 */
define(['./module'], function (directives) {
  'use strict';
  directives.directive('axLookupGuest', ['dashboard', 'Guest', '$modal', function (dashboard, Guest, $modal) {

    var linker = function (scope, element, attrs) {
      var ignoreWatch = false;
      var names = [];

      scope.loading = false;
      scope.axguest = '';
      scope.selectedGuest = {};
      scope.notFound = false;
      scope.canClear = false;

      scope.getGuests = function (val) {
        scope.loading = true;
        return dashboard.guestNameLookup(val, scope.firm).then(function (result) {
          console.log(val + " returns: " + result.length);
          names = [];
          if (result.length > 0) {
            for (var i = 0; i < result.length; i++) {  // using native for for speed
              names.push({dname: result[i].unique_name, name: result[i].name, id: result[i]._id});
            }
//            angular.forEach(result,function(item){
//              names.push({dname: item.unique_name, name: item.name, id: item._id});
//            });
          }
          scope.loading = false;
          scope.notFound = (names.length === 0);
          scope.canClear = !scope.notFound;
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

      scope.guestChanged = function ($item, $model, $label) {
        ignoreWatch = true;
        scope.guest = {name: $item.name, id: $item.id};
        scope.selectedGuest = $item;
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
              if (result.name) {
                names.push({dname: result.unique_name, name: result.name, id: result._id});
                scope.selectedGuest = names[0];
                scope.axguest = names[0].dname;
                scope.notFound = false;
                scope.canClear = true;
              }
            });
          }
        }

        console.log("Guest Name watch fired, " + newval);
      });

      scope.newGuest = function (size) {
        //if the name in the input field is in the db then ignore the button click
        if (names.length !== 0 && scope.axguest) {
          return;
        }
        scope.canClear = true;
        var modalInstance = $modal.open({
          templateUrl: './templates/guestFormModal.html',
          controller: 'GuestFormModalCtrl',
          size: size,
          resolve: {
            modalParams: function () {
              return {
                data: scope.axguest.split(' '),
                mode: 'Create'  //CRUD mode: 'Create', 'Read', 'Update', 'Delete'
              };
            }
          }
        });

        modalInstance.result.then(function (result) {
          console.log("Modal returned: " + result);
          names = [{dname: result.unique_name, name: result.name, id: result._id}];
          scope.selectedGuest = names[0]
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
        displayOnly: '='
      }
    };
  }]);
});