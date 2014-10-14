/**
 * This directive provides a convenient way to add one or more rooms to a reservation. It provides a collapsible
 * form and table that allows the user to pick an available room and add it along with the guest name and price.
 * The directive API:
 *     roomList - an array of Room objects the user can choose from
 *     rooms - the rooms array from a Reservation object. The array is of type ReservedRoom. This array is modified
 *             by the directive.
 *     roomsCount - Keeps track of the number of entries in the rooms array. Can be used by the hosting UI if needed.
 *     quest - the default value to place in the guest field when a room is selected.
 *     planPrice - If this value is specified and > 0, then the value will be used as the default price for the
 *                 room. If it is not specified or = 0 then the price assigned to the selected Room object is used.
 *
 * Business Logic Implemented:
 *    If the planPrice is provided then the default price associated with the room object is overwritten by the plan
 *    price.
 */
define(['./module'], function (directives) {
  'use strict';
  directives.directive('axRoomSelect', ['dbEnums', function (dbEnums) {
    var linker = function (scope, element, attrs) {
      //private function to update the selectTitle and the roomCount values
      var updateTitle = function () {
        if (scope.rooms && scope.rooms.length) {
          if (scope.rooms.length === 1){
            scope.selectTitle = 'Zimmernummer ' + scope.rooms[0].number + ' ausgewählt';
          }
          else {
            scope.selectTitle = scope.rooms.length + ' Zimmer ausgewählt';
          }

          scope.roomCount = scope.rooms.length;
        }
        else {
          scope.selectTitle = 'Kein Zimmer';
          scope.roomCount = 0;
        }
      };

      // private rooms array. Contains slightly different structure than is required by the reservation object.
      // mimics the rooms array.
      scope.prooms = [];

      var generateAbbr = function (robj){
        return dbEnums.getRoomDisplayAbbr(robj);
      } ;

      //scope.reservation.rooms = scope.reservation.rooms || [];
      scope.roomSelect = {};
      scope.roomPrice = 0;
      scope.roomName = '';
      scope.isCollapsed = true;
      scope.selectTitle = '';
      scope.roomCount = 0;
      updateTitle();

      var ignoreWatch = true; //on initialization, do not remove any rooms

      // Watch for a change in roomList. If the list changes then we need to remove the rooms currently
      // on the reservation. The roomList will change if some other important property has changed,
      // such as start or end dates, number of occupants, etc.
      scope.$watch('roomList',function(newval, oldval){
        if (newval !== undefined){
          if (newval.length > 0) {
            scope.roomSelect = newval[0];
          }
          // first time don't delete rooms and also make the prooms array match
          // the rooms array.
          if (ignoreWatch) {
            ignoreWatch = false;
            angular.forEach(scope.rooms, function(item) {
              scope.prooms.push({
                number: item.number,
                guest: item.guest,
                price: item.price,
                room_type: generateAbbr(item)
              });
            });
          } else {
            scope.rooms = [];
            scope.prooms = [];
          }
        }
        updateTitle();
      });

      //pass in the selected value just in case the method gets called before the roomSelect property gets updated.
      scope.onRoomSelect = function(newval) {
        scope.roomPrice = Number(scope.planPrice ? scope.planPrice : scope.roomSelect.price);
        scope.roomName = scope.guest;
      };

      // Filters out already selected rooms from the roomList select control
      scope.filterAlreadySelected = function(item) {
        for (var ix = 0; ix < scope.rooms.length; ix++) {
          if (scope.rooms[ix].number === item.number) {
            return false;
          }
        }
        return true;
      };

      // function that adds room to the reservation.rooms array.
      scope.addRoom = function() {
        var room = { //same as ReservedRoom schema
          number: scope.roomSelect.number,
          room_type: scope.roomSelect.room_type,
          room_class: scope.roomSelect.room_class,
          guest: scope.roomName,
          price: scope.roomPrice
        };
        scope.rooms.push(room);
        scope.prooms.push({
          number: scope.roomSelect.number,
          guest: scope.roomName,
          price: scope.roomPrice,
          room_type: generateAbbr(room)
        });

        updateTitle();
        scope.roomSelect = scope.roomList[0];
        scope.roomPrice = 0;  //price for room
        scope.roomName = scope.guest;
        //scope.$apply();
      };

      // function that removes a room from the reservation.rooms array.
      scope.removeRoom = function(roomnum){
        for (var ix = 0; ix < scope.rooms.length; ix++) {
          if (scope.rooms[ix].number === roomnum) {
            scope.rooms.splice(ix, 1);
            break;
          }
        };
        for (var ix = 0; ix < scope.prooms.length; ix++) {
          if (scope.prooms[ix].number === roomnum) {
            scope.prooms.splice(ix, 1);
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
      templateUrl: './templates/ax-room-select.html',
      scope: {
        roomList: '=',
        rooms: '=',  //the rooms property from a reservation model
        roomCount: '=', //keeps track of the number of rooms assigned to the reservation
        guest: '@',
        planPrice: '@'
      }
    };
  }]);
});