/**
 * Created by Bob Vogel on 01.08.2014.
 * This directive displays selectable lists of reservations. There are four modes that
 * determine which reservations are shown:
 *     a (arrival) - shows reservations with the start date equal to the specified date.
 *     d (departure) = shows reservations with the end date equal to the specified date.
 *     u (upcomming) - shows departures within two days of the specified date
 *     c (current) - shows reservations that are currently active (have check-in date but no check-out date).
 * The attributes for this directive are:
 *    the-date - the specified date for the reservation queries (not used for mode c).
 *    selected-reservation - parent scope variable that receives the selected reservation object/number
 *    resCount - parent scope variable that receives the number of reservations in the list.
 *    list-mode - determines which reservations are shown,
 *    number-only - if true then the selected-reservation parameter receives an object with only one property 'number'
 *                  that contains the reservation number, if false then a "reservation link" object is returned.
 *                  This object has three properties:
 *                      number: the reservation number of the selected list item
 *                      room: the room associated with the selected list item
 *                      guest: the guest name associated with the selected list item.
 *
 */
define(['./module'], function (directives) {
  'use strict';
  directives.directive('axReservationList', ['Reservation', 'dashboard', 'configService', 'datetime',
    function (Reservation, dashboard, configService, datetime) {

      var linker = function (scope, element, attrs) {

        var haveAttributes = false,
            useLink = true, // determines if the selected link is just the reservation number of is the reservation link object
            listType, //value of listMode attribute
            theDate; //value of the listDate attribute

        //scope.selectedReservation = {number: 0, room: 0, guest: ''};
        //scope.selectedResId = -1;

        // Private function to build the reservation list. It will separate group reservations that
        // require individual checkins and bills.
        var buildList = function (resList, splitNames) {
          var rlist = [];
          var rlistItem = {};
          var ix = 0;

          scope.resCount = resList.length;
          resList.forEach(function (res) {
            if (res.rooms.length > 1 && res.individualBill) {
              // list res under each room with name defined in room list
              res.rooms.forEach(function (room) {
                rlistItem = {
                  id: ix,
                  roomNumber: room.number,
                  title: res.firm + ' (' + room.guest + (room.guest2 && !splitNames ? '/' + room.guest2 : '') + ')',
                  reservation_number: res.reservation_number,
                  reservation_link: {number: res.reservation_number, room: room.number, guest: room.guest},
                  multiroom: false,
                  end_date: res.end_date,
                  isCheckedIn: room.isCheckedIn,
                  isCheckedOut: room.isCheckedOut
                };
                rlist.push(rlistItem);
                ix++;
                if (splitNames & room.guest_count > 1) {
                  rlistItem = {
                    id: ix,
                    roomNumber: room.number,
                    title: res.firm + ' (' + room.guest2 + ')',
                    reservation_number: res.reservation_number,
                    reservation_link: {number: res.reservation_number, room: room.number, guest: room.guest2},
                    multiroom: false,
                    end_date: res.end_date,
                    isCheckedIn: room.isCheckedIn, //TODO-need means of checking out individuals in rooms
                    isCheckedOut: room.isCheckedOut
                  };
                  rlist.push(rlistItem);
                  ix++;
                }
              });
            }
            else {
              //only one room or multi-room - single bill
              rlistItem = {
                id: ix,
                roomNumber: res.rooms[0].number,
                title: res.title,
                reservation_number: res.reservation_number,
                reservation_link: {number: res.reservation_number, room: res.rooms[0].number, guest: res.rooms[0].guest},
                multiroom: res.rooms.length > 1,
                end_date: res.end_date,
                isCheckedIn: datetime.isDate(res.checked_in),
                isCheckedOut: datetime.isDate(res.checked_out)
              };
              rlist.push(rlistItem);
              ix++;
            }
          });
          return rlist;
        };

        // updates the reservation list, retrives the reservation info and rebuilds the list
        var updateList = function () {
          if (haveAttributes) {
            switch (listType) {
              case 'c':
                scope.getCurrent();
                break;
              case 'a':
                dashboard.getArrivals(theDate).then(function (result) {
                      scope.reservations = buildList(result);
                    },
                    function (err) {
                      scope.reservations = err;
                    });
                break;

              case 'd':
                dashboard.getDepartures(theDate).then(function (result) {
                      scope.reservations = buildList(result);
                    },
                    function (err) {
                      scope.reservations = err;
                    });
                break;

              case 'u':
                scope.show = true;
                dashboard.getUpcomming(theDate).then(function (result) {
                      scope.reservations = buildList(result);
                    },
                    function (err) {
                      scope.reservations = err;
                    });
                break;

              default:
                dashboard.getDepartures(theDate).then(function (result) {
                      scope.reservations = buildList(result);
                    },
                    function (err) {
                      scope.reservations = err;
                    });
                break;
            }
          }
        };

        // finds the specified reservation number in the displayed list and returns the list object's reservation_link
        // property
        var getResLink = function (id) {
          var reslink = {};

          scope.reservations.forEach(function (res) {
            if (res.reservation_number === resNum) {
              reslink = res.reservation_link;
            }
          });
          return reslink;
        }

        scope.txt = configService.loctxt;
        scope.show = false;

        // click method for when a user selects a reservation.
        scope.resSelected = function (id) {
          var resObj = scope.reservations[id];
          //console.log("resSelected function fired: " + resObj.reservation_number);
          scope.selectedResId = resObj.id;
          if (useLink) {
            scope.selectedReservation = resObj.reservation_link;
          }
          else {
            scope.selectedReservation = {number: resObj.reservation_number};
          }
        };

        scope.getCurrent = function () {
          scope.show = true;
          dashboard.getCurrentReservations().then(function (result) {
                scope.reservations = buildList(result, useLink);
              },
              function (err) {
                scope.reservations = err;
              });
        };

        scope.$on(configService.constants.reservationChangedEvent, function (event, result) {
           updateList(); //todo- check to see if reservation is in ilist before updating don't want to respond to a reservation this directive doesn't care about.
        });
        scope.$watchCollection('[listDate, listMode, numberOnly, selectedReservation.number ]', function (newvals) {
          if (newvals[2]) {
            useLink = !(scope.numberOnly === 'true');
          }
          if (!newvals[3]) {
            scope.selectedResId = -1;
          }
          if (newvals[1]) {
            listType = newvals[1].toLowerCase().substring(0, 1);
            if (listType !== 'c' && !newvals[0]) return;

            haveAttributes = true;
            theDate = newvals[0];
            //console.log('Directive watch fired, value is: ' + newvals[0] + " ListMode is: " + newvals[1]);

            updateList();
          }

        });

      }; //end linker

      return {
        restrict: 'AE',
        link: linker,
        templateUrl: './templates/ax-reservation-list.html',
        scope: {
          listDate: '=',
          selectedReservation: '=',
          resCount: '=',
          listMode: '@',
          numberOnly: '@'
        }
      };
    }
  ]);
});