/**
 * This directive provides a convenient way to add one or more rooms to a reservation. It provides a collapsible
 * form and table that allows the user to pick an available room and add it along with the guest name and price.
 * The directive API:
 *     roomList - an array of Room objects the user can choose from
 *     rooms - the rooms array from a Reservation object. The array is of type ReservedRoom. This array is modified
 *             by the directive.
 *     guestCount - The number of guests associated with the reservation.
 *     guestLookup - If value is true then the guest must be in the database.
 *     name - If guestLookup is false then this is the default value to place in the guest field when a room is
 *            selected. If guestLookup is true then this parameter is ignored.
 *     name2 - If guestLookup is false then this is the default value to place in the guest2 field when a room is
 *            selected. If guestLookup is true then this parameter is ignored.
 *     firm - If guestLookup is true then this parameter is used by the name lookup directive to filter names based
 *            on the firm specified. Otherwise this parameter is ignored.
 *     planPrice - If this value is specified and > 0, then the value will be used as the default price for the
 *                 room. If it is not specified or = 0 then the price assigned to the selected Room object is used.
 *     firmPrice - If this value is specified and > 0, then the value will be used as the default price for the
 *                 room. If it is not specified or = 0 then the price assigned to the selected Room object is used.
 *                 This parameter overrides the planPrice parameter.
 *     oneRoom - If true then the directive only allows the user to add one room.
 *     secondGuest - If true then the second guest input field is displayed when needed.
 *     readOnly - If true then the directive just displays a list of the rooms in the rooms array.
 *
 * Business Logic Implemented:
 *    If the planPrice is provided then the default price associated with the room object is overwritten by the plan
 *    price.  If the firmPrice is provided then the value provided will overwrite both the room and plan price as the
 *    default.
 *
 */
