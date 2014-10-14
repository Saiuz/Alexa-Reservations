/**
 * Created by Owner on 10/13/2014.
 */
define(['./module'], function (directives) {
  'use strict';
  directives.directive('axReservation', ['ReservationVM', function (ReservationVM) {

    var linker = function (scope, element, attrs) {
      scope.rvm = ReservationVM;
      scope.res = scope.rvm.reservation;

      // other one time initialization
      // for reservation type radio button control

      scope.$watch('reservationNumber', function (newval, oldval) {
        if (newval !== undefined) {
          if (newval) {
            // retrieve reservation
            console.log("Get existing reservation");
            scope.rvm.getReservationByNumber(newval).then(function(res){
              //do needed stuff here
              scope.resTypeOptions = [];   //Trying to get the radio button group to activate  the default value the first time. Doesn't work properly
              angular.forEach(scope.rvm.resTypeList, function(item){
                scope.resTypeOptions.push({value: item, text: item});
              });

            });
          }
          else {
            // create new reservation
            console.log("Create new reservation");
            scope.rvm.newReservation().then(function(res){
              //do needed stuff here
              scope.resTypeOptions = [];
              angular.forEach(scope.rvm.resTypeList, function(item){
                scope.resTypeOptions.push({value: item, text: item});
              });

            });
          }
        }
      });

      scope.filterByResType = function(item) {
        for (var ix = 0; ix < scope.rvm.roomPlans.length; ix++) {
           return (item.resTypeFilter === scope.res.type);     //todo left off here, filter not working
        }
      }
    };

    return {
      restrict: 'E',
      link: linker,
      templateUrl: './templates/ax-reservation.html',
      scope: {
        reservationNumber: '='
      }
    }
  }]);
});