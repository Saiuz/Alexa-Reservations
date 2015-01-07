/**
 * Created by Bob Vogel on 03.08.2014.
 *
 * Directive to display, edit and create a new reservation.
 * todo-modify to show reservation details for a specific room / guest combination
 */
define(['./module'], function (directives) {
  'use strict';
  directives.directive('axReservationDetails', [
    'ReservationVM',
    '$rootScope',
    'configService',
    'datetime',
    'modals', function (ReservationVM, $rootScope, configService, datetime, modals) {

    var linker = function (scope, element, attrs) {
      scope.txt = configService.loctxt;
      scope.err = '';
      scope.errSave = false;
      scope.errLoad = false;

      var findRoom = function(roomNum) {
        var r = undefined;
        if (scope.rvm) {
          scope.rvm.res.rooms.forEach(function (room) {
            if (room.number === roomNum) {
              r = room;
            }
          });
        }
        return r;
      };

      scope.$watch('reservation', function (newval) {
        console.log('ax-reservation-details watch fired, value is: ' + newval);
        // read the listDate attribute to determine the dashboard method to call. Expected
        // values are arrival, departure, upcomming (departure within 2 days of date).
        if (newval && newval.number > 0) {
          ReservationVM.getReservationVM(newval.number, true).then(function (resVM) {
            var title, rm;
            scope.rvm = resVM;
            scope.hasResults=true;
            if (resVM.oneRoom && resVM.oneBill) {  //ignore values passed, use values from room in reservation
              scope.room = resVM.res.rooms[0].number;
              scope.guest = resVM.res.rooms[0].guest;
            }
            //else if (resVM.isGroup && resVM.oneBill) { //travel group do not use room/guest.
            //  scope.room = 0;
            //  scope.guest = '';
            //}
            else {  // choose the specific room & guest as defined in the reservation attribute.
              scope.room = newval.room;
              scope.guest = newval.guest;
            }
            rm = findRoom(newval.room);
            scope.canCheckIn = resVM.canCheckIn(scope.room);
            scope.canCheckOut = resVM.canCheckOut(scope.room);
            title = resVM.res.firm + ' (' + rm.guest + (rm.guest2 ? '/' + rm.guest2 : '') + ')';
            scope.title = resVM.oneBill ? resVM.res.title : title
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
        scope.rvm.checkIn(roomNum).then(function () {
          scope.canCheckOut = true;
          scope.canCheckIn = false;
          $rootScope.$broadcast(configService.constants.reservationChangedEvent, {data: scope.rvm.res.reservation_number});
        },function (err) {
          scope.err = err;
          scope.errSave = true;
        });
      };

      scope.filterRoomGuest = function (item) {
        return (item.number == scope.room && item.guest === scope.guest);
      };

      // Edit button click. Bring up modal form in edit mode;
      scope.edit = function () {
        var dataObj = {data: scope.reservation.number, extraData: undefined},
            model = modals.getModelEnum().reservation;

        if (datetime.isDate(scope.rvm.res.checked_out)) {
          modals.yesNoShow(configService.loctxt.wantToEdit,function (result) {
            if (result){
              modals.update(model, dataObj, function(result) {  // Retrieve reservation after edit
                ReservationVM.getReservationVM(scope.reservation.number, true).then(function (resVM) {
                  scope.rvm = resVM;
                  scope.hasResults=true;
                  if (resVM.oneRoom && resVM.oneBill) {  //update button link with current values.
                    scope.room = resVM.res.rooms[0].number;
                    scope.guest = resVM.res.rooms[0].guest;
                  }
                  else {  // Todo- need logic to determine if room or guest name has changed.
                    scope.room = 0; // currently we disable the link until we can work out the logic.
                    scope.guest = '';
                  }
                }, function (err) {
                  console.log('Read Error: ' + err);
                  scope.err = err;
                  scope.errLoad = true;
                });
              });
            }
          },'','','danger');
        }
        else {
          modals.update(model, dataObj, function(result) {  // Retrieve reservation after edit
            ReservationVM.getReservationVM(scope.reservation.number, true).then(function (resVM) {
              scope.rvm = resVM;
              scope.hasResults=true;
              if (resVM.oneRoom && resVM.oneBill) {    //update button link with current values.
                scope.room = resVM.res.rooms[0].number;
                scope.guest = resVM.res.rooms[0].guest;
              }
              else {  // Todo- need logic to determine if room or guest name has changed.
                scope.room = 0; // currently we disable the link until we can work out the logic.
                scope.guest = '';
              }
            }, function (err) {
              console.log('Read Error: ' + err);
              scope.err = err;
              scope.errLoad = true;
            });
          });
        }
      };

      // Clear the selected reservation
      scope.clearSelected = function () {
        scope.reservation = {number: 0, room: 0, guest: ''};
      };

    }; // end linker

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