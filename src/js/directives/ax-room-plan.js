/**
 * ax-room-plan - This directive displays an event/room/resource occupancy calendar. It is set to display +- n weeks
 * each side of the week that a specified date falls into. The directive has a set of buttons that allows the user
 * to move the date by days, weeks or months. This is an interactive calendar. If a user clicks on an existing room
 * reservation, it will set the selectedReservation attribute to a link object representing the selected
 * reservation. The object has the following properties:
 *    number: reservation number or event id.
 *    room: reservation room number.
 *    guest: guest associated with the room number.
 *
 * If a user clicks on an existing calendar event, it will set the selectedEvent attribute with the id of the selected
 * event.
 * If a user clicks in a blank cell and drags across a row, the cells will be selected. When the user releases the
 * mouse the function associated with the blankClickFunction attribute will be called and passed an object with
 * the following properties:
 *    room: the room number for the row of the selected section, or 0 for a calendar event
 *    start: the starting date of the selection
 *    end: the ending date of the selection.
 *
 * The attributes of the directive are as follows:
 *    dateInWeek: the target date for the calendar. The calendar is centered around the week that contains this date.
 *    selectedReservation: receives the 'link; object associated with an existing reservation (or calendar event)
 *    blankClickFunction: a function that is called when a calendar selection is made.
 *    weekSpan: the number of weeks either side of the target week. It defaults to 2, for a total of 5 weeks.
 */
