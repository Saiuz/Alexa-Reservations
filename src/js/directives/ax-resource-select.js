/**
 * This directive provides a convenient way to add one or more bookable resources to a reservation. It provides a
 * collapsible form and table that allows the user to pick an available resource and add it along with a price.
 * The directive API:
 *     resourceList - an array of Resource objects the user can choose from. The expectation is that the list contains
 *                    only one type of resource (e.g. parking places)
 *     resources - the resources array from a Reservation object. The array is of type ReservedResource. This array is
 *                 modified by the directive.
 *     resourceCount - Keeps track of the number of entries in the resources array. Can be used by the hosting UI if
 *                     needed.
 *     resourceType - Specifies the type of resource such as parking or conference room etc. This value should be
 *                    a value from the resourceTypeEnum array.
 *     resourceTitle - The display text for the specified resource. This value is displayed on the form.
 */
define(['./module'], function (directives) {
  'use strict';
  directives.directive('axResourceSelect', [function () {
    var linker = function (scope, element, attrs) {
      //private function to update the selectTitle and the resourceCount values
      var updateTitle = function () {
        if (scope.resources && scope.resources.length) {
          if (scope.resources.length === 1) {
            scope.selectTitle = scope.resources[0].name + ' ausgewählt';
          }
          else {
            scope.selectTitle = scope.resources.length +  ' ' + scope.resourceTitle + ' ausgewählt';
          }
          scope.resourceCount = scope.resources.length;
        }
        else {
          scope.selectTitle = 'Kein ' + scope.resourceTitle;
          scope.resourceCount = 0;
        }
      };

      //scope.reservation.resources = scope.reservation.resources || [];
      scope.resourceSelect = {};
      scope.resourcePrice = 0;
      scope.isCollapsed = true;
      scope.selectTitle = '';
      scope.resourceCount = 0;
      updateTitle();

      var ignoreWatch = true; //on initialization, do not remove any resources

      // Watch for a change in resourceList. If the list changes then we need to remove the resources currently
      // on the reservation. The resourceList will change if some other important property has changed,
      // such as start or end dates, number of occupants, etc.
      scope.$watch('resourceList',function(newval, oldval){
        if (newval !== undefined){
          if (newval.length > 0) {
            if (newval[0].name === '') {
              newval[0].name = "<" + scope.resourceTitle + " auswählen>";
            }
            scope.resourceSelect = newval[0];
          }
          if (ignoreWatch) {
            ignoreWatch = false;
          } else {
            scope.resources = [];
          }
        }
        updateTitle();
      });

      //pass in the selected value just in case the method gets called before the resourceSelect property gets updated.
      scope.onResourceSelect = function(newval) {
        scope.resourcePrice =  Number(scope.resourceSelect.price);
      };

      // Filters out already selected resources from the resourceList select control
      scope.filterAlreadySelected = function(item) {
        for (var ix = 0; ix < scope.resources.length; ix++) {
          if (scope.resources[ix].name === item.name) {
            return false;
          }
        }
        return true;
      };

      // function that adds resource to the reservation.resources array.
      scope.addResource = function() {
        var resource = { //same as ReservedResource schema
          name: scope.resourceSelect.name,
          resource_type: scope.resourceSelect.resource_type,
          price: scope.resourcePrice
        }

        scope.resources.push(resource);
        updateTitle();
        scope.resourceSelect = scope.resourceList[0];
        scope.resourcePrice = 0;  //price for room
      };

      // function that removes a room from the reservation.resources array.
      scope.removeResource = function(res){
        for (var ix = 0; ix < scope.resources.length; ix++) {
          if (scope.resources[ix].name === res) {
            scope.resources.splice(ix, 1);
            break;
          }
        };

        updateTitle();
        //scope.$apply();
      };
    };

    return {
      restrict: 'E',
      link: linker,
      templateUrl: './templates/ax-resource-select.html',
      scope: {
        resourceList: '=',
        resources: '=',
        resourceCount: '=',
        resourceType: '@',
        resourceTitle: '@'
      }
    };
  }]);
});
