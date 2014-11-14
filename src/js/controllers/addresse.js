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
        'ExpenseItem',
        '$modal',
        '$document',
        function ($scope, $state, $rootScope, dashboard, datetime, Reservation, ExpenseItem, $modal, $document) {
          console.log("Addresse  controller fired")
          $scope.appTitle = $rootScope.appTitle;
          $scope.appBrand = $rootScope.appBrand;
          $scope.url = $state.current.url;
          $scope.showRes = true;

          $scope.eiProperties = [];
          ExpenseItem.eachPath(function(value) {
             $scope.eiProperties.push(value);
          });

          var roomplans = [];
          var res = new Reservation();
          dashboard.getRoomPlanList().then(function(list){
            $scope.planName = list[0].name;
            var item = list[0].required_items[0];
            $scope.riProperties = [];
            angular.forEach($scope.eiProperties, function (pname) {
               var rip = {name: pname, value: item[pname]};
              $scope.riProperties.push(rip);
            });
            list[0].required_items[0].addThisToDocArray(res.expenses)
          });
          $scope.reservationNumber = undefined;
          $scope.curRes=function(){
            $scope.reservationNumber = 1400101;
            $scope.showRes = true;
          }
          $scope.newRes=function(){
            $scope.reservationNumber = 0;
            $scope.showRes = true;
          }

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

          // for modal scroll issue
          var bodyRef = angular.element( $document[0].body );

          var lastModef = '';
          $scope.testFid = 'Test Firm'
          $scope.testFirm = function(mode, size) {
            bodyRef.addClass('ovh');
            var modeParams = {};
            lastModef = mode;
            switch (mode) {
              case 'c':
                modeParams = {data: $scope.testFid, mode: 'Create'};
                break;
              case 'r':
                modeParams = {data: $scope.testFid, mode: 'Read'};
                break;
              case 'u':
                modeParams = {data: $scope.testFid, mode: 'Update'};
                break;
              case 'd':
                modeParams = {data: $scope.testFid, mode: 'Delete'};
                break
            }

            var modalInstance = $modal.open({
              templateUrl: './templates/firmFormModal.html',
              controller: 'FirmFormModalCtrl',
              size: 'lg',
              resolve: {
                modalParams: function () {
                  return modeParams;
                }
              }
            });

            modalInstance.result.then(function (result) {
              bodyRef.removeClass('ovh');
              if (lastModef === 'c') {
                $scope.testFid = result._id.id;
              }
              console.log("Firm Modal returned: " + result);
              $scope.firmTestResult = result;
            });

          };
          var lastModeg = '';
          $scope.testGid = 'Frau Suzie Longnose';
          $scope.testGuest = function(mode, size) {
            lastModeg = mode;
            var modeParams = {};
            switch (mode) {
              case 'c':
                modeParams = {data: $scope.testGid.split(' '), mode: 'Create'};
                break;
              case 'r':
                modeParams = {data: $scope.testGid, mode: 'Read'};
                break;
              case 'u':
                modeParams = {data: $scope.testGid, mode: 'Update'};
                break;
              case 'd':
                modeParams = {data: $scope.testGid, mode: 'Delete'};
                break
            }

            var modalInstance = $modal.open({
              templateUrl: './templates/guestFormModal.html',
              controller: 'GuestFormModalCtrl',
              size: size,
              resolve: {
                modalParams: function () {
                  return modeParams;
                }
              }
            });

            modalInstance.result.then(function (result) {
              console.log("Guest Modal returned: " + result);
              if (lastModeg === 'c') {
                $scope.testGid = result._id.id;
              }
              $scope.guestTestResult = result;
            });

          };
          $scope.testRid = 0;
          var lastModer = '';
          $scope.testRes = function(mode, size) {
            lastModer = mode;
            var modeParams = {};
            switch (mode) {
              case 'c':
                modeParams = {data: $scope.testRid, mode: 'Create'};
                break;
              case 'r':
                modeParams = {data: $scope.testRid, mode: 'Read'};
                break;
              case 'u':
                modeParams = {data: $scope.testRid, mode: 'Update'};
                break;
              case 'd':
                modeParams = {data: $scope.testRid, mode: 'Delete'};
                break
            }

            var modalInstance = $modal.open({
              templateUrl: './templates/reservationFormModal.html',
              controller: 'ReservationFormModalCtrl',
              size: size,
              resolve: {
                modalParams: function () {
                  return modeParams;
                }
              }
            });

            modalInstance.result.then(function (result) {
              console.log("Reservation Modal returned: " + result);
              if (lastModer === 'c') {
                $scope.testRid = result.reservation_number;
              }
              $scope.resTestResult = result;
            });

          };

        }]);
});