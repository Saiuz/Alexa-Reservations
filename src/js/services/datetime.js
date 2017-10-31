/**
 * Service that provides date and time functions
 */
define(['./module'], function (services) {
  'use strict';

  services.factory('datetime', function () {

    var millisecondsPerDay = 86400000;

    var _dateParseDeF = function (dateStr) {
      if (!dateStr) {
        return undefined;
      }
      var dparts = dateStr.split('.');
      if (dparts.length < 2) { //must have at least two parts so we can infer the year
        return undefined;
      }

      var day = Number(dparts[0]);
      var month = Number(dparts[1]) - 1;
      var curYear = new Date().getFullYear();
      var year = dparts.length === 3 ? Number(dparts[2]) : curYear;
      if (year < 100) {
        year = year + 2000;
      }

      //Check for valid numeric values
      if ((day && day > 0 && day < 32) && (month && month > 0 && month < 13) && (year && year > 0)) {
        return new Date(year, month, day);
      }
      else {
        return undefined;
      }
    }

    var _isDate = function (dateval) {
      var adate = false;
      if (dateval) {
        if (Object.prototype.toString.call(dateval) === "[object Date]") {
          return true;
        }
        else if (typeof dateval === 'string') {
          var x = Date.parse(dateval);
          var y = _dateParseDeF(dateval);
          return x || y ? true : false;
        }
      }
      return adate;
    };

    // resets time on the specified date to 00:00 and applies an optional day offset
    var _dateOnly = function (dateval, daysOffset) {
      if (dateval instanceof Date && !isNaN(dateval.valueOf())) {
        var d = new Date(dateval.getFullYear(), dateval.getMonth(), dateval.getDate(),0,0,0);
        if ((Object.prototype.toString.call(daysOffset) !== '[object Array]') && daysOffset - parseFloat(daysOffset) >= 0) {
          d.setDate(d.getDate() + daysOffset);
        }
        return d;
      }
      else
        return dateval;
    };
    /**
     * Returns UTC date (milliseconds since Unix Epoch) of the date specified.
     * It will only consider the date part and ignore the HMS. It can be
     * used to query MongoDB date fields
     * @param {date} dateval 
     */
    function _dateOnlyUTC(dateval) {
      if (dateval instanceof Date && !isNaN(dateval.valueOf())) {
        return Date.UTC(dateval.getFullYear(), dateval.getMonth(), dateval.getDate(),0,0,0);
      } else {
        return dateval;
      }
    }
    
    function __lastSecondUTC(dateval) {
      if (dateval instanceof Date && !isNaN(dateval.valueOf())) {
        return Date.UTC(dateval.getFullYear(), dateval.getMonth(), dateval.getDate(),23,59,59);
      } else {
        return dateval;
      }
    }
    //NOTE: Bug in original code using getTime - timezone dependent!
    // find milliseconds from UTC date to stard of epoch then round up if current timezone is not UTC
    var _daysSinceEpoch = function (dateval) {
      if (_isDate(dateval)) {
        var offset  = 0 ;//= dateval.getTimezoneOffset() * 60000;
        var ms =  Date.UTC(dateval.getFullYear(), dateval.getMonth(), dateval.getDate(), 0, 0, 0) + offset;
        return Math.floor(ms / millisecondsPerDay) + (offset === 0 ? 0 : 1); //UTC time zone, no rounding
      }
      else {
        return 0;
      }
    };

    return {
      dateOnlyUTC: _dateOnlyUTC,
      lastSecondUTC: __lastSecondUTC,
      // Strip time value off a Date object and optionally changes the date
      // by the specified number of days (+ or -). Function returns a new
      // date object, or the original object if the original object is not a Date
      // object.
      // NOTE: this function will not work correctly with the TingoDB / Mongoose Date objects. To get around the
      // issue, you can wrap the Mongoose date object in a new JS date object, e.g. new Date(schema.date_field)
      dateOnly: _dateOnly,

      // Given a date (which defaults to current date), find the start and end of the month the date falls in. Returns
      // an object with the start of month date (monthStart) and the end of the month date (monthEnd).
      findMonthDates: function (date) {
        if (!_isDate(date)) {
          date = new Date();
        }
        return  {
          monthStart:  new Date(date.getFullYear(), date.getMonth(), 1),
          monthEnd:  new Date(date.getFullYear(), date.getMonth() + 1, 0)
        };
      },

      // Given a date, find the start and end of the week that the date is in. Weeks can start on Sunday or Monday
      // The default is monday. If no date is provided then the current date is chosen.
      // Returns an object with three properties: weekStart, weekEnd, currentDay.
      // The currentDay represents the current day of the week that the specified date represents, but the first
      // day of the week is 1 and the last day of the week is 7.
      findWeek: function (theDate, startSunday) {
        var startDay = startSunday ? 0 : 1; //0=sunday, 1=monday
        var currdate = theDate ? new Date(theDate) : new Date();
        currdate.setHours(0, 0, 0, 0);
        var d = currdate.getDay(); //get the day
        var weekStart = new Date(currdate.valueOf() - (d<=0 ? 7-startDay:d-startDay)*millisecondsPerDay); //rewind to start day
        var weekEnd = new Date(weekStart.valueOf() + 6*millisecondsPerDay); //add 6 days to get last day
        var curDay = d - startDay;
        curDay = (curDay < 0 ? 6 : curDay) + 1; //Returns current day from 1 to 7 instead of 0 to 6
        return { weekStart: weekStart, weekEnd: weekEnd, currentDate: currdate, currentDay: curDay }
      },

      //Calculate the number of nights stayed between the two dates
      getNightsStayed:  function(startDate, endDate) {
        return _daysSinceEpoch(endDate) - _daysSinceEpoch(startDate);
      },
      // function parses a date string in the German format: dd.MM.yyyy and returns a date object
      dateParseDe: _dateParseDeF,
      // determine if a variable is a valid date object or string representation of a date object.
      // handles US and German dd.MM.yyyy format
      isDate: _isDate,
      // returns the days in the month of the specified date. If the date is not specified returns
      // days in the month of the current month.
      daysInMonthOfDate: function (dateval) {
        if (!_isDate(dateval)) {
          var cdate = new Date();
          return new Date(cdate.getFullYear(), cdate.getMonth() + 1, 0).getDate();
        }
        else if (_isDate(dateval)) {
          return new Date(dateval.getFullYear(), dateval.getMonth() + 1, 0).getDate();
        }
        else {
          return 0;
        }
      },
      // returns the day of the year for the specified date
      dayOfYear: function (dateval){
        if (_isDate(dateval)) {
          var oneJ = new Date(dateval.getFullYear(), 0, 0);
          return Math.floor( (dateval-oneJ) / millisecondsPerDay);
        }
        else {
          return 0;
        }
      },
      // compare two dates (dates only, no times)
      // returns a negative value if A is less than B, 0 if they are equal, positive value if A is greater than B
      dateCompare: function (dateA, dateB) {
         return _daysSinceEpoch(dateA) - _daysSinceEpoch(dateB);
      },
      // returns the number of days since Jan. 1, 1970
      daysSinceEpoch: _daysSinceEpoch,
      // converts a days since Jan. 1 1970 value to a date. Note the conversion must
      // account for time zone by subtracting the TZ offset
      dseToDate: function (dseval) {
        var d = new Date();
        var adjust = d.getTimezoneOffset() * 60000;
        var d2 = new Date(dseval * millisecondsPerDay - adjust);
        return _dateOnly(d2);
      },
      // converts a date to a string (no time) in the german format dd.MM.YYYY
      toDeDateString: function (dateval) {
        if (dateval) {
          var y = dateval.getFullYear(),
              m = dateval.getMonth() + 1,
              d = dateval.getDate();

          return d + '.' + m + '.' + y;
        }
    }

    };
  });

});