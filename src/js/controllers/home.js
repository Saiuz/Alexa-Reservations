define(['./module'], function (controllers) {
  'use strict';

  controllers.controller('HomeCtrl',
      ['$scope',
        '$state',
        '$rootScope',
        'datetime',
        'modals',
        'configService',
        '$timeout',
        function ($scope, $state, $rootScope, datetime, modals, configService, $timeout) {

          // Required for nav and page header
          $scope.appTitle = $rootScope.appTitle;
          $scope.appBrand = $rootScope.appBrand;
          $scope.url = $state.current.url;
          $scope.pageHeading = "Zimmer Plan "; // + $scope.theDate.getDate() + '.' + ($scope.theDate.getMonth() + 1) + '.' + $scope.theDate.getFullYear()

          // get the saved last date of the calendar but delay it till the end of the digest cycle so that
          // the calendar gets time to 'settle down'
          $timeout(function () {
            configService.get('planDate', datetime.dateOnly(new Date(Date.now()))).then(function (val) {
              val = new Date(Date.parse(val)); //seems to save date as its string value
              $scope.theDate = val;
              console.log("HOME CTRL INIT" + ' ' + val);
              $rootScope.$broadcast(configService.constants.weekButtonsSetEvent, val);
            });
          }, 200);


          $scope.selected = {
            reservation: undefined,
            anCnt: 0,
            ab1Cnt: 0,
            ab2Cnt: 0
          };
          $scope.selectedEvent = undefined;

          // monitor two scope properties. They do not interact with one another and we expect only
          // one to change at any given time.
          $scope.$watchCollection('[theDate, selectedEvent]', function (newvals, oldvals) {
            var varIndex = (oldvals[1] !== newvals[1]) ? 1 :
                (oldvals[0] !== newvals[0]) ? 0 : -1;

            switch (varIndex) {
              case 0:
                configService.set('planDate', datetime.dateOnly($scope.theDate));
                $scope.theNextDate = datetime.dateOnly($scope.theDate, 1);
                break;
              case 1:
                var dataObj = { data: newvals[1].number, extraData: undefined },
                    model = modals.getModelEnum().event;
                modals.update(model, dataObj);
                break;
            }
          });

          // launch new reservation or new calendar event form
          $scope.newResOrCal = function (cObj) {
            var dataObj = {
                  data: undefined,
                  extraData: {
                    start: cObj.start,
                    end: cObj.end,
                    room: cObj.room
                  }
                },
                model;
            console.log('HOME room: ' + cObj.room + ' start: ' + cObj.start + ' end: ' + cObj.end);
            if (cObj.room) {
              model = modals.getModelEnum().reservation;
              modals.create(model, dataObj); //nothing to do after create
            }
            else {
              model =  modals.getModelEnum().event;
              modals.create(model, dataObj);
            }
          };

          // removes the selected marker on the reservation lists
          $scope.clearSelected = function() {
            if ($scope.selected.reservation) {
              $scope.selected.reservation.number = 0;
            }
          }
        }]);
});
