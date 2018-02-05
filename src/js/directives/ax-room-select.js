/**
 * This directive provides a convenient way to add one or more rooms to a reservation. It provides a collapsible
 * form and table that allows the user to pick an available room and add it along with the guest name and price.
 * The directive API:
 *     roomList - an array of Room objects the user can choose from
 *     rooms - the rooms array from a Reservation object. The array is of type ReservedRoom. This array is modified
 *             by the directive.
 *     guestCount - The number of guests associated with the reservation. For group Reservations this value will be
 *                  set by the room selection.
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
 *   todo-add room type class based on room abbrev.
 */
define(['./module'], function (directives) {
  'use strict';
  directives.directive('axRoomSelect', ['dbEnums', 'configService', 'convert', '$filter',
    function (dbEnums, configService, convert, $filter) {
    var linker = function (scope, element, attrs) {
      var lastDeleted = {
        guest: '',
        guest2: '',
        checkedIn: false
          }, //object to hold information about a deleted room such as if it was checked in. This only handles a swap. If
             // a room is added to a multiroom res. We must handle checked in logic in before save method(s).
          swapRoomType = '',
          swapRoomNumber = 0;

      scope.txt = configService.loctxt;
      // private rooms array. Contains slightly different structure than is required by the reservation object.
      // mimics the rooms array.
      scope.prooms = [];

      //private function to update the selectTitle and the roomCount values
      let _updateTitle = () => {
        if (scope.rooms && scope.rooms.length) {
          // determine total number of guests in room and build guest count string.
          let gcnt = 0;
          angular.forEach(scope.rooms, function (room) {
            gcnt = gcnt + room.guest_count;
          });
          scope.guestCountStr = '(' + gcnt + ' ' + (gcnt === 1 ? configService.loctxt.guest : configService.loctxt.guests) + ')';

          if (scope.rooms.length === 1) {
            scope.selectTitle = configService.loctxt.roomNumberAbrv +
            ' ' + scope.rooms[0].number + ' ' + configService.loctxt.selected;
            scope.rprice = scope.rooms[0].price;
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

      // private function that returns true if the specified room number is NOT in the available rooms list
      let _roomNotInList = (roomNumber) => {
        for (let i = 0; i < scope.roomList.length; i++) {
          if (scope.roomList[i].number === roomNumber) {
            return false;
          }
        }
        return true;
      };

      let _findInPlist =  (roomNumber) => {
        let prm = null;
        scope.prooms.forEach(function (p) {
          if (p.number === roomNumber) {
            prm = p;
          }
        });
        return prm;
      };

      let _findInRooms = (roomNumber) => {
        let rm = null;
        scope.rooms.forEach(function (r) {
          if (r.number === roomNumber) {
            rm = r;
          }
        });
        return rm;
      };

      let _clearSwap = () => {
        scope.prooms.forEach(function (p) {
          p.swapFlg = false;
          p.swapRoom = null;
          p.newRoom = null;
        });
        swapRoomType = '';
        swapRoomNumber = 0;
      };

      let _buildDisplayArray = () => {
        let parray = [];
        scope.rooms.forEach((item) => {
          parray.push({
            number: item.number,
            guest: item.guest,
            guest2: item.guest2,
            price: item.price,
            priceTxt: $filter('number')(item.price,2),
            max_occupants: item.max_occupants,
            room_type: _generateAbbr(item),
            swapFlg: false,
            swapRoom: {},
            newRoom: {}
          });
        });
        scope.prooms = parray;
      };

      let _generateAbbr = (robj) => {
        return dbEnums.getRoomDisplayAbbr(robj);
      };

      //object used to get data from ui inputs
      scope.roomData = {
        price: 0,
        priceTxt: '0',
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
      scope.showRooms = false;
      scope.guestLookupB = false;
      scope.oneRoomB = false;
      scope.secondGuestB = false;
      scope.editGuestB = false;
      scope.editPriceB = false;
      _updateTitle();

      var ignoreWatch = true; //on initialization, do not remove any rooms

      // for read only mode we just need to display the rooms that are found in the rooms array
      scope.$watchCollection('[readOnly,rooms.length, guestLookup, oneRoom, secondGuest, editGuest, isGroup, planPrice]', function (newvals) {
        // create scope booleans from the attributes that take boolean values but are translated to the words 'true'
        // and 'false'
        scope.displayOnly = (newvals[0] === 'true');
        scope.guestLookupB = (newvals[2] === 'true');
        scope.oneRoomB = newvals[3] === 'true';
        scope.secondGuestB = newvals[4] === 'true';
        scope.editGuestB = newvals[5] === 'true';
        scope.isGroupB = newvals[6] === 'true';
        scope.hasPlan = newvals[7] !== '0';

        if (scope.displayOnly && newvals[1]) {
          _buildDisplayArray();
        }
        else if (!scope.displayOnly && !newvals[1])  //edit mode but no existing rooms in rooms array
        {
          scope.prooms = [];
          scope.showRooms = true;
        }
        else {
          scope.showRooms = (!scope.oneRoomB || (scope.oneRoomB && scope.rooms.length < 1));
        }

         _updateTitle();
      });

      // Watch for a change in roomList. If the list changes then we may need to remove the rooms currently
      // on the reservation. The roomList will change if some other important property has changed,
      // such as start or end dates, number of occupants, etc.
      scope.$watch('roomList', function (newval) {
        if (scope.displayOnly) return;
        if (newval !== undefined && newval.length > 0) {
          scope.roomSelect = newval[0];

          // first time don't delete rooms and also make the prooms array match
          // the rooms array.
          if (ignoreWatch) {
            ignoreWatch = false;
            _buildDisplayArray();
          }
          else { // roomList has changed because of user action
            // First check to see if the reservation has one or more rooms, if so then check each room to see
            // if it is still present in the list. If not then remove the room from the reservation and from
            // prooms. If it still exists then keep it.
            var p = Number(scope.planPrice),
                f = Number(scope.firmPrice),
                delrooms = [];

            if (scope.rooms && scope.rooms.length > 0) {
              scope.rooms.forEach(function (rm){
                if (_roomNotInList(rm.number)) {
                  delrooms.push(rm._id);
                }
                else { //update room price in case plan  or firm price has changed
                  rm.price = f > 0 ? f : p > 0 ? p : rm.price;
                }
              });
              delrooms.forEach(function (id) {
                scope.rooms.id(id).remove();
              });
              _buildDisplayArray();
            }
            else {
              scope.rooms = [];
              scope.prooms = [];
              scope.showRooms = true;
            }
          }
        }
        _updateTitle();
      });

      // If the one person in double room changes then update some properties in the roomData object.
      scope.onOneInDZ = function () {
        if (scope.roomData.oneInDZ) {
          scope.roomData.name2 = '';
          scope.roomData.guest_count = 1;
          if (! scope.oneRoomB) {
            scope.roomData.name = `${scope.txt.guest} in Zr. ${scope.roomSelect.number}`;
          }
        }
        else {
          let name2;
          if (scope.oneRoomB) {
            name2 =  scope.name2 ? scope.name2 : configService.loctxt.roommate;
          }
          else {
            scope.roomData.name = `${scope.txt.guests} 2 in Zr. ${scope.roomSelect.number}`;
            name2 = "";
          }
          scope.roomData.name2 = scope.guestLookup === 'true' ? '' : name2;
          scope.roomData.guest_count = scope.roomSelect.max_occupants;
        }
      };

      scope.onRoomSelect = function () {
        if (scope.roomSelect) { //This method can fire when the room list is changed after form is initialized without roomSelect defined
          var p = Number(scope.planPrice);
          var f = Number(scope.firmPrice);
          scope.roomData.price = f > 0 ? f : p > 0 ? p : scope.roomSelect.price;   //firmPrice then planPrice then room price
          scope.roomData.priceTxt = $filter('number')(scope.roomData.price, 2);
          let name;
          let name2;
          if (scope.oneRoomB) {
            name =  scope.name
            name2 =  scope.name2 ? scope.name2 : scope.roomData.max_occupants > 1 ? configService.loctxt.roommate : '';
          }
          else {
            name = scope.roomSelect.max_occupants > 1 ? `${scope.txt.guests} 2 in Zr. ${scope.roomSelect.number}` : `${scope.txt.guest} in Zr. ${scope.roomSelect.number}`;
            name2 = '';
          }
          
          scope.roomData.name = lastDeleted.guest ? lastDeleted.guest : scope.guestLookup === 'true' ? '' : name;
          scope.roomData.name2 = lastDeleted.guest2 ? lastDeleted.guest2 : scope.guestLookup === 'true' ? '' : name2;
          scope.roomData.oneInDZ = false;
          scope.roomData.showOneCnt = scope.roomSelect.max_occupants > 1;
          if (scope.oneRoom === "true") {
          scope.roomData.guest_count = scope.roomSelect.max_occupants > Number(scope.guestCount) ? Number(scope.guestCount) : scope.roomSelect.max_occupants;
          } else {
            scope.roomData.guest_count = scope.roomSelect.max_occupants;
          }
          // display second guest name if asked for and selected room is not a single
          scope.secondGuestB = scope.secondGuest === 'true' && scope.roomSelect.room_type !== dbEnums.getRoomTypeEnum()[0];
        }
      };

      //start room swap activity for selected room
      scope.startRoomSwap = function (rmNum) {  //Displays the dropdown
        var prm = _findInPlist(rmNum),
            rm = _findInRooms(rmNum);

        _clearSwap();
        if (prm && rm) {
          swapRoomType = rm.room_type;
          swapRoomNumber = rmNum;
          prm.swapFlg = true;
          prm.swapRoom = rm;
          prm.newRoom = scope.roomList[0];
          //scope.$apply();
        }
      };

      // execute room swap for selected room
      scope.endRoomSwap = function (rmNum) {
        var prm = _findInPlist(rmNum);
        if (prm && prm.swapRoom && prm.newRoom) { // get the proom item and update it along with the actual room item
          prm.swapRoom.number = prm.newRoom.number;
          prm.swapRoom.room_class = prm.newRoom.room_class;
          // update the proom entry.
          prm.number = prm.newRoom.number;
          prm.room_type =  _generateAbbr(prm.newRoom);
        }
        _clearSwap();
        //scope.$apply();
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

      scope.filterSameType = function (item) {
         return ((item.room_type === swapRoomType && item.number !== swapRoomNumber) || item.number === 0);
      };
      // function that adds room to the reservation.rooms array.
      scope.addRoom = function () {
        var name = scope.roomData.name.name ? scope.roomData.name.name : scope.roomData.name ;
        var name2 = scope.roomData.name2.name ? scope.roomData.name2.name : scope.roomData.name2;
        var resRoom = {  // ReservedRoom schema object
          number: scope.roomSelect.number,
          room_type: scope.roomSelect.room_type,
          room_class: scope.roomSelect.room_class,
          default_price: scope.roomSelect.price,
          guest: name,
          guest2: name2,
          price: scope.roomData.price,
          guest_count: scope.roomData.guest_count,
          isCheckedIn: lastDeleted.checkedIn
        };

        if (scope.isGroupB) scope.guestCount += scope.roomData.guest_count; //new
        scope.rooms.push(resRoom);
        scope.prooms.push({
          number: scope.roomSelect.number,
          guest: name,
          guest2: name2,
          price: scope.roomData.price,
          priceTxt: $filter('number')(scope.roomData.price,2),
          max_occupants: (name && name2) ? 2 : 1,
          room_type: _generateAbbr(resRoom),
          swapFlg: false,
          swapRoom: null,
          newRoom: null
        });

        _updateTitle();
        scope.roomSelect = scope.roomList[0];
        scope.roomData.price = 0;  //price for room
        scope.roomData.priceTxt = $filter('number')(scope.roomData.price,2),
        scope.roomData.name = name;
        scope.roomData.name2 = name2;
        scope.roomData.oneInDZ = false;
        scope.showRooms = (!scope.oneRoomB || (scope.oneRoomB && scope.rooms.length < 1));
        scope.isCollapsed = !scope.showRooms;
        lastDeleted = {guest: '', guest2: '', checkedIn: false}; //clear lastDeleted object
      };

      // function that removes a room from the reservation.rooms array. If we remove it, we must re-add it to the
      // list if it is not already there. For example, editing an existing reservation, if a room is deleted, then
      // it will not show up in the available rooms query since that room was not available when the query was
      // executed because this reservation already had it.
      scope.removeRoom = function (roomnum) {
        for (var ix = 0; ix < scope.rooms.length; ix++) {
          if (scope.rooms[ix].number === roomnum) {
            lastDeleted.guest = scope.rooms[ix].guest;
            lastDeleted.guest2 = scope.rooms[ix].guest2;
            lastDeleted.checkedIn = scope.rooms[ix].isCheckedIn;
            var id = scope.rooms[ix]._id;
            scope.guestCount -= scope.rooms[ix].guest_count;
            scope.rooms.id(id).remove(); //Mongoose sub doc remove
            break;
          }
        }

        for (ix = 0; ix < scope.prooms.length; ix++) {
          if (scope.prooms[ix].number === roomnum) {
            scope.prooms.splice(ix, 1);
            break;
          }
        }
        scope.rprice = undefined;
        _updateTitle();
        scope.showRooms = (scope.oneRoom === 'false' || (scope.oneRoom === 'true' && scope.rooms.length < 1));
        //scope.$apply();
      };

      scope.guestEdited = function (roomnum) {
        var guest;
        for (var i = 0; i < scope.prooms.length; i++) {
          if (scope.prooms[i].number === roomnum) {
            guest = scope.prooms[i].guest;
            break;
          }
        }
        for (var ix = 0; ix < scope.rooms.length; ix++) {
          if (scope.rooms[ix].number === roomnum) {
            scope.rooms[ix].guest = guest;
            scope.rooms[ix].update_date = new Date();
            break;
          }
        }
      };

      scope.priceEdited = function (roomnum) {
        var price;
        for (var i = 0; i < scope.prooms.length; i++) {
          if (scope.prooms[i].number === roomnum) {
            price = convert.deNumberToDecimal(scope.prooms[i].priceTxt, true);
            if (!price && price !== 0) { // If we can't convert input to a number then restore to old value and exit function.
              scope.prooms[i].priceTxt = $filter('number')(scope.prooms[i].price,2);
              return;
            }
            scope.prooms[i].price = price ;
            break;
          }
        }
        for (var ix = 0; ix < scope.rooms.length; ix++) {
          if (scope.rooms[ix].number === roomnum) {
            scope.rooms[ix].price = price;
            scope.rooms[ix].update_date = new Date();
            break;
          }
        }
      };

      //scope.priceEdited = function () {
      //  priceTxt: $filter('currency')(scope.roomData.price)
      //};
    };

    return {
      restrict: 'E',
      link: linker,
      templateUrl: './templates/ax-room-select.html',
      scope: {
        roomList: '=',
        rooms: '=',  //the rooms property from a reservation model
        guestCount: '=', //the number of guest selected for the reservation.
        name: '@',  // the name of the primary guest
        name2: '@',
        firm: '@',
        guestLookup: '@',
        oneRoom: '@',
        planPrice: '@',
        firmPrice: '@',
        readOnly: '@',
        secondGuest: '@',
        editGuest: '@',
        isGroup: '@'
      }
    };
  }]);
});