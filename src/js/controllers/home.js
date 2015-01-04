define(['./module'], function (controllers) {
  'use strict';

  controllers.controller('HomeCtrl',
      ['$scope',
        '$state',
        '$rootScope',
        'datetime',
        'modals',
        function ($scope, $state, $rootScope, datetime, modals) {

          // Required for nav and page header
          $scope.appTitle = $rootScope.appTitle;
          $scope.appBrand = $rootScope.appBrand;
          $scope.url = $state.current.url;
          $scope.pageHeading = "Zimmer Plan " // + $scope.theDate.getDate() + '.' + ($scope.theDate.getMonth() + 1) + '.' + $scope.theDate.getFullYear()

          $scope.theDate = datetime.dateOnly(new Date(Date.now()));
          $scope.selected = {
            reservation: undefined,
            anCnt: 0,
            ab1Cnt: 0,
            ab2Cnt: 0
          };

          $scope.$watch('theDate', function (newval) {
            $scope.theNextDate = datetime.dateOnly($scope.theDate, 1);
          });

          // launch new reservation or new calendar event form
          $scope.newResOrCal = function (cObj) {
            console.log('HOME room: ' + cObj.room + ' start: ' + cObj.start + ' end: ' + cObj.end);
            if (cObj.room) {
              var dataObj = {
                    data: undefined,
                    extraData: {
                      start: cObj.start,
                      end: cObj.end,
                      room: cObj.room
                    }
                  },
                  model = modals.getModelEnum().reservation;

              modals.create(model, dataObj, function () {
                //nothing needed yet
              });
            }
            else {
              //calendar, nothing yet
            }
          };


          $scope.clearSelected = function() {
            if ($scope.selected.reservation) {
              $scope.selected.reservation.number = 0;
            }
          }
        }]);
});
