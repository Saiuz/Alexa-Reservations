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
  directives.directive('reservationList', ['Reservation', 'dashboard', function (Reservation, dashboard) {

    var linker = function (scope, element, attrs) {
      // read the listDate attribute to determine the dashboard method to call. Expected
      // values are arrival, departure, upcomming (departure within 2 days of date) and current.
      var listType = (attrs.listMode ? attrs.listMode.toLowerCase().substring(0, 1) : 'a');
      scope.show = false;

      // click method for when a user selects a reservation.
      scope.resSelected = function (resnumber) {
        console.log("resSelected function fired: " + resnumber);
        scope.selectedReservation = resnumber;
      };

      scope.getCurrent = function () {
        scope.show = true;
        dashboard.getCurrentReservations().then(function (result) {
              scope.reservations = result;
            },
            function (err) {
              scope.reservations = err;
            });
      };

      if (listType === 'c') {
        scope.getCurrent();
      }
      else {
        scope.$watch('theDate', function (newval) {
          console.log('Directive watch fired, value is: ' + newval + " ListMode is: " + attrs.listMode);
          switch (listType) {
            case 'a':
              dashboard.getArrivals(newval).then(function (result) {
                    scope.reservations = result;
                  },
                  function (err) {
                    scope.reservations = err;
                  });
              break;

            case 'd':
              dashboard.getDepartures(newval).then(function (result) {
                    scope.reservations = result;
                  },
                  function (err) {
                    scope.reservations = err;
                  });
              break;

            case 'u':
              scope.show = true;
              dashboard.getUpcomming(newval).then(function (result) {
                    scope.reservations = result;
                  },
                  function (err) {
                    scope.reservations = err;
                  });
              break;

            default:
              dashboard.getDepartures(new Date(2014, 7, 18)).then(function (result) {
                    scope.reservations = result;
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
      restrict: 'A',
      link: linker,
      templateUrl: './templates/reservationlist.html',
      scope: {
        theDate: '=listDate',
        selectedReservation: '='
      }
    };
  }
  ]);
});