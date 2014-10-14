/**
 * Created by Owner on 05.08.2014.
 *
 * Controller for address (Guest information) page
 */
define(['./module'], function (controllers) {
  'use strict';

  controllers.controller('AddresseCtrl',
      ['$scope',
        '$state',
        '$rootScope',
        'dashboard',
        'datetime',
        'Reservation',
        function ($scope, $state, $rootScope, dashboard, datetime, Reservation) {
          console.log("Addresse  controller fired")
          $scope.appTitle = $rootScope.appTitle;
          $scope.appBrand = $rootScope.appBrand;
          $scope.url = $state.current.url;

          $scope.reservationNumber = 0;


          //Testing stuff
          // Testing the basics for a multiple room selection directive. I originally incorporated the controls
          // in an angular-ui accordion control and ran into all of the issues documented below involving the select
          // ng-model value not updating properly. Once I removed the accordion everything worked fine.
          //var currentRoom = {}; //needed this because of issue with roomSelect not working properly
          //$scope.roomTitle="Select Rooms";
          //$scope.rooms = [];
          var start = datetime.dateOnly(new Date("10/10/2014"));
          var end = datetime.dateOnly(start, 3);
          var res = new Reservation();
          res.rooms.push({ //same as ReservedRoom schema
            number: 2,
            room_type: 'Einzelzimmer',
            room_class: 'Economy',
            guest: 'Smith',
            price: 44
          });
          res.resources.push({
             name: 'Parkplatz 3',
             resource_type: 'Parkplatz',
             price: 3
          });

          $scope.rooms = res.rooms;
          $scope.resources = res.resources;
          $scope.roomTitle = res.rooms.length ? res.rooms.length + ' rooms selected' : "Select room";
          $scope.roomCount = res.rooms.length;
          $scope.name = '';
          dashboard.findAvailableRooms(start,end,true, true).then(function(rooms){
            $scope.roomList = rooms;
            $scope.price= 666;
            $scope.name = 'John Smith'
          });
          dashboard.findAvailableResources(start,end,'Parkplatz', true).then(function(res){
             $scope.resourceList = res;
          });
          $scope.changeDates = function(){
             start = datetime.dateOnly(new Date("12/10/2014"));
             end = datetime.dateOnly(start, 3);
            dashboard.findAvailableRooms(start,end,true, true).then(function(rooms){
              $scope.roomList = rooms;
              $scope.price= 999;
              $scope.name = 'Jane Smith'
            });
            dashboard.findAvailableResources(start,end,'Parkplatz', true).then(function(res){
              $scope.resourceList = res;
            });
          } ;

          $scope.$watch('roomCount', function(newval){
            if (newval !== undefined) {
              $scope.roomTitle =  $scope.rooms.length ? $scope.rooms.length + ' rooms selected' : "Select room"
            }
          })

          $scope.isCollapsed1 = true;
/*
*//*        //watch did not work on roomSelect or roomSelect.name except for first time.
          $scope.$watch('roomSelect', function(newval, oldval){
            if (newval === oldval) return;
            $scope.roomTitle = "Room " + $scope.roomSelect.name + "selected.";
            $scope.price = $scope.roomSelect.price;
          }, true);*//*

          //note this method seems to be firing before roomSelect scope variable is updated!!!!! Known issue.
          //to get around it I passed the roomSelect variable into the function. It seems to be updated on the page
          // but not yet in the controller scope.
          $scope.onRoomSelect = function (newval) {
            currentRoom = newval
            $scope.roomTitle = "Room " + newval.number + " selected. ("  + newval.room_type + ")";
            $scope.price = newval.price;
          }

          $scope.filterAlreadyAdded = function(item) {
            for (var ix = 0; ix < $scope.rooms.length; ix++) {
              if ($scope.rooms[ix].room === item.number) {
                return false;
              }
            }
            return true;
          };
          $scope.addRoom = function() {
            $scope.roomSelect = $scope.roomList[0];
            $scope.price = 0;

            var room = {
              room: currentRoom.number,
              display_name: currentRoom.room_type,
              guest: $scope.name,
              price: currentRoom.price
            };

            $scope.rooms.push(room);
          };

          $scope.removeRoom = function(roomnum){
            for (var ix = 0; ix < $scope.rooms.length; ix++) {
              if ($scope.rooms[ix].room === roomnum) {
                $scope.rooms.splice(ix, 1);
                break;
              }
            }
          };*/
        }]);
});