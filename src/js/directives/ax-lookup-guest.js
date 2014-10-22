/**
 * This directive provides a guest lookup input field with a pop-up form that gives the ability to add a new guest
 * to the guest collection.
 */
define(['./module'], function (directives) {
  'use strict';
  directives.directive('axLookupGuest', ['dashboard', 'Guest', function (dashboard, Guest) {

    var linker = function (scope, element, attrs) {

    };

    return {
      restrict: 'E',
      link: linker,
      templateUrl: './templates/ax-lookup-guest.html',
      scope: {
        guest: '=', // the value of the input field (guest)
        firm: '=', // if provided, will be used to limit the guest lookup to guests that are associated with the specific firm.
        displayOnly: '='
      }
    };
  }]);
});