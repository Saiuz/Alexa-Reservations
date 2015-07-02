/**
 * Created by Owner on 05.08.2014.
 *
 * Controller for charges
 */
define(['./module'], function (controllers) {
  'use strict';

  controllers.controller('ChargesCtrl',
      ['$scope',
        '$state',
        '$rootScope',
        '$stateParams',
        'ReservationVM',
        'dashboard',
        'configService',
        'modals',
        'datetime',
        function ($scope, $state, $rootScope, $stateParams, ReservationVM, dashboard, configService, modals, datetime) {
          $scope.appTitle = $rootScope.appTitle;
          $scope.appBrand = $rootScope.appBrand;
          $scope.url = $state.current.url;
          $scope.pageHeading = configService.loctxt.charges;

          $scope.txt = configService.loctxt;
          $scope.showCharges = false;
          $scope.showHiddenExpenses = false;
          $scope.planText = '***';
          $scope.pTitle = configService.loctxt.selectReservation;

          // for reservation-list directive
          $scope.selected = {
            reservation: undefined,
            rcCnt: 0
          };


          dashboard.getItemTypeListExcept('').then(function(items){
            $scope.itemTypes = items;
          });

          $scope.$watch('selected.reservation', function (newval) {
            if (!newval || !newval.number) return; //We expect an object with (res) number, room and guest properties
            // Get reservation and prepare the room plan text and handle the special case
            // where we have a tour group reservation with one bill- need to show the rooms
            ReservationVM.getReservationVM(newval.number, true).then(function (resVM) {
              if(resVM.res) {
                $scope.rvm = resVM;
                $scope.pTitle = configService.loctxt.charges;
                $scope.showCharges = true;
                $scope.room = newval.room;
                $scope.guest = newval.guest;
                $scope.gRooms = [];
                var rmObj = resVM.generatePlanRoomString(newval.room, newval.guest);
                $scope.roomGuest1 = rmObj.roomGuest1;
                $scope.insurance = resVM.res.insurance;
                $scope.roomGuest2 = rmObj.roomGuest2;
                $scope.gRooms = rmObj.groupRooms;
                $scope.planText = rmObj.displayText;
                //$scope.selectedReservation = newval;
              }
            });
          });

          // Edit button click. Bring up modal form in edit mode;
          $scope.edit = function () {
            var dataObj = {data: $scope.selected.reservation.number, extraData: undefined},
                model = modals.getModelEnum().reservation;

            if (datetime.isDate($scope.rvm.res.checked_out)) {
              modals.yesNoShow(configService.loctxt.wantToEdit,function (result) {
                if (result){
                  modals.update(model, dataObj, function(result) {  // Retrieve reservation after edit by changing selected reservation object
                    ReservationVM.getReservationVM($scope.selected.reservation.number, true).then(function (resVM) {
                      $scope.rvm = resVM;
                      $scope.showCharges=true;
                      if (resVM.oneRoom && resVM.oneBill) {  //update selectedReservation with current values.
                        $scope.room = resVM.res.rooms[0].number;
                        $scope.guest = resVM.res.rooms[0].guest;
                        $scope.selected.reservation = {
                          number: $scope.selected.reservation.number,//number won't change
                          room: resVM.res.rooms[0].number,
                          guest: resVM.res.rooms[0].guest
                        };
                      }
                      else {  // Todo- need logic to determine if room or guest name has changed.
                        $scope.room = 0; // currently we disable the link until we can work out the logic.
                        $scope.guest = '';
                      }
                    }, function (err) {
                      console.log('Read Error: ' + err);
                      $scope.err = err;
                      $scope.errLoad = true;
                    });
                  });
                }
              },'','','danger');
            }
            else { //not checked out
              modals.update(model, dataObj, function(result) {  // Retrieve reservation after edit
                ReservationVM.getReservationVM($scope.selected.reservation.number, true).then(function (resVM) {
                  $scope.rvm = resVM;
                  $scope.hasResults=true;
                  if (resVM.oneRoom && resVM.oneBill) {    //update button link with current values.
                    $scope.room = resVM.res.rooms[0].number;
                    $scope.guest = resVM.res.rooms[0].guest;
                    $scope.selected.reservation = {
                      number: $scope.selected.reservation.number,
                      room: resVM.res.rooms[0].number,
                      guest: resVM.res.rooms[0].guest
                    };
                  }
                  else {  // Todo- need logic to determine if room or guest name has changed.
                    $scope.room = 0; // currently we disable the link until we can work out the logic.
                    $scope.guest = '';
                  }
                }, function (err) {
                  console.log('Read Error: ' + err);
                  $scope.err = err;
                  $scope.errLoad = true;
                });
              });
            }
          };


          // guest buttons click event
          $scope.changeGuest = function(guest) {
            $scope.guest = guest;
            $scope.insurance = guest == $scope.roomGuest2 ? $scope.rvm.res.insurance2 : $scope.rvm.res.insurance;
          };
          // room/guest buttons click event
          $scope.changeRoomGuest = function(room, guest) {
            $scope.room = room;
            $scope.guest = guest;
          };

          // See if we were passed a reservation link in the URL
          if ($stateParams.resNum && $stateParams.resNum > 0){
            $scope.selected.reservation = {number: Number($stateParams.resNum), room: Number($stateParams.resRoom), guest: $stateParams.resGuest};
          }
        }]);
});
