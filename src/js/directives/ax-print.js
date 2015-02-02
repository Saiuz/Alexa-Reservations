/**
 * Directive to print a specified section of a page. Used for printing bills
 * Based on the directive code found here: http://dotnet.dzone.com/articles/building-simple-angularjs
 * and http://stackoverflow.com/questions/19637312/is-there-an-angular-way-of-printing-a-div-from-a-html-page
 * Note: just appending the div to the body always printed two pages. Moved to Iframe approach.
 */
/**
 * Created by bob on 1/14/15.
 */
define(['./module'], function (directives) {
  'use strict';
  directives.directive('axPrint', ['convert',
    function (convert) {
      var linker = function (scope, element, attrs) {

        element.bind('click', function(evt) {
          evt.preventDefault();
          _printElement(attrs.printElementId);
        });

        function _printElement(elem) {
          _printWithIframe($("#" + elem).html());
        }

        // app.less has special media print instructions
        function _printWithIframe(data) {

          if ($('iframe#printf').size() === 0) {
            $('body').append('<iframe id="printf" name="printf"></iframe>');  // an iFrame is added to the html content, then your div's contents are added to it and the iFrame's content is printed
            var frames = window.frames || window.document.frames;
            var mywindow = frames["printf"].window; //= window.frames["printf"];
            var htm = '<html><head><title></title>'  // Your styles here, I needed the margins set up like this
            + '<link rel="stylesheet" type="text/css" href="css/app.css">'
            + '</head><body><div class="print-div">'
            + data
            + '</div></body></html>';
            mywindow.document.write(htm);
            //mywindow.print();
            $(mywindow.document).ready(function () {
              mywindow.print();
              console.log("axPrint - print function executed");
              setTimeout(function () {
                    $('iframe#printf').remove();
                  },
                  2000);  // The iFrame is removed 2 seconds after print() is executed, which is enough for me, but you can play around with the value
            });
          }
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