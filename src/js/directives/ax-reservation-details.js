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
      let originalLink = null;

      function findRoom(roomNum) {
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
        console.log('ax-reservation-details watch fired, value is: ' + JSON.stringify(newval));
        // read the listDate attribute to determine the dashboard method to call. Expected
        // values are arrival, departure, upcomming (departure within 2 days of date).
        if (newval && newval.number > 0) {
          scope.err = '';
          scope.errSave = false;
          scope.errLoad = false;
          originalLink = newval;
          _getReservation(newval.number, newval.room).then(() => {
            scope.$apply();
          }).catch((err) => {
            console.log('Read Error: ' + err);
            scope.err = err;
            scope.errLoad = true;
          });

          // ReservationVM.getReservationVM(newval.number, true).then(function (resVM) {
          //   var title, rm;
          //   scope.rvm = resVM;
          //   scope.hasResults=true;
          //   if (resVM.oneRoom && resVM.oneBill) {  //ignore values passed, use values from room in reservation
          //     scope.room = resVM.res.rooms[0].number;
          //     scope.guest = resVM.res.rooms[0].guest;
          //   }
          //   //else if (resVM.isGroup && resVM.oneBill) { //travel group do not use room/guest.
          //   //  scope.room = 0;
          //   //  scope.guest = '';
          //   //}
          //   else {  // choose the specific room & guest as defined in the reservation attribute.
          //     scope.room = newval.room;
          //     scope.guest = newval.guest;
          //   }
          //   rm = findRoom(newval.room);
          //   scope.canCheckIn = resVM.canCheckIn(scope.room);
          //   scope.canCheckOut = resVM.canCheckOut(scope.room);
          //   scope.canDelete = !datetime.isDate(resVM.res.checked_out) && !datetime.isDate(resVM.res.checked_in);
          //   title = (resVM.res.firm ? resVM.res.firm : configService.loctxt.cure) + ' (' + rm.guest + (rm.guest2 ? ' / ' + rm.guest2 : '') + ')';
          //   scope.title = resVM.oneBill ? resVM.res.title : title
          //   scope.$apply();
          // }, function (err) {
          //   console.log('Read Error: ' + err);
          //   scope.err = err;
          //   scope.errLoad = true;
          // });
        }
      });
//#region t
      // Find the specified room in the current reservation and set the isCheckedIn flag. If all
      // rooms are checked in then the checked_in property of the reservation is set to the current date.
      scope.checkin =  function (roomNum) {
        scope.rvm.checkIn(roomNum).then(function () {
          scope.canCheckOut = true;
          scope.canCheckIn = false;
          scope.canDelete = false;
          $rootScope.$broadcast(configService.constants.reservationChangedEvent, {data: scope.rvm.res.reservation_number});
        },function (err) {
          scope.err = err;
          scope.errSave = true;
        });
      };

      scope.filterRoomGuest = function (item) {
        return (item.number == scope.room && item.guest === scope.guest);
      };

      // Delete button click. Delete reservation if it is not checked in.
      // If it is a business group reservation, make sure the user wants to delete
      // the complete reservation not just the current user...
      scope.deleteRes = function() {
        var dataObj = {data: scope.reservation.number, extraData: {}},
            model = modals.getModelEnum().reservation;

        if (!datetime.isDate(scope.rvm.res.checked_in)) {
          if (scope.rvm.isGroup && !scope.rvm.oneBill) {
            modals.yesNoShow(configService.loctxt.wantToDeleteRes,function (result) {
              if (result){
                modals.delete(model,dataObj,function(result) {
                  scope.reservation = undefined;
                });
              }
            },'','','danger');
          }
          else {
            modals.delete(model,dataObj,function(result) {
              scope.reservation = undefined;
            });
          }
        }
      };

      // Edit button click. Bring up modal form in edit mode;
      scope.edit = function () {
        let dataObj = {data: scope.reservation.number, extraData: {}},
            model = modals.getModelEnum().reservation;


        if (datetime.isDate(scope.rvm.res.checked_out)) {
          modals.yesNoShow(configService.loctxt.wantToEdit,function (result) {
            if (result){
              modals.update(model, dataObj); //no promise handling, wait for res changed event.
            }
          },'','','danger');
        }
        else {
          modals.update(model, dataObj);
        }
      };

      scope.$on(configService.constants.reservationChangedEvent, (event, val) => {
        console.log("Reservation changed event fired " + val.data);
        _getReservation(val.data).then(() => {
          scope.$apply();
        }).catch((err) => {
          console.log('Read Error: ' + err);
          scope.err = err;
          scope.errLoad = true;
        });
      });

      // Clear the selected reservation
      scope.clearSelected = function () {
        scope.reservation = undefined;
      };
//#endregion
      async function _getReservation(resNumber, room) {
        try {
          let title, rm;
          let resVM = await ReservationVM.getReservationVM(resNumber, true);
          scope.rvm = resVM;
          scope.hasResults=true;
          if (resVM.oneRoom && resVM.oneBill) {    //update button link with current values.
            scope.room = resVM.res.rooms[0].number;
            scope.guest = resVM.res.rooms[0].guest;
          }
          else if (resVM.oneRoom && !resVM.oneBill) {
            scope.room = resVM.res.rooms[0].number;
            if (resVM.res.rooms[0].guest !== originalLink.guest && resVM.res.rooms[0].guest2 !== originalLink.guest ) {
              scope.guest = resVM.res.rooms[0].guest; //default to first guest since neither one matches.
            }
          }
          else {  // Group reservation use first room in lis and the main guest name
            scope.room = scope.room = resVM.res.rooms[0].number;
            scope.guest = resVM.res.guest.name;
          }
          // set other scope variables based on reservation
          if (room) {
            rm = findRoom(room); 
            rm = rm ? rm : resVM.res.rooms[0]; //Just incase the value of room passed in is not part of res.
          } else {
            rm = resVM.res.rooms[0];
          }
          scope.canCheckIn = resVM.canCheckIn(scope.room);
          scope.canCheckOut = resVM.canCheckOut(scope.room);
          scope.canDelete = !datetime.isDate(resVM.res.checked_out) && !datetime.isDate(resVM.res.checked_in);
          title = (resVM.res.firm ? resVM.res.firm : configService.loctxt.cure) + ' (' + rm.guest + (rm.guest2 ? ' / ' + rm.guest2 : '') + ')';
          scope.title = resVM.oneBill ? resVM.res.title : title
          // check to see if we need to update the reservation link
          if (scope.room !== originalLink.room || scope.guest !== originalLink.guest) {
            let newLink = {guest: scope.guest, number: originalLink.number, room: scope.room};
            scope.reservation = newLink;
          }
        } catch(err) {
          throw err;
        }
      }

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