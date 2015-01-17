/**
 * Directive to print a specified section of a page. Used for printing bills
 * Based on the directive code found here: http://dotnet.dzone.com/articles/building-simple-angularjs
 */
/**
 * Created by bob on 1/14/15.
 */
define(['./module'], function (directives) {
  'use strict';
  directives.directive('axPrint', ['$filter', 'configService', 'convert',
    function ($filter, configService, convert) {
      var linker = function (scope, element, attrs) {
        var printSection = document.getElementById('printSection');
        if (!printSection) {
          printSection = document.createElement('div');
          printSection.id = 'printSection';
          document.body.appendChild(printSection);
        }

        element.on('click', function () {
          var printElement = attrs.printElementId;
          if (printElement) {
            var etoprint = document.getElementById(printElement)
            if (etoprint) {
              var domClone = etoprint.cloneNode(true);
              printSection.appendChild(domClone);
              window.print();
            }
            return false;
          }
        });

        window.onafterprint = function () {
          printSection.innerHTML = '';
        }
      }; //end link function

      return {
        restrict: 'A',
        link: linker,
        scope: {
          printElementId: '@'
        }
      };
    }]);
});