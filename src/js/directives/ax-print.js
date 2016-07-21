/**
 * Directive to print a specified section of a page. Used for printing bills
 * Based on the directive code found here: http://dotnet.dzone.com/articles/building-simple-angularjs
 * and http://stackoverflow.com/questions/19637312/is-there-an-angular-way-of-printing-a-div-from-a-html-page
 * Note: just appending the div to the body always printed two pages. Moved to Iframe approach, but this approach
 * did not work properly on Windows. Lines of text were missing from the printout. Also the approach completely
 * broke with v 0.11.x of NW. Resorted to a pop-up window kluge after much testing.
 */
define(['./module'], function (directives) {
  'use strict';
  directives.directive('axPrint', [function () {
      //var gui = require('nw.gui');

      var linker = function (scope, element, attrs) {

        var width = attrs.width ? Number(attrs.width) : 850;
        var height = attrs.height ? Number(attrs.height) : 600;

        element.bind('click', function(evt) {
          evt.preventDefault();
          _printElement(attrs.printElementId);
        });

        function _printElement(elem) {
          //_printWithIframe($("#" + elem).html());
          _printWithPopupWindow($("#" + elem).html());
        }

        // Kludge worked out by experiment. Requires a4printPortrait.html.
        function _printWithPopupWindow(data) {
          nw.Window.open('templates/a4printPortrait.html', {
            "width": width,
            "height": height,
            "position": 'center',
            //"new-instance": false,
            "focus": true
          }, function(pwin) {
            // Once the blank document is loaded, write the contents to print.
            pwin.on('loaded',function(){
              console.log("Print window loaded", Date.now());
              var parea = pwin.window.document.getElementById("pContent");
              parea.innerHTML = data;
            });
          });
        }

        // app.less has special media print instructions  -- BROKE in later version of nw.js
        /* function _printWithIframe(data) {

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
                  10000);  // The iFrame is removed 10 seconds after print() is executed, which is enough for me, but you can play around with the value
            });
          }
        } */

      }; //end link function

      return {
        restrict: 'A',
        link: linker,
        scope: {
          printElementId: '@',
          width: '@',
          height: '@'
        }
      };
    }]);
});