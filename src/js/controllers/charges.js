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
          console.log("Charges  controller fired") ;
          $scope.appTitle = $rootScope.appTitle;
          $scope.appBrand = $rootScope.appBrand;
          $scope.url = $state.current.url;
          $scope.pageHeading = "Gebühren";

          $scope.txt = configService.loctxt;
          $scope.showCharges = false;
          $scope.showHiddenExpenses = false;
          $scope.planText = '***';

          // for reservation-list directive
          $scope.selectedReservation = 0;
          $scope.listDate = new Date();

          dashboard.getItemTypeListExcept('').then(function(items){
            $scope.itemTypes = items;
          });

          $scope.$watch('selectedReservation', function (newval) {
            if (!newval.number) return; //We expect an object with (res) number, room and guest properties
            // Get reservation and prepare the room plan text and handle the special case
            // where we have a group reservation with one bill- need to show the rooms
            ReservationVM.getReservationVM(newval.number, true).then(function (resVM) {
              if(resVM.res) {
                $scope.rvm = resVM;
                //$scope.res = resVM.res;
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

          // Todo- this is broke, if we still want to navigate here we will need the reslink info not just the number.
          if ($stateParams.resNum && $stateParams.resNum > 0){
             ReservationVM.getReservationVM($stateParams.resNum, true).then(function (resVM){
               if(resVM.res) {
                 $scope.rvm = resVM;
                 //$scope.res = resVM.res;
                 $scope.showCharges = true;
               }
             });
          }
        }]);
});
