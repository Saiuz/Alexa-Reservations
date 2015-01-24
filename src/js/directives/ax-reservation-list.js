/**
 * Created by Bob Vogel on 01.08.2014.
 * This directive displays selectable lists of reservations. There are four modes that
 * determine which reservations are shown:
 *     a (arrival) - shows reservations with the start date equal to the specified date.
 *     d (departure) = shows reservations with the end date equal to the specified date.
 *     u (upcomming) - shows departures within two days of the specified date
 *     c (current) - shows reservations that are currently active (have check-in date but no check-out date).
 *     r (recent) - shows reservations that have checked out between the current date and the specified date. If
 *                  the spcified date is not provided, the date defaults to the last week.
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
  directives.directive('axReservationList', ['Reservation', 'dashboard', 'configService', 'datetime', '$timeout',
    function (Reservation, dashboard, configService, datetime, $timeout) {

      var linker = function (scope, element, attrs) {

        var haveAttributes = false,
            useLink = true, // determines if the selected link is just the reservation number of is the reservation link object
            listType, //value of listMode attribute
            theDate, //value of the listDate attribute
            ignore = false; // ignore watch on reservation link if fired from select reservation method.

        //scope.selectedReservation = {number: 0, room: 0, guest: ''};
        //scope.selectedResId = -1;

        // Private function to build the reservation list. It will separate group reservations that
        // require individual checkins and bills.
        var _buildList = function (resList, splitNames) {
          var rlist = [],
              rlistItem = {},
              ix = 0,
              cdse = datetime.daysSinceEpoch(datetime.dateOnly(new Date())),
              sdse = 0,
              edse = 0;

          scope.resCount = resList.length;
          resList.forEach(function (res) {
            sdse = datetime.daysSinceEpoch(datetime.dateOnly(res.start_date));
            edse = datetime.daysSinceEpoch(datetime.dateOnly(res.end_date));

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
                  isCheckedOut: room.isCheckedOut,
                  lateCheckIn: !room.isCheckedIn && sdse < cdse,
                  lateCheckOut: room.isCheckedIn && !room.isCheckedOut &&  edse < cdse
                };
                rlist.push(rlistItem);
                ix++;
                if (splitNames && room.guest_count > 1) {
                  rlistItem = {
                    id: ix,
                    roomNumber: room.number,
                    title: res.firm + ' (' + room.guest2 + ')',
                    reservation_number: res.reservation_number,
                    reservation_link: {number: res.reservation_number, room: room.number, guest: room.guest2},
                    multiroom: false,
                    end_date: res.end_date,
                    isCheckedIn: room.isCheckedIn, //TODO-need means of checking out individuals in rooms
                    isCheckedOut: room.isCheckedOut,
                    lateCheckIn: !room.isCheckedIn && sdse < cdse,
                    lateCheckOut: room.isCheckedIn && !room.isCheckedOut &&  edse < cdse
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
                isCheckedOut: datetime.isDate(res.checked_out),
                lateCheckIn: !datetime.isDate(res.checked_in) && sdse < cdse,
                lateCheckOut: datetime.isDate(res.checked_in) && !datetime.isDate(res.checked_out) &&  edse < cdse
              };
              rlist.push(rlistItem);
              ix++;
            }
          });
          return rlist;
        };

        // updates the reservation list, retrives the reservation info and rebuilds the list
        var _updateList = function () {
          var afterDate;

          scope.reservations = [];
          if (haveAttributes) {
            switch (listType) {
              case 'c':
                  scope.show = true;
                  dashboard.getCurrentReservations().then(function (result) {
                        scope.reservations = _buildList(result, useLink);
                        _setChecked(scope.selectedReservation);
                      },
                      function (err) {
                        scope.error = err;
                      });
                break;
              case 'r':
                scope.show = true;
                afterDate = theDate ? theDate : datetime.dateOnly(new Date(), -7); //default to last 7 days
                dashboard.getPastReservations(afterDate).then(function (result) {
                      scope.reservations = _buildList(result, useLink);
                      _setChecked(scope.selectedReservation);
                    },
                    function (err) {
                      scope.error = err;
                    });
                break;
              case 'a':
                dashboard.getArrivals(theDate).then(function (result) {
                      scope.reservations = _buildList(result, useLink);
                      _setChecked(scope.selectedReservation);
                    },
                    function (err) {
                      scope.error = err;
                    });
                break;

              case 'd':
                dashboard.getDepartures(theDate).then(function (result) {
                      scope.reservations = _buildList(result, useLink);
                      _setChecked(scope.selectedReservation);
                    },
                    function (err) {
                      scope.error = err;
                    });
                break;

              case 'u':
                scope.show = true;
                dashboard.getUpcomming(theDate).then(function (result) {
                      scope.reservations = _buildList(result, useLink);
                      _setChecked(scope.selectedReservation);
                    },
                    function (err) {
                      scope.error = err;
                    });
                break;

              default:
                dashboard.getDepartures(theDate).then(function (result) {
                      scope.reservations = _buildList(result, useLink);
                      _setChecked(scope.selectedReservation);
                    },
                    function (err) {
                      scope.error = err;
                    });
                break;
            }
          }
        };

        // finds the specified reservation number in the displayed list and returns the list object's reservation_link
        // property
        var _setChecked = function (resLink) {
          if (!resLink) return;
          scope.reservations.forEach(function (res) {
            if (res.reservation_link && res.reservation_link.number === resLink.number && res.reservation_link.room === resLink.room && res.reservation_link.guest === resLink.guest) {
              $timeout(function () {
                scope.selectedResId = res.id;
                scope.$apply();
              });
            }
          });
        };

        scope.txt = configService.loctxt;
        scope.show = false;
        scope.reservations = [];

        // click method for when a user selects a reservation.
        scope.resSelected = function (id) {
          var resObj = scope.reservations[id];
          //console.log("resSelected function fired: " + resObj.reservation_number);
          scope.selectedResId = resObj.id;
          ignore = true;
          if (useLink) {
            scope.selectedReservation = resObj.reservation_link;
          }
          else {
            scope.selectedReservation = {number: resObj.reservation_number};
          }
        };


        scope.$on(configService.constants.reservationChangedEvent, function (event, result) {
          console.log("ax-reservation-list $on fired ");
           _updateList(); //todo- check to see if reservation is in ilist before updating don't want to respond to a reservation this directive doesn't care about.
        });

        scope.$watchCollection('[listDate, listMode, numberOnly, selectedReservation]', function (newvals) {
          console.log("ax-reservation-list watcher fired " + newvals);
          if (newvals[2]) {  //todo-may want to deprecate this feature
            useLink = !(scope.numberOnly === 'true');
          }
          if (!newvals[3]) {
            scope.selectedResId = -1;
          }
          else {
            if (!ignore) {
              if (!scope.reservations.length) {
                _updateList();
                _setChecked(newvals[3]);
              }
              else {
                _setChecked(newvals[3]);
              }
              ignore = false;
            }
          }
          if (newvals[1]) {
            listType = newvals[1].toLowerCase().substring(0, 1);
            if (!(listType === 'c' || listType === 'r') && !newvals[0]) return;

            haveAttributes = true;
            theDate = newvals[0];
            //console.log('Directive watch fired, value is: ' + newvals[0] + " ListMode is: " + newvals[1]);

            _updateList();
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