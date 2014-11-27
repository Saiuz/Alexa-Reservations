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
 *    selected-reservation - parent scope variable that receives the selected reservation
 *    list-mode - determines which reservations are shown
 *
 * Development notes:
 * When I tried to bind the theDate scope property using read only "@" binding, it
 * it did not respond to a watch. I assume I must use two-way binding for this.
 *
 */
define(['./module'], function (directives) {
  'use strict';
  directives.directive('axReservationList', ['Reservation', 'dashboard', 'configService', 'datetime',
    function (Reservation, dashboard, configService, datetime) {


    // Private function to build the reservation list. It will separate group reservations that
    // require individual checkins and bills.
    var buildList = function(resList, splitNames){
       var rlist = [];
      var rlistItem = {};
      var ix = 0;
      angular.forEach(resList,function (res) {
        if (res.rooms.length > 1 && res.individualBill) {
           // list res under each room with name defined in room list
          angular.forEach(res.rooms, function(room){
            rlistItem = {
              id: ix,
              roomNumber: room.number,
              title: res.firm + ' (' + room.guest +  (room.guest2 && !splitNames ? '/' + room.guest2 : '') + ')',
              reservation_number: res.reservation_number,
              reservation_link: {number: res.reservation_number, room: room.number, guest: room.guest},
              multiroom: false,
              end_date: res.end_date,
              isCheckedIn: room.isCheckedIn,
              isCheckedOut: room.isCheckedOut
            };
            rlist.push(rlistItem);
            ix++;
            if (splitNames) {
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
          //only one room or single bill
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

    var linker = function (scope, element, attrs) {

      var useLink =  false; // determines if the selected link is just the reservation number of is the reservation
                            // link object

      // finds the specified reservation number in the displayed list and returns the list object's reservation_link
      // property
      var getResLink = function (id) {
        var reslink = {};

        angular.forEach(scope.reservations, function (res) {
          if (res.reservation_number === resNum) {
            reslink = res.reservation_link;
          }
        });
        return reslink;
      }

      scope.txt = configService.loctxt;

      // read the listDate attribute to determine the dashboard method to call. Expected
      // values are arrival, departure, upcomming (departure within 2 days of date) and current.
      var listType = (attrs.listMode ? attrs.listMode.toLowerCase().substring(0, 1) : 'a');
      scope.show = false;

      // click method for when a user selects a reservation.
      scope.resSelected = function (id) {
        var resObj = scope.reservations[id];
        console.log("resSelected function fired: " + resObj.reservation_number);
        if (useLink) {
          scope.selectedReservation = resObj.reservation_link;
        }
        else {
          scope.selectedReservation = resObj.reservation_number;
        }
      };

      scope.getCurrent = function () {
        scope.show = true;
        useLink = true;
        dashboard.getCurrentReservations().then(function (result) {
              scope.reservations = buildList(result, useLink);
            },
            function (err) {
              scope.reservations = err;
            });
      };

      // Check if list type is current
      if (listType === 'c') {
        useLink = true;
        scope.getCurrent();
      }
      else {
        scope.$watch('theDate', function (newval) {
          useLink = false;
          console.log('Directive watch fired, value is: ' + newval + " ListMode is: " + attrs.listMode);
          switch (listType) {
            case 'a':
              dashboard.getArrivals(newval).then(function (result) {
                    scope.reservations = buildList(result);
                  },
                  function (err) {
                    scope.reservations = err;
                  });
              break;

            case 'd':
              dashboard.getDepartures(newval).then(function (result) {
                    scope.reservations = buildList(result);
                  },
                  function (err) {
                    scope.reservations = err;
                  });
              break;

            case 'u':
              scope.show = true;
              dashboard.getUpcomming(newval).then(function (result) {
                    scope.reservations = buildList(result);
                  },
                  function (err) {
                    scope.reservations = err;
                  });
              break;

            default:
              dashboard.getDepartures(new Date(2014, 7, 18)).then(function (result) {
                    scope.reservations = buildList(result);
                  },
                  function (err) {
                    scope.reservations = err;
                  });
              break;
          }
        });
      }
    };

    return {
      restrict: 'AE',
      link: linker,
      templateUrl: './templates/ax-reservation-list.html',
      scope: {
        theDate: '=listDate',
        selectedReservation: '='
      }
    };
  }
  ]);
});