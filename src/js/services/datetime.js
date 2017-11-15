/**
 * Service that provides date and time functions
 */
define(['./module'], function (services) {
  'use strict';

  services.factory('datetime', function () {

    const millisecondsPerDay = 86400000;

    //#region - functions
    /**
     * Parses a date string that is in German format (DD.MM.YYYY) and returns a valid
     * date object. The method expects just a date string (no time part)
     * @param {string} dateStr - date string in German format (date only)
     */
    const _dateParseDeF = (dateStr) => {
      if (!dateStr) {
        return undefined;
      }
      let dparts = dateStr.split('.');
      if (dparts.length < 2) { //must have at least two parts so we can infer the year
        return undefined;
      }

      let d = Number(dparts[0]);
      let m = Number(dparts[1]) - 1;
      let curYear = new Date().getFullYear();
      let y = dparts.length === 3 ? Number(dparts[2]) : curYear;
      y = (y < 100) ? y + 2000 : y;

      return ((d && d > 0 && d < 32) && (m >= 0 && m < 12) && (y && y > 0)) ? new Date(Date.UTC(y, m, d)) : undefined;
    }
    /**
     *  Checks that the parameter is a date object with a valid date contents.
     * NOTE: tryied (dateVal instanceof Date) instead of calling prototype.toString
     * however this always returned false in NW.js!!!
     * @param {Date} dateVal 
     */
    const _isDate = (dateVal) => {
      return ((Object.prototype.toString.call(dateVal) === "[object Date]") && !isNaN(dateVal.valueOf()));
    }
    /**
     * Checks that the parameter is a string that can be parsed into 
     * a valid date. Handles US and DE date formats
     * @param {string} dateStr 
     */
    const _isDateString = (dateStr) => {
      console.log("***** _isDateString");
      if (typeof dateval === 'string') {
        let x = Date.parse(dateval);
        let y = _dateParseDeF(dateval);
        return x || y ? true : false;
      }
      return false;
    }
    /**
     * Takes a valid date object and converts it to a new date object with the time component
     * set to 00:00:00.000. It can apply an optional day offset to the original date. If the dateVal
     * parameter is not a valid date it simply returns the parameter.
     * @param {Date} dateVal - valid date object
     * @param {Number / String} daysOffset - optional days offset that will be applied to the date. Can
     *  be a string that will parse to a integer.
     */
    const _dateOnly =  (dateVal, daysOffset = 0) => {
      if (_isDate(dateVal)) {
        let offset = (typeof daysOffset === "number") ? Math.floor(daysOffset) : 
          (typeof daysOffset === "string") ? isNaN(parseInt(daysOffset)) ? 0 : parseInt(daysOffset) : 0;
        let d = new Date(dateVal.getFullYear(), dateVal.getMonth(), (dateVal.getDate() + offset),0,0,0);
        d.setHours(0)
        return d;
      }
      else
        return dateVal;
    }
    /**
     * Returns UTC date (milliseconds since Unix Epoch) of the date specified.
     * It will only consider the date part and ignore the HMS. It can be
     * used to query MongoDB date fields
     * @param {date} dateVal 
     */
    const _dateOnlyUTC = (dateVal) => {
      if (_isDate(dateVal)) {
        return Date.UTC(dateVal.getFullYear(), dateVal.getMonth(), dateVal.getDate(), 0, 0, 0);
      } else {
        return dateVal;
      }
    }

    /**
     * Returns the days in the month of the specified date. If the date is not specified returns
     * days in the month of the current month.
     * @param {*} dateval - reference date
     */
    const _daysInMonthOfDate = (dateval) => {
      if (!_isDate(dateval)) {
        let cdate = new Date();
        return new Date(cdate.getFullYear(), cdate.getMonth() + 1, 0).getDate();
      } else if (_isDate(dateval)) {
        return new Date(dateval.getFullYear(), dateval.getMonth() + 1, 0).getDate();
      } else {
        return 0;
      }
    }
    /**
     * Converts a Date object to a UTC date (milliseconds since Unix epoch) that represents
     * the last millisecond of the the day of the date provided.
     * @param {Date} dateVal - date to convert
     */
    const __lastSecondUTC = (dateVal) => {
      if (_isDate(dateVal)) {
        return Date.UTC(dateVal.getFullYear(), dateVal.getMonth(), dateVal.getDate(), 23, 59, 59, 999);
      } else {
        return dateVal;
      }
    }
    /**
     * Converts an integer value that represents the days
     * since Unix epoch to a date value. Returns the date
     * with a 00:00:00.000 time part.
     * @param {number} dseVal 
     */
    const _dseToDate = (dseVal) => {
      let d = new Date();
      let adjust = d.getTimezoneOffset() * 60000;
      return new Date(dseVal * millisecondsPerDay + adjust);
    }
    /**
     * Given a date (which defaults to current date), find the start and end of the month the date falls in. Returns
     * an object with the start of month date (monthStart) and the end of the month date (monthEnd).
     * @param {*} date - reference date.
     */
    const _findMonthDates = (date) => {
      if (!_isDate(date)) {
        date = new Date();
      }
      return {
        monthStart: new Date(date.getFullYear(), date.getMonth(), 1),
        monthEnd: new Date(date.getFullYear(), date.getMonth() + 1, 0)
      };
    }
    /**
     * Given a date, find the start and end of the week that the date is in. Weeks can start on Sunday or Monday
     * The default is monday. If no date is provided then the current date is chosen.
     * Returns an object with three properties: weekStart, weekEnd, currentDay.
     * The currentDay represents the current day of the week that the specified date represents, but the first
     * day of the week is 1 and the last day of the week is 7.
     * @param {*} theDate - the reference date
     * @param {*} startSunday - boolean true if week starts on a Sunday
     */
    const _findWeek = (theDate, startSunday = false) => {
      let startDay = startSunday ? 0 : 1; //0=sunday, 1=monday
      let curDate = theDate ? new Date(theDate) : new Date();
      curDate.setHours(0, 0, 0, 0);
      let d = curDate.getDay(); //get the day
      let weekStart = new Date(curDate.valueOf() - (d <= 0 ? 7 - startDay : d - startDay) * millisecondsPerDay); //rewind to start day
      let weekEnd = new Date(weekStart.valueOf() + 6 * millisecondsPerDay); //add 6 days to get last day
      let curDay = d - startDay;
      curDay = (curDay < 0 ? 6 : curDay) + 1; //Returns current day from 1 to 7 instead of 0 to 6
      return {
        weekStart: weekStart,
        weekEnd: weekEnd,
        currentDate: curDate,
        currentDay: curDay
      }
    }
    /**
     * Returns the number of days since the Unix Epoch, Jan. 1, 1970. 
     * It ignores any time component.
     * @param {Date} dateVal 
     */
    const _daysSinceEpoch = (dateVal) => {
      if (_isDate(dateVal)) {
        let ms =  Date.UTC(dateVal.getFullYear(), dateVal.getMonth(), dateVal.getDate(), 0, 0, 0);
        return Math.floor(ms / millisecondsPerDay);
      }
      else {
        return 0;
      }
    }
    /**
     * Calculate the number of nights stayed between the two dates
     * @param {*} startDate 
     * @param {*} endDate 
     */
    const _getNightsStayed = (startDate, endDate) => {
      return _daysSinceEpoch(endDate) - _daysSinceEpoch(startDate);
    }
    /**
     * Returns the day of the year for the specified date
     * @param {*} dateval - date to find day of year
     */
    const _dayOfYear = (dateval) => {
      if (_isDate(dateval)) {
        let oneJ = new Date(dateval.getFullYear(), 0, 0);
        return Math.floor((dateval - oneJ) / millisecondsPerDay);
      } else {
        return 0;
      }
    }
    /**
     * Compare two dates (dates only, no times)
     * returns a negative value if A is less than B, 0 if they are equal, 
     * positive value if A is greater than B
     * @param {date} dateA 
     * @param {date} dateB 
     */
    const _dateCompare = (dateA, dateB) => {
      return _daysSinceEpoch(dateA) - _daysSinceEpoch(dateB);
    }
    /**
     * Converts a date object to a Date string 
     * in the German format. It ignores the time part.
     * @param {Date} dateVal 
     */
    const _toDeDateString = (dateVal) => {
      if (_isDate(dateVal)) {
        let y = dateVal.getFullYear(),
        m = dateVal.getMonth() + 1,
        d = dateVal.getDate();
        return d + '.' + m + '.' + y;
      }
    }
    //#endregion

    return {
      dateOnlyUTC: _dateOnlyUTC,
      lastSecondUTC: __lastSecondUTC,
      dateOnly: _dateOnly,
      findMonthDates: _findMonthDates,
      findWeek: _findWeek,
      getNightsStayed: _getNightsStayed,
      dateParseDe: _dateParseDeF,
      isDateString: _isDateString,
      isDate: _isDate,
      daysInMonthOfDate: _daysInMonthOfDate,
      dayOfYear: _dayOfYear,
      dateCompare: _dateCompare,
      daysSinceEpoch: _daysSinceEpoch,
      dseToDate: _dseToDate,
      toDeDateString: _toDeDateString
    };
  });
});