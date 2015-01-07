/**
 * Created by Owner on 05.08.2014.
 *
 * Controller for charges  todo - make viewmodel or extend ReservationVM for any business logic
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
        function ($scope, $state, $rootScope, $stateParams, ReservationVM, dashboard, configService) {
          $scope.appTitle = $rootScope.appTitle;
          $scope.appBrand = $rootScope.appBrand;
          $scope.url = $state.current.url;
          $scope.pageHeading = configService.loctxt.charges;

          $scope.txt = configService.loctxt;
          $scope.showCharges = false;
          $scope.showHiddenExpenses = false;
          $scope.planText = '***';
          $scope.resCount = 0;
          $scope.pTitle = configService.loctxt.selectReservation;

          // for reservation-list directive
          $scope.selectedReservation;

          dashboard.getItemTypeListExcept('').then(function(items){
            $scope.itemTypes = items;
          });

          $scope.$watch('selectedReservation', function (newval) {
            if (!newval || !newval.number) return; //We expect an object with (res) number, room and guest properties
            // Get reservation and prepare the room plan text and handle the special case
            // where we have a group reservation with one bill- need to show the rooms
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
                $scope.roomGuest2 = rmObj.roomGuest2;
                $scope.gRooms = rmObj.groupRooms;
                $scope.planText = rmObj.displayText;
                //$scope.selectedReservation = newval;
              }
            });
          });

          // guest buttons click event
          $scope.changeGuest = function(guest) {
            $scope.guest = guest;
          };
          // room/guest buttons click event
          $scope.changeRoomGuest = function(room, guest) {
            $scope.room = room;
            $scope.guest = guest;
          };

          // See if we were passed a reservation link in the URL
          if ($stateParams.resNum && $stateParams.resNum > 0){
            $scope.selectedReservation = {number: Number($stateParams.resNum), room: Number($stateParams.resRoom), guest: $stateParams.resGuest};
          }
        }]);
});
