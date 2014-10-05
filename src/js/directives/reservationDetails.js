/**
 * Created by Bob Vogel on 03.08.2014.
 *
 * Directive to display, edit and create a new reservation.
 * todo-consider making this drirective the sole source for working with reservations, i.e. all crud operations.
 * todo-incorporate the ReservationVM  and the logic from the new reservation page
 */
define(['./module'], function (directives) {
  'use strict';
  directives.directive('reservationDetails', ['Reservation', 'dashboard', function (Reservation, dashboard) {

    var linker = function (scope, element, attrs) {
      scope.hasResults = false;
      scope.edit = false;
      scope.editText = 'Edit';
/*      scope.rooms = [  //retrieve from database
        {number: 2, isDouble: false, price: 56},
        {number: 3, isDouble: false, price: 56},
        {number: 4, isDouble: false, price: 56},
        {number: 5, isDouble: false, price: 56},
        {number: 6, isDouble: false, price: 80},
        {number: 7, isDouble: false, price: 80},
        {number: 8, isDouble: false, price: 80},
        {number: 9, isDouble: true, price: 95}
      ];*/
      scope.rooms = [2,3,4,5,6,7,8,9];
      scope.numGuests = [1,2,3];
      scope.status = Reservation.getReservationStatusEnum();
      scope.plans = dashboard.getRoomPlanList();
      scope.resources= ['Platz 1','Platz 2'];
      scope.sources = Reservation.getReservationSourceEnum();
      scope.test = new Date(2014,6,29);
      scope.toggleEditButton = function(){
          if (scope.edit) {
            scope.edit = false;
            scope.editText = 'Edit'
          }
        else {
            scope.edit = true;
            scope.editText = 'Save'
          }
      }
      scope.$watch('reservation', function (newval) {
        console.log('Res Details Directive watch fired, value is: ' + newval);
        // read the listDate attribute to determine the dashboard method to call. Expected
        // values are arrival, departure, upcomming (departure within 2 days of date).
        if (newval > 0) {
          dashboard.getReservationByNumber(newval).then(function (result) {
                scope.hasResults=true;
                scope.res = result;
                scope.canCheckin = result.canCheckIn;
                scope.canCheckout = result.canCheckOut;
                scope.canCheckInOut = (scope.canCheckin || scope.canCheckout);
                scope.checkText = scope.canCheckin ? 'Check-in' : 'Check-out';
              },
              function (err) {
                scope.res = err;
              });
        }
      });
    };

    return {
      restrict: 'A',
      link: linker,
      templateUrl: './templates/reservationDetails.html',
      scope: {
        reservation: '='
      }
    }
  }]);
});