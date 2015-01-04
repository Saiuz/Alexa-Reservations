/**
 * This directive provides a convenient way to add one or more bookable resources to a reservation. It provides a
 * collapsible form and table that allows the user to pick an available resource and add it along with a price.
 * The directive API:
 *     resourceList - an array of Resource objects the user can choose from. The expectation is that the list contains
 *                    only one type of resource (e.g. parking places)
 *     resources - the resources array from a Reservation object. The array is of type ReservedResource. This array is
 *                 modified by the directive.
 *     rooms - Access to the reservation's rooms array, a resource must also be associated with a room.
 *     resourceType - Specifies the type of resource such as parking or conference room etc. This value should be
 *                    a value from the resourceTypeEnum array.
 *     resourceTitle - The display text for the specified resource. This value is displayed on the form.
 *     one-room - If true then we don't display the room selector, we assign the resource to the only room.
 *     read-only - If true then we just display the current resources.
 */
define(['./module'], function (directives) {
  'use strict';
  directives.directive('axResourceSelect', ['configService',function (configService) {
    var linker = function (scope, element, attrs) {
      scope.txt = configService.loctxt;
      scope.showfrm = false;
      //private function to update the selectTitle
      var updateTitle = function () {
        if (scope.resources && scope.resources.length) {
          if (scope.resources.length === 1) {
            scope.selectTitle = scope.resources[0].name + ' ' + configService.loctxt.selected;
          }
          else {
            scope.selectTitle = scope.resources.length +  ' ' + scope.resourceTitle + ' ' + configService.loctxt.selected;
          }
        }
        else {
          scope.selectTitle = configService.loctxt.no + ' ' +  scope.resourceTitle;
        }
      };

      //scope.reservation.resources = scope.reservation.resources || [];
      scope.resourceSelect = {};
      scope.selectedRoom = {};
      scope.resourcePrice = 0;
      scope.isCollapsed = true;
      scope.selectTitle = '';
      scope.displayOnly = false;
      scope.oneRoomB = false;
      updateTitle();

      var ignoreWatch = true; //on initialization, do not remove any resources

      // for read only mode we just need refresh when we get the resources
      scope.$watchCollection('[readOnly,resources, rooms.length, oneRoom]', function(newvals){
        scope.displayOnly = (newvals[0] === 'true');
        scope.showRooms = (newvals[3] !== 'true');
        if (scope.displayOnly && (newvals[1] && newvals[1].length) && (newvals[2] && newvals[2].length)) {
          scope.$apply();
        }
        if (newvals[2]) {
          scope.selectedRoom = scope.rooms[0];
        }
        if (newvals[3]) {
          scope.oneRoomB = newvals[3] === 'true';
        }
      });
      // Watch for a change in resourceList. If the list changes then we need to remove the resources currently
      // on the reservation. The resourceList will change if some other important property has changed,
      // such as start or end dates etc.
      scope.$watch('resourceList',function(newval, oldval){
        if (scope.displayOnly) return;
        if (newval !== undefined && newval.length > 0){
          if (newval.length > 0) {
            if (newval[0].name === '') {
              newval[0].name = "<" + scope.resourceTitle + " " + configService.loctxt.select +">";
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
        scope.showfrm = true;
      };

      scope.onRoomSelect = function(room) {
         scope.selectedRoom = room; // This is hack because the selectedRoom property is not being updated
                                    // in ng-model on the select statement.
      }
      // Filters out already selected resources from the resourceList select control
      scope.filterAlreadySelected = function(item) {
        for (var ix = 0; ix < scope.resources.length; ix++) {
          if (scope.resources[ix].name === item.name) {
            return false;
          }
        }
        return true;
      };

      scope.filterAlreadySelectedRoom = function(room) {
        for (var ix = 0; ix < scope.resources.length; ix++) {
          if (scope.resources[ix].room_number === room.number) {
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
          display_name: scope.resourceSelect.display_name,
          price: scope.resourcePrice,
          room_number: scope.selectedRoom.number,
          guest: scope.selectedRoom.guest
        }

        scope.resources.push(resource);
        updateTitle();
        scope.resourceSelect = scope.resourceList[0];
        scope.resourcePrice = 0;  //price for room
        scope.showfrm = false;
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
        rooms: '=',
        oneRoom: '@',
        resourceType: '@',
        resourceTitle: '@',
        readOnly: '@'
      }
    };
  }]);
});
