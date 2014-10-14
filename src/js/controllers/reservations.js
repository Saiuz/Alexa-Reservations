/**
 * Created by Owner on 05.08.2014.
 * Reservations page controller
 * todo-there is too much business logic in the controller, needs to be factored out into a more extensive model (in progress)
 */
define(['./module'], function (controllers) {
  'use strict';

  controllers.controller('ReservationsCtrl',
      ['$scope',
        '$state',
        '$rootScope',
        'ReservationVM_old',
        'Reservation',
        'dashboard',
        'datetime',
        function ($scope, $state, $rootScope, ReservationVM, reservation, dashboard, datetime) {
          console.log("Reservation controller fired");
          $scope.appTitle = $rootScope.appTitle;
          $scope.appBrand = $rootScope.appBrand;
          $scope.url = $state.current.url;
          $scope.pageHeading = "Reservierung";

          $scope.rvm = ReservationVM; // reference to the ViewModel and configure
          ReservationVM.roomListEmptyText = '*** keine Zimmer frei ***';
          ReservationVM.roomListFirstText = '<Zimmer auswählen>';
          ReservationVM.roomPlanFirstText = '<Zimmer Plan auswählen>';
          ReservationVM.resourceListFirstText = '-- keinen --';
          ReservationVM.resourceListEmptyText= '** besetzt **';

          $scope.ignoreWatch = true;

          // Create a new reservation (db) object and initialize some properties
          ReservationVM.newReservation().then(function () {
            $scope.res = ReservationVM.reservation;
            ReservationVM.selectedPlan = ReservationVM.roomPlans[0];
            $scope.ignoreWatch = false;
          });


          //Guest lookup
          $scope.guest;
          $scope.getGuests = function(val) {    //todo-move to guests VM or reservationvm
           return dashboard.guestNameLookup(val, $scope.firm).then(function(res){
             console.log(val + " returns: " + res.length);
             var names = [];
             if (res.length > 0) {
               angular.forEach(res,function(item){
                 names.push({dname: item.unique_name, name: item.name, id: item._id});
               });
             }
             return names;
           });
          };
          $scope.newGuest = function (){
            //todo--bring up new guest form. (part of guest VM? or directive
          }
          $scope.getFirms = function(val) {  //todo-move to firm VM
            return dashboard.firmNameLookup(val).then(function(frm){
              console.log(val + " returns: " + frm.length);
              var names = [];
              if (frm.length > 0) {
                angular.forEach(frm,function(item){
                  names.push({name: item.firm_name, price: item.room_price});
                });
              }
              return names;
            });
          }
          $scope.newFirm = function (){
            //todo--bring up new firm form. (part of firm VM? or directive
          }
          // for date pickers
          $scope.openStart = function($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.openedStart = true;
            //$scope.openEnd = false;
          };
          $scope.openEnd = function($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.openedEnd = true;
            //$scope.openStart=false;
          };
          $scope.dateOptions = {
            formatYear: 'yy',
            startingDay: 1,
            showWeeks: false,
            currentText: 'Heute',
            closeText: 'OK'
          };
          $scope.dateFormat="dd.MM.yyyy";

          //for occupants radio button group
          //$scope.occupants = 1;
          $scope.occupantOptions = [{value: 1, text: '1'}, {value: 2, text: '2+'} ];

          // for reservation type radio button control
          $scope.resTypeOptions = [];
          angular.forEach($scope.rvm.resTypeList, function(item){
            $scope.resTypeOptions.push({value: item, text: item});
          });
          // Watch for date and occupant changes to update free rooms
          var ignoreIndex = -1;
          $scope.$watchCollection('[res.start_date, res.end_date, rvm.nights, res.occupants, res.type]', function(newvars, oldvars){
            if ($scope.ignoreWatch) return;

            var varIndex = (oldvars[4] !== newvars[4]) ? 4 :(oldvars[3] !== newvars[3]) ? 3 : (oldvars[2] !== newvars[2]) ? 2 : (oldvars[1] !== newvars[1]) ? 1 : (oldvars[0] !== newvars[0]) ? 0 : -1;
            console.log("watch index: " + varIndex);
            if (varIndex === -1 || varIndex === ignoreIndex){
              ignoreIndex = -1;
              return;
            }
            switch (varIndex) {
              case 0:
                console.log("start_date changed");
                ignoreIndex = 1; //end_date
                ReservationVM.startDateChanged();
                break;

              case 1:
                console.log("end_date changed");
                ignoreIndex = 2; //nights
                ReservationVM.endDateChanged();
                break;

              case 2:
                console.log("nights changed ");
                ignoreIndex = 1; //end_date
                ReservationVM.nightsChanged();
                break;

              case 3:
                console.log("occupants changed");
                ignoreIndex = -1; // no watched variables changed
                ReservationVM.occupantsChanged();
                break;

              case 4:
                console.log("res. type changed");
                ignoreIndex = -1; // no watched variables changed
                ReservationVM.resTypeChanged();
                break;
            }
          });

        ReservationVM.getAvailableRooms();

        }]);
});