define(['./module'], function (directives) {
  'use strict';
  directives.directive('axRoomPlan', ['dashboard', '$rootScope', 'configService', 'datetime', '$timeout',
    function (dashboard, $rootScope, configService, datetime, $timeout) {

      var linker = function (scope, element, attrs) {
        var wSpan = attrs.weekSpan ? Number(attrs.weekSpan) : 2,
            rooms = [],
            resources = [],
            months = [],
            dow = [],//day of week, name
            dom = [], // day of month
            isMouseDown = false,
            selStart = 0,
            selRoom = 0,
            selEnd = 0,
            isHighlighted,
            resResults;

        scope.txt = configService.loctxt;
        scope.weekStart;
        scope.weekEnd;
        scope.dateInWeek;
        //scope.dateInWeek = new Date();

        // Need to get rooms and resources list and (calendar item eventually)
        // Need room/resource number/name and for room type and class for color coding
        dashboard.getRoomListInfo().then(function (result) {
              rooms = result;
              scope.roomCnt = result.length;
              dashboard.getResourceListInfo().then(function (result) {
                    resources = result;
                    scope.resourceCnt = result.length;
                  },
                  function (err) {
                    // todo handle error
                  });
            },
            function (err) {
              // todo-handle error
            });

        scope.$watchCollection('[dateInWeek, weekStart, weekEnd]', function (newvals, oldvals) {
          // respond to change in calendar.
          if (newvals[0] && newvals[1] && newvals[2]) {
            // get reservation info during the dates represented by the calendar display
            var paintOnly = (oldvals[1] && (newvals[1].getDate() === oldvals[1].getDate()));
            _buildCalendar(paintOnly);
          }
        });

        // Register events that this directive responds to
        angular.forEach([configService.constants.reservationChangedEvent, configService.constants.appReadyEvent], function (value) {
          scope.$on(value, function (event, result) {
            _buildCalendar();
          });
        });

        // respond to a user clicking on a reservation item
        scope.rClick = function (link) {
          scope.selectedReservation = link;
        };

        // respond to a user clicking on a calendar event item
        scope.eClick = function (id) {
          scope.selectedEvent = id;
        };

        // part of the select blanks functionality.
        $(document).mouseup(function () {
              if (isMouseDown) {
                isMouseDown = false;
                var cObj = {
                  start: datetime.dseToDate(selStart),
                  end: datetime.dseToDate(selEnd),
                  room: Number(selRoom)
                }
                if (scope.blankClickFunction) {
                  scope.blankClickFunction(cObj);
                }
                selRoom = 0;
                selStart = 0;
                selEnd = 0;
                element.find(".zp-selColor").each(function () {
                  $(this).removeClass("zp-selColor");
                });
              }
            });

        // function to populate scope variables to build calendar
        function _buildCalendar(paintOnly) {
          var startCal = datetime.dateOnly(scope.weekStart, -7 * wSpan),
              endCal = datetime.dateOnly(scope.weekEnd, 7 * wSpan),
              cols = (wSpan * 2 + 1) * 7;

          scope.colCnt = cols;
          if (paintOnly) {
            _updateCalendar(resResults, startCal, endCal, cols);
          }
          else {
            dashboard.findReservationsByDateRange(startCal, endCal).then(function (results) {
              //todo retrieve events calendar and
              results.events = [];
              resResults = results;
              _updateCalendar(results, startCal, endCal, cols);
            }, function (err) {
              //todo handle error
            });
          }
        }

        function _updateCalendar(results, startCal, endCal, cols) {
          scope.dow = _buildDowArray(startCal, endCal, cols); // calendar day and day of week
          scope.mHeader = _buildMonthHeader(startCal, endCal, cols);
          scope.cRooms = _buildRoomBody(startCal, endCal, cols, rooms, results.reservations);
          scope.cResources = _buildResourceBody(startCal, endCal, cols, resources, results.resources);
          scope.cEvents = _buildEventsBody(startCal, endCal, cols, results.events);
          // use timeout kluge to map events to the table elements after it renders.
          $timeout(function () {
            if (element) {
              element.find(".zpSel")
                  .mousedown(function () {
                    if (!selRoom) {
                      var sr = $(this).attr("cdat");
                      if (sr) {
                        isMouseDown = true;
                        selRoom = sr.split('|')[0];
                        selStart = sr.split('|')[1];
                        $(this).toggleClass("zp-selColor");
                        isHighlighted = $(this).hasClass("zp-selColor");
                      }
                    }
                    return false; // prevent text selection
                  })
                  .mouseover(function () {
                    if (isMouseDown) {
                      var sr = $(this).attr("cdat");
                      if (sr) {
                        if (sr.split('|')[0] === selRoom) {
                          selEnd = sr.split('|')[1];
                          $(this).toggleClass("zp-selColor", isHighlighted);
                        }
                      }
                    }
                  })
                  .bind("selectstart", function () {
                    return false;
                  });
              element.find(".zpRes").each(function () {
                var pw = $(this).parent().width();
                $(this).width(pw);
              });
            }
          }, 10);
        };

        function _buildMonthHeader(start, end, cols) {
          //[{span: 24, text: 'Dezember 2014', month: 11},{span: 11, text: 'Januar 2015', month: 0}]
          var curDate = start,
              startMonth = start.getMonth(),
              month = curDate.getMonth(),
              year = curDate.getFullYear(),
              daysInMonth = datetime.daysInMonthOfDate(curDate),
              endMonth = end.getMonth(),
              endDay = end.getDate(),
              spanLeft = cols,
              daysIM,
              span,
              mheader = [];

          do {
            if (month === startMonth) {
              daysIM = daysInMonth - curDate.getDate() + 1;
            }
            else if (month === endMonth) {
              daysIM = endDay;
            } else {
              daysIM = datetime.daysInMonthOfDate(curDate);
            }
            span = daysIM > spanLeft ? spanLeft : daysIM;
            spanLeft -= span;
            var m = {
              span: span,
              text: configService.calendarInfo.months[month] + ' ' + year,
              month: month
            };
            mheader.push(m);

            // now increase curDate to first of next month and update the variables above
            curDate = new Date(year, month, daysInMonth + 1); // start of next month
            daysInMonth = datetime.daysInMonthOfDate(curDate);
            month = curDate.getMonth();
            year = curDate.getFullYear();
          } while (spanLeft > 0);

          return mheader;
        }

        function _buildDowArray(start, end, cols) {
          var dnow = [],
              std = start.getDay(),
              cDSE = datetime.daysSinceEpoch(start),
              startDSE = datetime.daysSinceEpoch(scope.weekStart),
              endDSE = datetime.daysSinceEpoch(scope.weekEnd),
              dse = datetime.daysSinceEpoch(scope.dateInWeek);

          for (var i = 0; i < cols; i++) {
            var dow = {
              day: configService.calendarInfo.daysAbrv[std],
              date: datetime.dateOnly(start, i).getDate(),
              inWk: (cDSE >= startDSE && cDSE <= endDSE),
              isDay: (cDSE === dse)
            };
            dnow.push(dow);
            std = (std === 6) ? 0 : std + 1;
            cDSE++;
          }

          return dnow;
        }

        function _buildRoomBody(start, end, cols, rooms, reservations) {
          var bodyArr = [],
              sDSE = datetime.daysSinceEpoch(start),  //use date since epoch to avoid logic issues with day of year
              eDSE = datetime.daysSinceEpoch(end),    //that occur at end of the year.
              dDSE = datetime.daysSinceEpoch(scope.dateInWeek);

          // for each room in rooms..
          //  find all reservations in reservations array for the specified room
          // build the table row - try first to span empty cells to see how it looks.
          rooms.forEach(function (room) {
            var resArr = _findRes(room.number, reservations),
                bItem = {
                  room: room.number,
                  resItems: []
                };

            if (resArr.length === 0) {
              _addBlanks(cols, bItem.resItems, room.number, sDSE, dDSE);
            }
            else { // process all reservations for the room - assume they are in chronological order.
              var rix = 0,
                  ixDSE = sDSE;

              while (rix < resArr.length && ixDSE < eDSE) {
                var res = resArr[rix],
                    blanks = 0;
                if (rix === 0 && res.start_dse < ixDSE && res.end_dse >= ixDSE) { //first res starts before calendar start
                  res.nights -= (ixDSE - res.start_dse);
                  res.start_dse = ixDSE;
                  ixDSE = _addResItem(res, _backToBack(resArr, rix), bItem.resItems);
                }
                else if (rix === resArr.length - 1 && res.end_dse > eDSE) { // last res ends after calendar end
                  res.nights -= (res.end_dse - eDSE);
                  res.end_dse = eDSE;
                  ixDSE = _addResItem(res, true, bItem.resItems); //don't add checkout day to last res
                }
                else { // process res - find out how many blanks we need
                  blanks = res.start_dse - ixDSE;
                  ixDSE += _addBlanks(blanks, bItem.resItems, room.number, ixDSE, dDSE);
                  ixDSE = _addResItem(res, _backToBack(resArr, rix), bItem.resItems);

                }
                rix++;
              } //end while

              if (ixDSE < eDSE) { //Add any needed blanks at end
                _addBlanks((eDSE - ixDSE + 1), bItem.resItems, room.number, ixDSE, dDSE);
              }
            }

            bodyArr.push(bItem);
          });

          return bodyArr;
        }

        function _buildResourceBody(start, end, cols, resources, resc) {
          var bodyArr = [],
              sDSE = datetime.daysSinceEpoch(start),  //use date since epoch to avoid logic issues with day of year
              eDSE = datetime.daysSinceEpoch(end),    //that occur at end of the year.
              dDSE = datetime.daysSinceEpoch(scope.dateInWeek);

          // for each r in resources..
          //  find all reservations in reservations array for the specified room
          // build the table row - try first to span empty cells to see how it looks.
          resources.forEach(function (r) {
            var resArr = _findResc(r.name, resc),
                bItem = {
                  name: r.display_name,
                  resItems: []
                };

            if (resArr.length === 0) {
              _addBlanks(cols, bItem.resItems, 0, sDSE, dDSE);
            }
            else { // process all reservations for the resource - assume they are in chronological order.
              var rix = 0,
                  ixDSE = sDSE;

              while (rix < resArr.length && ixDSE < eDSE) {
                var res = resArr[rix],
                    blanks = 0;
                if (rix === 0 && res.start_dse < ixDSE && res.end_dse >= ixDSE) { //first res starts before calendar start
                  res.nights -= (ixDSE - res.start_dse);
                  res.start_dse = ixDSE;
                  ixDSE = _addResItem(res, _backToBack(resArr, rix), bItem.resItems);
                }
                else if (rix === resArr.length - 1 && res.end_dse > eDSE) { // last res ends after calendar end
                  res.nights -= (res.end_dse - eDSE);
                  res.end_dse = eDSE;
                  ixDSE = _addResItem(res, true, bItem.resItems); //don't add checkout day to last res
                }
                else { // process res - find out how many blanks we need
                  blanks = res.start_dse - ixDSE;
                  ixDSE += _addBlanks(blanks, bItem.resItems, 0, ixDSE, dDSE);
                  ixDSE = _addResItem(res, _backToBack(resArr, rix), bItem.resItems);

                }
                rix++;
              } //end while

              if (ixDSE < eDSE) { //Add any needed blanks at end
                _addBlanks((eDSE - ixDSE + 1), bItem.resItems, 0, ixDSE, dDSE);
              }
            }

            bodyArr.push(bItem);
          });

          return bodyArr;
        }

        // todo-incomplete
        function _buildEventsBody(start, end, cols, events) {
          var bodyArr = [],
              sDSE = datetime.daysSinceEpoch(start),  //use date since epoch to avoid logic issues with day of year
              eDSE = datetime.daysSinceEpoch(end),    //that occur at end of the year.
              dDSE = datetime.daysSinceEpoch(scope.dateInWeek);

          // need to find overlapping events and build them out into individual rows. For now we just leave blank
          var bItem = {
            name: '',
            resItems: []
          };
          _addBlanks(cols, bItem.resItems, 0, sDSE, dDSE);
          bodyArr.push(bItem);
          return bodyArr;
        }

        // Tests next reservation in list to see if it starts on the checkout day of the previous res
        function _backToBack(resArr, resIndex) {
          if (resIndex >= (resArr.length - 1)) {
            return false;
          }
          else {
            return (resArr[resIndex].end_dse === resArr[resIndex + 1].start_dse);
          }
        }

        // Adds a blank column.
        function _addBlanks(bcount, rArr, rnum, fDSE, dDSE) {
          var i;
          for (i = 0; i < bcount; i++) {
            var blank = {
              resNum: 0,
              text: '',
              span: 1,
              resCol: false,
              endCol: false,
              overLapCol: false,
              dayCol: fDSE === dDSE,
              isBlank: true,
              dse: fDSE,
              room: rnum
            };
            rArr.push(blank);
            fDSE++;
          }
          return i;
        }

        // Adds a reservation item if not overlapEnd then add a checkout day
        function _addResItem(res, overlapEnd, rArr) {
          var resItem = {
                resNum: res.reservation_number,
                text: res.resource_name ? configService.loctxt.roomAbrv + ' ' + res.room : res.title + ( !res.oneRoom ? ' - ' + res.guest : ''),
                span: res.nights,
                resCol: true,
                endCol: false,
                link: {number: res.reservation_number, room: res.room, guest: res.guest},
                overLapCol: overlapEnd,
                hoverTxt: '<b>' + res.title + ( !res.oneRoom ? ' - ' + res.guest : '') + '</b><br />Von: '
                + datetime.toDeDateString(res.start_date) +
                '<br />Bis: ' + datetime.toDeDateString(res.end_date) + (res.resource_name ? '<br /> Zi. ' + res.room : ''),
                isBlank: false
              },
              checkout = {
                resNum: 0,
                text: '',
                span: 1,
                resCol: false,
                endCol: true,
                overLapCol: false,
                isBlank: true,
                dse: res.end_dse,
                room: res.room
              },
              nextDSE = res.start_dse + res.nights;

          rArr.push(resItem);
          if (!overlapEnd) {
            rArr.push(checkout);
            nextDSE++;
          }

          return nextDSE;
        }

        // Finds all reservations in the list by room number
        function _findRes(roomNum, reservations) {
          var results = [];
          reservations.forEach(function (res) {
            if (res.room === roomNum) {
              results.push(res);
            }
          });
          return results;
        }

        //Finds all resources in list by resource name
        function _findResc(resource, resources) {
          var results = [];
          resources.forEach(function (resc) {
            if (resc.resource_name === resource) {
              results.push(resc);
            }
          });
          return results;
        }
      };

      return {
        restrict: 'E',
        link: linker,
        templateUrl: './templates/ax-room-plan.html',
        scope: {
          dateInWeek: '=',
          selectedReservation: '=',
          selectedEvent: '=',
          blankClickFunction: '=',
          weekSpan: '@' // number of weeks each side of 'active' week
        }
      };

    }]);
});