define(['./module'], function (directives) {
  'use strict';
  directives.directive('axRoomSelect', ['dbEnums', 'configService', function (dbEnums, configService) {
    var linker = function (scope, element, attrs) {
      scope.txt = configService.loctxt;

      //private function to update the selectTitle and the roomCount values
      var updateTitle = function () {
        if (scope.rooms && scope.rooms.length) {
          // determine total number of guests in room and build guest count string.
          var gcnt = 0;
          angular.forEach(scope.rooms, function (room) {
            gcnt = gcnt + room.guest_count;
          });
          scope.guestCountStr = '(' + gcnt + ' ' + (gcnt === 1 ? configService.loctxt.guest : configService.loctxt.guests) + ')';

          if (scope.rooms.length === 1) {
            scope.selectTitle = configService.loctxt.roomNumberAbrv +
            ' ' + scope.rooms[0].number + ' ' + configService.loctxt.selected;
          }
          else {
            scope.selectTitle = scope.rooms.length + ' ' + configService.loctxt.room + ' ' + configService.loctxt.selected;
          }
        }
        else {
          scope.selectTitle = configService.loctxt.noRoom;
          scope.guestCountStr = '';
        }
      };

      // private rooms array. Contains slightly different structure than is required by the reservation object.
      // mimics the rooms array.
      scope.prooms = [];

      var generateAbbr = function (robj) {
        return dbEnums.getRoomDisplayAbbr(robj);
      };

      //object used to get data from ui inputs
      scope.roomData = {
        price: 0,
        name: '',
        name2: '',
        guest_count: 0,
        oneInDZ: false,
        showOneCnt: false
      };
      scope.roomSelect = {};
      scope.isCollapsed = true;
      scope.selectTitle = '';
      scope.displayOnly = false;
      scope.showRooms = true;
      scope.guestLookupB = false;
      scope.oneRoomB = false;
      scope.secondGuestB = false;
      updateTitle();

      var ignoreWatch = true; //on initialization, do not remove any rooms

      // for read only mode we just need to display the rooms that are found in the rooms array
      scope.$watchCollection('[readOnly,rooms.length, guestLookup, oneRoom, secondGuest]', function (newvals) {
        scope.displayOnly = (newvals[0] === 'true');
        if (scope.displayOnly && newvals[1]) {
          angular.forEach(scope.rooms, function (item) {
            scope.prooms.push({
              number: item.number,
              guest: item.guest,
              guest2: item.guest2,
              price: item.price,
              max_occupants: item.max_occupants,
              room_type: generateAbbr(item)
            });
          });
        }
        else if (!scope.displayOnly && !newvals[1])  //edit mode but no existing rooms in rooms array
        {
          scope.prooms = [];
          scope.showRooms = (scope.oneRoom === 'false' || (scope.oneRoom === 'true' && scope.rooms.length < 1));
        }

        // create scope booleans from the attributes that take boolean values but are translated to the words 'true'
        // and 'false'
        if (newvals[2]) {
          scope.guestLookupB = (newvals[2] === 'true');
        }
        if (newvals[3]) {
          scope.oneRoomB = newvals[3] === 'true';
        }
        if (newvals[4]) {
          scope.secondGuestB = newvals[4] === 'true';
        }
        updateTitle();
      });

      // Watch for a change in roomList. If the list changes then we need to remove the rooms currently
      // on the reservation. The roomList will change if some other important property has changed,
      // such as start or end dates, number of occupants, etc.
      scope.$watch('roomList', function (newval) {
        if (scope.displayOnly) return;
        if (newval !== undefined && newval.length > 0) {
          if (newval.length > 0) {
            scope.roomSelect = newval[0];
          }
          // first time don't delete rooms and also make the prooms array match
          // the rooms array.
          if (ignoreWatch) {
            ignoreWatch = false;
            angular.forEach(scope.rooms, function (item) {
              scope.prooms.push({
                number: item.number,
                guest: item.guest,
                guest2: item.guest2,
                price: item.price,
                max_occupants: item.max_occupants,
                room_type: generateAbbr(item)
              });
            });
          } else {
            scope.rooms = [];
            scope.prooms = [];
            scope.showRooms = true;
          }
        }
        updateTitle();
      });

      // If the one person in double room changes then update some properties in the roomData object.
      scope.onOneInDZ = function () {
        if (scope.roomData.oneInDZ) {
          scope.roomData.name2 = '';
          scope.roomData.guest_count = 1;
        }
        else {
          scope.roomData.name2 = scope.guestLookup === 'true' ? '' : scope.name2;
          scope.roomData.guest_count = scope.roomSelect.max_occupants;
        }
      };

      scope.onRoomSelect = function () {
        var p = Number(scope.planPrice);
        var f = Number(scope.firmPrice);
        scope.roomData.price = f > 0 ? f : p > 0 ? p : scope.roomSelect.price;   //firmPrice then planPrice then room price
        scope.roomData.name = scope.guestLookup === 'true' ? '' : scope.name;
        scope.roomData.name2 = scope.guestLookup === 'true' ? '' : scope.name2;
        scope.roomData.oneInDZ = false;
        scope.roomData.showOneCnt = scope.roomSelect.max_occupants > 1;
        scope.roomData.guest_count = scope.roomSelect.max_occupants > Number(scope.guestCount) ? Number(scope.guestCount) : scope.roomSelect.max_occupants;
        // display second guest name if asked for and selected room is not a single
        scope.secondGuestB = scope.secondGuest === 'true' && scope.roomSelect.room_type !== dbEnums.getRoomTypeEnum()[0];
      };

      // Filters out already selected rooms from the roomList select control
      scope.filterAlreadySelected = function (item) {
        for (var ix = 0; ix < scope.rooms.length; ix++) {
          if (scope.rooms[ix].number === item.number) {
            return false;
          }
        }
        return true;
      };

      // function that adds room to the reservation.rooms array.
      scope.addRoom = function () {
        var name = scope.roomData.name.name ? scope.roomData.name.name : scope.roomData.name;
        var name2 = scope.roomData.name2.name ? scope.roomData.name2.name : scope.roomData.name2;
        var resRoom = {  // ReservedRoom schema object
          number: scope.roomSelect.number,
          room_type: scope.roomSelect.room_type,
          room_class: scope.roomSelect.room_class,
          default_price: scope.roomSelect.price,
          guest: name,
          guest2: name2,
          price: scope.roomData.price,
          guest_count: scope.roomData.guest_count
        }

        scope.rooms.push(resRoom);
        scope.prooms.push({
          number: scope.roomSelect.number,
          guest: name,
          guest2: name2,
          price: scope.roomData.price,
          max_occupants: (name && name2) ? 2 : 1,
          room_type: generateAbbr(resRoom)
        });

        updateTitle();
        scope.roomSelect = scope.roomList[0];
        scope.roomData.price = 0;  //price for room
        scope.roomData.name = name;
        scope.roomData.name2 = name2;
        scope.roomData.oneInDZ = false;
        scope.showRooms = (!scope.oneRoomB || (scope.oneRoomB && scope.rooms.length < 1));
        scope.isCollapsed = !scope.showRooms;
      };

      // function that removes a room from the reservation.rooms array. If we remove it, we must re-add it to the
      // list if it is not already there. For example, editing an existing reservation, if a room is deleted, then
      // it will not show up in the available rooms query since that room was not available when the query was
      // executed because this reservation already had it.
      scope.removeRoom = function (roomnum) {
        for (var ix = 0; ix < scope.rooms.length; ix++) {
          if (scope.rooms[ix].number === roomnum) {
            scope.rooms.splice(ix, 1);
            break;
          }
        }

        for (ix = 0; ix < scope.prooms.length; ix++) {
          if (scope.prooms[ix].number === roomnum) {
            scope.prooms.splice(ix, 1);
            break;
          }
        }

        updateTitle();
        scope.showRooms = (scope.oneRoom === 'false' || (scope.oneRoom === 'true' && scope.rooms.length < 1));
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
        guestCount: '@', //the number of guest selected for the reservation.
        name: '@',  // the name of the primary guest
        name2: '@',
        firm: '@',
        guestLookup: '@',
        oneRoom: '@',
        planPrice: '@',
        firmPrice: '@',
        readOnly: '@',
        secondGuest: '@'
      }
    };
  }]);
});