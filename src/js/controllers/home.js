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
          $scope.selectedEvent; //todo-watch this and launch editor for cal item.

          // monitor to scope properties. They do not interact with one another and we expect only
          // one to change at any given time.
          $scope.$watchCollection('[theDate, selectedEvent]', function (newvals, oldvals) {
            var varIndex = (oldvals[1] !== newvals[1]) ? 1 :
                (oldvals[0] !== newvals[0]) ? 0 : -1;

            switch (varIndex) {
              case 0:
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


          $scope.clearSelected = function() {
            if ($scope.selected.reservation) {
              $scope.selected.reservation.number = 0;
            }
          }
        }]);
});
