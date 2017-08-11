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
  directives.directive('axRoomPlan', ['dashboard', '$rootScope', 'configService', 'datetime', '$timeout', '$filter',
    function (dashboard, $rootScope, configService, datetime, $timeout, $filter) {

      var linker = function (scope, element, attrs) {
        var wSpan, // = attrs.weekSpan ? Number(attrs.weekSpan) : 2,
            sundayStart = attrs.startSunday === 'true',
            startDate = attrs.startDate ? Date.parse(attrs.startDate) : new Date(),
            rooms = [],
            resources = [],
            isMouseDown = false,
            selStart = 0,
            selRoom = -1, //needs to be < 0 since calendar items have a room of 0
            selEnd = 0,
            isHighlighted,
            resResults;

        scope.txt = configService.loctxt;

        //scope.weekStart;
        //scope.weekEnd;
        //scope.dateInWeek;
        scope.hasErr = false;
        scope.errMsg = '';
        scope.roomFilter = 0;

        //scope.dateInWeek = new Date();

        // Need to get rooms and resources list
        // Need room/resource number/name and for room type and class for color coding
        dashboard.getRoomListInfo().then(function (rmResults) {
              dashboard.getResourceListInfo().then(function (resResults) {
                    resources = resResults;
                    scope.resourceCnt = resResults.length;
                    rooms = rmResults;
                    scope.roomCnt = rmResults.length;
                    scope.theDate = startDate;
                    scope.dateInWeek = startDate;

                  },
                  function (err) {
                    scope.hasErr = true;
                    scope.errMsg = err;
                  });
            },
            function (err) {
              scope.hasErr = true;
              scope.errMsg = err;
            });

        // Register events that this directive responds to. The first three events don't change the date
        angular.forEach([configService.constants.reservationChangedEvent, configService.constants.appReadyEvent,
          configService.constants.calEventChangedEvent], function (value) {
          scope.$on(value, function (event, result) {
            _buildCalendar();
          });
        });
        //This event responds to external code wanting to set the current date of the calendar
        scope.$on(configService.constants.weekButtonsSetEvent, function (event, dateval) {
           if (datetime.isDate(dateval)) {
             console.log('WeekButtonsSetEvent: ' + dateval);
             startDate = dateval;
             scope.theDate = dateval;
           }
        });

        // respond to the appReady event, repaint calendar if we have a date
        scope.$on(configService.constants.appReadyEvent, function (event) {
            if (datetime.isDate(scope.theDate)) {
              console.log('ax-room-plan responding to app ready event');
              _buildCalendar(false);
            }
        });

        scope.$watchCollection('[theDate,weekSpan]', function (newvals, oldvals) {
          // respond to change in calendar.
          console.log('*** ax-room-plan watch fired ' + newvals + '|' + oldvals );
          if (newvals[1]) {
            wSpan = newvals[1];
          }
          else {
            wSpan = 1; //default if null or not specified
          }
          
          if (newvals[0]) { //date selector directive value changed.
            scope.dates = datetime.findWeek(newvals[0], sundayStart);
            scope.dateInWeek = newvals[0];
            _buildCalendar(false);
          }
        });

        // respond to a user clicking the "New Reservation" button
        scope.newRes = function() {
          var cObj = {
            start: datetime.dateOnly(new Date()),
            end: datetime.dateOnly(new Date(), 1),
            room: -1
          };
          if (scope.blankClickFunction) {
            scope.blankClickFunction(cObj);
          }
        };

        //Filter for room list to view either single rooms or doubles / suite rooms
        scope.roomTypeFilter = function (item) {
          if (scope.roomFilter != 1 && scope.roomFilter != 2) {
            return true;
          }
          else {
            return item.rOccupants === scope.roomFilter;
          }
        };

        // respond to a user clicking on a reservation item
        scope.rClick = function (link, start) {
          //scope.theDate = datetime.dseToDate(start);
          scope.selectedReservation = link;
        };

        // respond to a user clicking on a calendar event item
        scope.eClick = function (elink) {
          if (scope.eventClickFunction) {
            scope.eventClickFunction(elink);
          }
        };

        // part of the select blanks functionality.
        $(document).mouseup(function () {
          if (isMouseDown) {
            isMouseDown = false;
            if (selEnd === 0) { //happens if only one cell is clicked, we need at least one night for a reservation.
              selEnd = selStart + 1;
            }
            var cObj = {
              start: datetime.dseToDate(selStart),
              end: datetime.dseToDate(selEnd),
              room: Number(selRoom)
            };

            if (scope.blankClickFunction) {
              scope.blankClickFunction(cObj);
            }
            selRoom = -1;
            selStart = 0;
            selEnd = 0;
            element.find(".zp-selColor").each(function () {
              $(this).removeClass("zp-selColor");
            });
          }
        });

        // function to retrieve items to build calendar, calls _updateCalendar which does the heavy lifting
        function _buildCalendar(paintOnly) {
          var startCal, endCal, cols;
          scope.isLoading = true;
          if (scope.dates) {
            startCal = datetime.dateOnly(scope.dates.weekStart, -7 * wSpan);
            endCal = datetime.dateOnly(scope.dates.weekEnd, 7 * wSpan);
            cols = (wSpan * 2 + 1) * 7;
            scope.colCnt = cols;
            if (paintOnly) { //there is a subtle bug with paint only. Since build calendar can change the reservation objects close to the end, currently set paintOnly to false.
              _updateCalendar(resResults, startCal, endCal, cols);
            }
            else {
              dashboard.findReservationsByDateRange(startCal, endCal).then(function (results) {
                dashboard.findEventsByDateRange(startCal, endCal).then(function (events) {
                  if (results) {
                    results.events = events;
                    resResults = results; //cache last query.
                    _updateCalendar(resResults, startCal, endCal, cols);
                    scope.isLoading = false
                  }
                }, function (err) {
                  scope.hasErr = true;
                  scope.errMsg = err;
                });
              });
            }
          }
        }

        // populates the scope variables with objects to build the calendar display
        function _updateCalendar(results, startCal, endCal, cols) {
          scope.calObj = {
            dow: _buildDowArray(startCal, cols), // calendar day and day of week
            mHeader: _buildMonthHeader(startCal, endCal, cols),
            cRooms: _buildRoomBody(startCal, endCal, cols, rooms, results.reservations),
            cResources: _buildResourceBody(startCal, endCal, cols, resources, results.resources),
            cEvents: _buildEventsBody(startCal, endCal, cols, results.events)
          };

          // use timeout kluge to map events to the table elements after it renders.
          $timeout(function () {
            if (element) {
              var zpsel = $(element).find(".zpSel"); //broke out find, was getting occasional error on mousedown that "undefined is not a function"
                  $(zpsel).mousedown(function () {
                    if (selRoom < 0) {
                      var sr = $(this).attr("cdat");
                      if (sr) {
                        isMouseDown = true;
                        selRoom = sr.split('|')[0];
                        selStart = Number(sr.split('|')[1]);
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
                          selEnd = Number(sr.split('|')[1]);
                          $(this).toggleClass("zp-selColor", isHighlighted);
                        }
                      }
                    }
                  })
                  .bind("selectstart", function () {
                    return false;
                  });

               var xpres = element.find(".zpRes"); //ditto with this find
               $(xpres).each(function () {
                var pw = $(this).parent().width();
                $(this).width(pw);
              });
            }
          }, 700);
        }

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

        function _buildDowArray(start, cols) {
          var dnow = [],
              std = start.getDay(),
              cDSE = datetime.daysSinceEpoch(start),
              startDSE = datetime.daysSinceEpoch(scope.dates.weekStart),
              endDSE = datetime.daysSinceEpoch(scope.dates.weekEnd),
              dse = datetime.daysSinceEpoch(scope.dates.currentDate),
              wknd = sundayStart ? 5 : 0;

          for (var i = 0; i < cols; i++) {
            var dow = {
              day: configService.calendarInfo.daysAbrv[std],
              date: datetime.dateOnly(start, i).getDate(),
              inWk: (cDSE >= startDSE && cDSE <= endDSE),
              isDay: (cDSE === dse),
              isWknd: (std === wknd),
              t: std,
              dse: cDSE
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
              dDSE = datetime.daysSinceEpoch(scope.dates.currentDate);

          // for each room in rooms..
          //  find all reservations in reservations array for the specified room
          // build the table row - try first to span empty cells to see how it looks.
          rooms.forEach(function (room) {
            var resArr = _findRes(room.number, reservations),
                bItem = {
                  room: room.number,
                  rclass: 'zp-' + room.display_abbr,
                  rOccupants: room.max_occupants,
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
                  ixDSE = _addResItem(res, _backToBack(resArr, rix), bItem.resItems, eDSE);
                }
                else if (rix === resArr.length - 1 && res.end_dse > eDSE) { // last res ends after calendar end
                  res.nights -= (res.end_dse - eDSE-1);
                  res.end_dse = eDSE;
                  blanks = res.start_dse - ixDSE;
                  ixDSE += _addBlanks(blanks, bItem.resItems, room.number, ixDSE, dDSE);
                  ixDSE = _addResItem(res, true, bItem.resItems, eDSE); //don't add checkout day to last res
                }
                else if (rix === resArr.length - 1 && res.end_dse < eDSE) { // last res ends before calendar end add then backfill with blanks
                  blanks = res.start_dse - ixDSE;
                  ixDSE += _addBlanks(blanks, bItem.resItems, room.number, ixDSE, dDSE);
                  ixDSE = _addResItem(res, _backToBack(resArr, rix), bItem.resItems, eDSE);
                  blanks = eDSE - res.end_dse;
                  ixDSE += _addBlanks(blanks, bItem.resItems, room.number, ixDSE, dDSE);
                }
                else { // process res - find out how many blanks we need
                  blanks = res.start_dse - ixDSE;
                  ixDSE += _addBlanks(blanks, bItem.resItems, room.number, ixDSE, dDSE);
                  ixDSE = _addResItem(res, _backToBack(resArr, rix), bItem.resItems, eDSE);

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
              dDSE = datetime.daysSinceEpoch(scope.dates.currentDate);

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
                  ixDSE = _addResItem(res, _backToBack(resArr, rix), bItem.resItems, eDSE);
                }
                else if (rix === resArr.length - 1 && res.end_dse > eDSE) { // last res ends after calendar end
                  res.nights -= (res.end_dse - eDSE - 1);
                  res.end_dse = eDSE;
                  blanks = res.start_dse - ixDSE;
                  ixDSE += _addBlanks(blanks, bItem.resItems, 0, ixDSE, dDSE);
                  ixDSE = _addResItem(res, true, bItem.resItems, eDSE); //don't add checkout day to last res
                }
                else if (rix === resArr.length - 1 && res.end_dse < eDSE) { // last res ends before calendar end, add then backfill with blanks
                  blanks = res.start_dse - ixDSE;
                  ixDSE += _addBlanks(blanks, bItem.resItems, 0, ixDSE, dDSE);
                  ixDSE = _addResItem(res, _backToBack(resArr, rix), bItem.resItems, eDSE);
                  blanks = eDSE - res.end_dse;
                  ixDSE += _addBlanks(blanks, bItem.resItems, 0, ixDSE, dDSE);
                }
                else { // process res - find out how many blanks we need
                  blanks = res.start_dse - ixDSE;
                  ixDSE += _addBlanks(blanks, bItem.resItems, 0, ixDSE, dDSE);
                  ixDSE = _addResItem(res, _backToBack(resArr, rix), bItem.resItems, eDSE);

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

        function _buildEventsBody(start, end, cols, events) {
          var bodyArr = [],
              sDSE = datetime.daysSinceEpoch(start),  //use date since epoch to avoid logic issues with day of year
              eDSE = datetime.daysSinceEpoch(end),    //that occur at end of the year.
              dDSE = datetime.daysSinceEpoch(scope.dates.currentDate),
              bins = [],
              binEnd = [];

          // bin the events to avoid any overlap, each bin gets a calendar row
          events.forEach(function (event) {
            _addToBin(0, bins, binEnd, event);
          });
          if (bins.length === 0) { //no events create at least one empty row
            bins.push([]);
          }
          // Now process bins
          bins.forEach(function (bin) {
            var bItem = {
              name: '',
              evtItems: []
            };

            if (bin.length === 0) {
              _addBlanks(cols, bItem.evtItems, 0, sDSE, dDSE);
            }
            else { // process all events in bin.
              var rix = 0,
                  ixDSE = sDSE;

              while (rix < bin.length && ixDSE < eDSE) {
                var evt = bin[rix],
                    blanks = 0;
                if (rix === 0 && evt.start_dse < ixDSE && evt.end_dse >= ixDSE) { //first event starts before calendar start
                  evt.start_dse = ixDSE;
                  ixDSE = _addEventItem(evt, _backToBack(bin, rix), bItem.evtItems);
                }
                else if (rix === bin.length - 1 && evt.end_dse > eDSE) { // last event ends after calendar end
                  evt.nights -= (evt.end_dse - eDSE);
                  evt.end_dse = eDSE;
                  blanks = evt.start_dse - ixDSE;
                  ixDSE += _addBlanks(blanks, bItem.evtItems, 0, ixDSE, dDSE);
                  ixDSE = _addEventItem(evt, false, bItem.evtItems);
                }
                else if (rix === bin.length - 1 && evt.end_dse < eDSE) { // last event ends before calendar end, add it then backfill with blanks
                  blanks = evt.start_dse - ixDSE;
                  ixDSE += _addBlanks(blanks, bItem.evtItems, 0, ixDSE, dDSE);
                  ixDSE = _addEventItem(evt, _backToBack(bin, rix), bItem.evtItems);
                  blanks = eDSE - evt.end_dse;
                  ixDSE += _addBlanks(blanks, bItem.evtItems, 0, ixDSE, dDSE);
                }
                else { // process evt - find out how many blanks we need
                  blanks = evt.start_dse - ixDSE;
                  ixDSE += _addBlanks(blanks, bItem.evtItems, 0, ixDSE, dDSE);
                  ixDSE = _addEventItem(evt, _backToBack(bin, rix), bItem.evtItems);
                }
                rix++;
              } //end while

              if (ixDSE < eDSE) { //Add any needed blanks at end
                _addBlanks((eDSE - ixDSE + 1), bItem.evtItems, 0, ixDSE, dDSE);
              }
            }
            bodyArr.push(bItem);
          });

          return bodyArr;
        }

        // adds the calendar item to the first bin that has no overlap. It will extend the bins if needed.
        // bix - is the bin number (start with 0)
        // bins - is an array that contains the bins (2d array)
        // binEnd - is an array that holds the highest end date of the bin,
        // item - is the event to place in the bins.
        function _addToBin(bix, bins, binEnd, item) {
          if (bix >= binEnd.length) {
            binEnd.push(item.end_dse);
            bins.push([]);
            bins[bix].push(item);
          }
          else if (item.start_dse > binEnd[bix]) {
            bins[bix].push(item);
            binEnd[bix] = item.end_dse;
          }
          else {
            bix++;
            _addToBin(bix, bins, binEnd, item);
          }
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

        // Adds blank column(s). If blank falls on the end of the week then
        // set the isWknd property.
        function _addBlanks(bcount, rArr, rnum, fDSE, dDSE) {
          var i,
              std = datetime.dseToDate(fDSE).getDay(),
              wknd = sundayStart ? 5 : 0;

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
              isWknd: (std === wknd),
              dse: fDSE,
              room: rnum
            };
            rArr.push(blank);
            std = (std === 6) ? 0 : std + 1;
            fDSE++;
          }
          return i;
        }

        // Adds an event to the array
        function _addEventItem(evt, overlapEnd, eArr) {
          var evtItem = {
                resNum: evt.id,
                text: evt.title,
                span: evt.end_dse - evt.start_dse + 1,
                resCol: true,
                endCol: false,
                link: {number: evt.id, room: 0, guest: ''},
                overLapCol: overlapEnd,
                hoverTxt: '<b>' + evt.title + '<b><br />Von: ' + $filter('date')(evt.start_date, 'shortDate') + '<br />Bis: ' +
                $filter('date')(evt.end_date, 'shortDate') + (evt.comments ? '<br />' + evt.comments : ''),
                isBlank: false
              },
              nextDSE = evt.end_dse + 1;

          eArr.push(evtItem);

          return nextDSE;
        }

        // Adds a reservation/resource item if not overlapEnd then add a checkout day
        function _addResItem(res, overlapEnd, rArr, edse) {
          var std = res.end_date.getDay(),
              wknd = sundayStart ? 6 : 0;

          var resItem = {
                resNum: res.reservation_number,
                text: res.resource_name ? configService.loctxt.roomAbrv + ' ' + res.room : res.title + ( !res.oneRoom ? ' - ' + res.guest + (res.guest2 ? ' / ' + res.guest2 : '') : ''),
                span: res.nights,
                start: datetime.daysSinceEpoch(res.start_date), //used to move calendar to start date of reservation when selected
                resCol: true,
                endCol: false,
                link: {number: res.reservation_number, room: res.room, guest: res.guest},
                overLapCol: overlapEnd && res.end_dse !== edse,
                hoverTxt: '<b>' + res.title + ( !res.oneRoom ? ' - ' + res.guest : '') + '</b><br />Von: '
                + $filter('date')(res.start_date, 'shortDate')
                + '<br />Bis: ' + $filter('date')(res.end_date, 'shortDate')
                + (res.resource_name ? '<br /> Zi. ' + res.room : '')
                + (res.comments ? '<br />' + res.comments : ''),
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
                isWknd: (std === wknd),
                dse: res.end_dse,
                room: res.room
              },
              nextDSE = res.start_dse + res.nights;

          rArr.push(resItem);
          if (!overlapEnd && (res.end_dse <= edse)) {
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
          eventClickFunction: '=',
          blankClickFunction: '=',
          startDate: '@',
          weekSpan: '=', // number of weeks each side of 'active' week
          weeksStartSunday: '@' //boolean, defaults to false - Monday start
        }
      };

    }]);
});
