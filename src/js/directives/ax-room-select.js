/**
 * Created by Owner on 10/11/2014.
 */
define(['./module'], function (directives) {
  'use strict';
  directives.directive('axRoomSelect', ['Reservation', function (Reservation) {
    var linker = function (scope, element, attrs) {
      //private function to update the selectTitle and the roomCount values
      var updateTitle = function () {
        if (scope.rooms && scope.rooms.length) {
          scope.selectTitle = scope.rooms.length + ' Zimmer ausgewählt';
          scope.roomCount = scope.rooms.length;
        }
        else {
          scope.selectTitle = 'Zimmer wählen';
          scope.roomCount = 0;
        }
      };

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
        console.log("ax-room-select watch fired") ;
        if (newval !== undefined){
          console.log("ax-room-select watch variable changed")
          scope.roomSelect = newval[0];
          if (ignoreWatch) {
            ignoreWatch = false;
          } else {
            scope.rooms = [];
          }
        }
        updateTitle();
      });

      //pass in the selected value just in case the method gets called before the roomSelect property gets updated.
      scope.onRoomSelect = function(newval) {
        scope.roomPrice = Number(scope.planPrice ? scope.planPrice : scope.roomSelect.price);
        scope.roomName = scope.guest;
         //scope.price = newval.price;
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
        }

        scope.rooms.push(room);
        updateTitle();
        scope.roomSelect = scope.roomList[0];
        scope.roomPrice = 0;  //price for room
        scope.roomName = scope.guest;
        scope.$apply();
      };

      // function that removes a room from the reservation.rooms array.
      scope.removeRoom = function(roomnum){
        for (var ix = 0; ix < scope.rooms.length; ix++) {
          if (scope.rooms[ix].number === roomnum) {
            scope.rooms.splice(ix, 1);
            break;
          }
        };

        updateTitle();
        scope.$apply();
      };
    };

    return {
      restrict: 'AE',
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