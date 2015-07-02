define(['./module'], function (controllers) {
  'use strict';

  controllers.controller('HomeCtrl',
      ['$scope',
        '$state',
        '$rootScope',
        '$stateParams',
        'datetime',
        'modals',
        'configService',
        '$timeout',
        '$filter',
        function ($scope, $state, $rootScope, $stateParams, datetime, modals, configService, $timeout, $filter) {
          var init = true;

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
                (oldvals[0] !== newvals[0]) ? 0 : -1,
                isToday = false,
                isTomorrow = false;

            switch (varIndex) {
              case 0:
                if (!init) {
                  configService.set('planDate', datetime.dateOnly($scope.theDate));
                }
                else {
                  init = false;
                }

                $scope.theNextDate = datetime.dateOnly($scope.theDate, 1);
                isToday = datetime.daysSinceEpoch($scope.theDate) === datetime.daysSinceEpoch(datetime.dateOnly(new Date()));
                isTomorrow = datetime.daysSinceEpoch($scope.theDate) === datetime.daysSinceEpoch(datetime.dateOnly(new Date(), 1));
                $scope.theDateDisplay = isToday ? configService.loctxt.today : isTomorrow ? configService.loctxt.tomorrow : $filter('date')($scope.theDate, 'shortDate');
                $scope.theNextDateDisplay = isToday ? configService.loctxt.tomorrow : isTomorrow ? configService.loctxt.tomorrowNext : $filter('date')($scope.theNextDate, 'shortDate');
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
              if (cObj.room < 2) {
                dataObj.extraData.room = undefined;
              }
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

          // See if we were passed a reservation link in the URL
          if ($stateParams.resNum && $stateParams.resNum > 0){
            $timeout(function () { // use timeout to make sure this happens at the end of the digest cycle
              $scope.selected.reservation = {number: Number($stateParams.resNum), room: Number($stateParams.resRoom), guest: $stateParams.resGuest};
            },10);
          }

        }]);
});
