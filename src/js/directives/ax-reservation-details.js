/**
 * Created by Bob Vogel on 03.08.2014.
 *
 * Directive to display, edit and create a new reservation.
 * todo-consider making this drirective the sole source for working with reservations, i.e. all crud operations.
 * todo-incorporate the ReservationVM  and the logic from the new reservation page
 */
define(['./module'], function (directives) {
  'use strict';
  directives.directive('axReservationDetails', ['ReservationVM', 'configService', function (ReservationVM, configService) {

    var linker = function (scope, element, attrs) {
      scope.txt = configService.loctxt;
      scope.err = '';
      scope.errSave = false;
      scope.errLoad = false;

      var findRoom = function(roomNum) {
        var r = undefined;
        angular.forEach(scope.rvm.res.rooms, function (room) {
          if (room.number === roomNum){
            r = room;
          }
        });
        return r;
      };

      var allCheckedIn = function() {
        var allcheckedin = true;
        for (var i = 0; i < scope.rvm.res.rooms.length; i++) {
          if (!scope.rvm.res.rooms[i].isCheckedIn) {
            allcheckedin = false;
            break;
          }
        }
        return allcheckedin;
      };

      scope.$watch('reservation', function (newval) {
        console.log('Res Details Directive watch fired, value is: ' + newval);
        // read the listDate attribute to determine the dashboard method to call. Expected
        // values are arrival, departure, upcomming (departure within 2 days of date).
        if (newval > 0) {
          ReservationVM.getReservationVM(newval, true).then(function (resVM) {
            scope.rvm = resVM;
            scope.hasResults=true;
          }, function (err) {
            console.log('Read Error: ' + err);
            scope.err = err;
            scope.errLoad = true;
          });
        }
      });

      // Find the specified room in the current reservation and set the isCheckedIn flag. If all
      // rooms are checked in then the checked_in property of the reservation is set to the current date.
      scope.checkin =  function (roomNum) {
        var room = findRoom(roomNum);
        if (room) {
          room.isCheckedIn = true;
          if (allCheckedIn()) {
            scope.rvm.res.checked_in = new Date();
          }
          // now save the reservation.
          scope.rvm.res.save(function(err){
            if (err) {
              scope.err = err;
              scope.errSave = true;
            }
            else {
              scope.$apply();
            }
          });
        }
      };

      // Find the specified room in the current reservation and set the isCheckedOut flag. If all
      // rooms are checked out then the checked_out property of the reservation is set to the current date.
      // This should also start the bill generation process.
      scope.checkout = function (roomNum) {
        //todo-left off here. Need to re-think the whole checkout process. May want to pop up the bill pages
        //todo-as modal menus.
      };

    };

    return {
      restrict: 'AE',
      link: linker,
      templateUrl: './templates/ax-reservation-details.html',
      scope: {
        reservation: '='
      }
    }
  }]);
});