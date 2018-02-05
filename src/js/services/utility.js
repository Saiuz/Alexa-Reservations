/**
 * Exposes various Utility and conversion services. The services provide objects 
 * and methods for math conversion, text formatting, object copying, input modal utilites etc.
 *
 * Dependencies: appConstants - mongoose model.
 */
define(['./module'], function (services) {
  'use strict';
  const fs = require('fs-extra');
  const path = require('path');
  const exec = require('child-process-promise').exec;
  const archiver = require('archiver');

  services.service('convert', ['$filter', function ($filter) {
    // *** Private methods used by the public service methods

    // A function that returns an array of objects that are used by the formatDisplayString method to
    // provide the correct plural version of words in the string. It looks for the following patterns in a
    // string: <number> <singular>|<plural> for example "2 Tag|Tage" . It returns an array of objects
    // with two properties, 'replace' and 'withWord'. So for the example above, the object would be:
    // {replace: 'Tag|Tage', withWord: 'Tage'}
    //
    function _getPluralMatches(string) {
      var matches = [],
        regex = /(?:\S+\s)?(\S*\w+(\|\w+)+)/g,
        reg2 = /\d+/,
        match, words, num, wix;

      while (match = regex.exec(string)) {
        //console.log(match);
        //mPlus = match[0];
        //mPlus = match[0].replace(match[1],'');
        words = match[1].split('|');
        num = Number(match[0].match(reg2)[0]);
        wix = num > 1 ? 1 : 0;
        matches.push({
          replace: match[1],
          withWord: words[wix]
        });
      }
      return matches;
    }

    // method that will adjust a numeric value to the specified precision. It rounds the decimal value.
    // Parameters:
    // x - the numeric value to be rounded
    // p - the precision or number of digits to the right of the decimal point
    this.roundp = function (x, p) {
      //error checking
      if (p < 0) {
        p = 0;
      } else if (p > 10) {
        p = 10;
      }
      if (typeof x === 'number') {
        return +(x.toFixed(p));
      } else {
        return NaN;
      }
    };

    // method that takes in an object with a 'display_string' property and returns the formated string
    // making substitutions for key words that are capped by '%' characters. The key words are either properties
    // on the object or a properties of the extras object. The instructions object can be used to give special
    // formatting instructions to the values of a key word property. The allowed property values for instructions are:
    // 'c' for currency and 'ds' for date in short date format. So for example if a key property is 'price' then
    // instructions object could have a property price: 'c' which tells this function to format the value as currency.
    this.formatDisplayString = function (mainObj, extras, instructions) {

      // Initialize, check for the existence of the extras object, create it if it does not exit.
      // Check if the mainObj is a Mongoose document. If so, then we perform property checking differently. (Need to
      // check the prototype for properties.)
      var result = '',
        intExtras = {};

      if (extras) {
        for (var property in extras) {
          if (extras.hasOwnProperty(property)) {
            intExtras[property] = extras[property];
          }
        }
      }
      var mongoose = ('_id' in mainObj); //is this a Mongoose document?

      // search mainObj for a property called 'display_string' if not there we return empty string.
      var dStr = mainObj['display_string'];
      result = dStr;
      if (dStr) {
        //find all of the keywords in the string and match them to properties in the main object.
        // if they are not found then we assume the missing properties are in the extras object.
        // we add the properties from the mainObject to the extra object. However, if the extra
        // object already has the property then we do not override it!
        var keywords = dStr.match(/%[^%]*%/g);
        if (keywords) {
          keywords.forEach(function (val) {
            var prop = val.replace(/%/g, '');
            if (mongoose ? (prop in mainObj) : mainObj.hasOwnProperty(prop)) {
              if (!intExtras.hasOwnProperty(prop)) {
                intExtras[prop] = mainObj[prop];
              }
            }
          });
          // now perform any special instructions for formatting the values of the properties
          if (instructions) {
            for (var ip in intExtras) {
              if (instructions.hasOwnProperty(ip)) {
                switch (instructions[ip]) {
                  case 'c':
                    intExtras[ip] = $filter('currency')(intExtras[ip]);
                    break;
                  case 'ds':
                    intExtras[ip] = $filter('date')(intExtras[ip], 'sortDate');
                    break;
                }
              }
            }
          }
          // now replace the keywords in the display string with the values of the matching properties
          keywords.forEach(function (key) {
            var prop = key.replace(/%/g, '');
            var value = intExtras[prop];
            result = result.replace(new RegExp(key, 'gi'), value);
          });
        }
        // now correct plurals
        var plurals = _getPluralMatches(result);
        plurals.forEach(function (match) {
          result = result.replace(match.replace, match.withWord);
        });
      }
      return result;
    }

    // converts the text representation of a German number such as "1.000,55" to decimal "1000.55". If the
    // asNumber parameter is true then it returns the numeric value. Otherwise it returns the text value.
    // It has some basic logic that will accept a decimal deliniated number if the value (without the decimal)
    // is less than 1000.
    // For example, "3.30" will be treated as a decimal value, but "2.000"  will be converted to 2000.
    //TODO-this logic is a bit week may want to be more careful about accepting decimal values
    this.deNumberToDecimal = function (input, asNumber) {
      var p = input.indexOf('.') !== -1,
        result;
      if (p && Number(input.replace('.', '')) < 1000) { //treat as decimal number
        return asNumber ? Number(input) : input;
      } else {
        result = input.replace('.', '').replace(',', '.');
        return asNumber ? Number(result) : result;
      }

    };
    /**
     * Parses a full name string into its component parts. Returns an
     * object with 3 properties: salutation, first_name, last_name
     * @param {string} nameStr 
     */
    this.parseNameString = function (nameStr) {
      nameStr = nameStr.replace(/undefined/, '').replace(/\s\s+/g, ' ').trim();

      let validPrefix = /^(von|an)$/;
      let validSuffix = /^(II|III|Sr|Sr.|Jr|Jr.|[0-9])$/;
      var validSalutations = /\bHerrn Dr\.|Herrn Pfarrer\b|\bProf\. Dr\.|\bHerrn|\bHerren|\bFrau|\bFamilie|\bDr.|\bHerr\b|\bDamen|\bGräfin/;

      let np = {
        salutation: '',
        first_name: '',
        last_name: ''
      }
      // first extract the salutation from the sting if any
      // if salutation is invalid it will be ignored and added
      // to the first name. Note, the salutation 'Herren' may
      // show up, it needs to be replaced by 'Herrn'
      let sal = nameStr.match(validSalutations);
      if (sal) {
        np.salutation = sal[0];
        nameStr = nameStr.replace(sal[0], '');
        np.salutation = np.salutation.replace('Herren', 'Herrn');
      }
      //now parse the rest of the name starting at the end.   
      let nPts = nameStr.trim().split(' ');
      let ix = nPts.length - 1;
      // assume last part is surname but check for suffix and add to last name
      if (ix >= 0) {
        let n = nPts[ix--];
        if (n.match(validSuffix)) {
          nPts.pop();
          if (ix >= 0) {
            np.last_name = `${nPts[ix--]} ${n}`;
            nPts.pop();
          }
        } else {
          np.last_name = n
          nPts.pop();
        }
      }
      // check for prefix 'von' or 'an' add to first name else just first name
      if (ix >= 0) {
        let n = nPts[ix--];
        if (n.match(validPrefix)) {
          nPts.pop();
          if (ix >= 0) {
            np.first_name = `${nPts[ix--]} ${n}`;
            nPts.pop();
          }
        } else {
          np.first_name = n
          nPts.pop();
        }
      }
      // finally concatenate remaining parts into the first name
      if (ix >= 0) {
        nPts.push(np.first_name);
        np.first_name = nPts.join(" ");
      }

      return np;
    }

  }]);

  /**
   * File utility service
   */
  services.service('fileExecUtil', ['appConstants', function (appConstants) {
    /**
     * Function creates and/or cleans the required working directories for the app.
     */
    this.prepAppDirectories = async function () {
      try {
        await fs.ensureDir(appConstants.basePath);
        await fs.remove(appConstants.workPath);
        await fs.mkdir(appConstants.workPath);
      } catch (err) {
        throw err;
      }
    }
    /**
     * Function cleans the workPath directory
     */
    this.cleanWorkingDirectory = async function () {
      try {
        await fs.remove(appConstants.workPath);
        await fs.mkdir(appConstants.workPath);
      } catch (err) {
        throw err;
      }
    }
    /**
     * Function that exposes the path.join function. It joins
     * the parts of a directory/file path together with the 
     * correct operating system separator. 
     */
    this.pathJoin = (...parts) => {
      return path.join(...parts);
    }
    /**
     * zips up all files in the specified source directory into 
     * a zip archive.
     */
    this.zipDir = async function (sourceDir, destPath) {
      let zbytes = 0;
      try {
        let dpath = path.dirname(destPath);

        if (await fs.pathExists(sourceDir) && await fs.pathExists(dpath)) {
          zbytes = await _zipFiles(sourceDir, destPath);
          console.log(`Zipped ${zbytes} total bytes in ${sourceDir}`);
        } else {
          throw new Error(`zidDir Error: invalid source or destination`);
        }
        return zbytes;
      } catch (err) {
        throw err;
      }
    }

    /**
     * Executes a shell command and returns the output. It returns
     * either stdout or if nothing in stdout then stderr. 
     * Note the mondodump command only returns output to stderr for
     * some reason.
     */
    this.execCmd = async function (cmd) {
      try {
        let results = await exec(cmd);
        return (results.stdout ? results.stdout : results.stderr);
      } catch (err) {
        throw err;
      }
    }
  }]);

  /**
   * Service for use with Model input form ViewModel code.
   */
  services.service('modalUtility', ['$timeout','configService',function ($timeout, configService) {
    const _this = this;
    /**
     * An error object that can be returned by ViewModel validation and by the factory methods.
     * It has three function properties:
     *    hasErrors() = read only property that returns true if there are error messages in the object
     *    errors() = read only property that returns an array with the list of errors.
     *    push(errMsg) = method to add an error message to the object. Like the constructor
     *                   errMsg can be a string, Error object, ErrObj or any object that 
     *                   has a "message" property.
     * 
     * @param {*} firstErr - constructor - string message, Error object, another ErrObj
     * or any object that has a "message" property. The contents of firstErr are
     * added to the internal error list.
     */
    this.ErrObj = function ErrObj(firstErr) {
      let errList = [];
      if (firstErr) {
        if (firstErr instanceof Error) {
          errList.push(firstErr.message);
        } else if (typeof firstErr === "object" && firstErr.hasOwnProperty("hasErrors")) {
          errList = firstErr.errors();
        } else if (typeof firstErr === "object" && firstErr.hasOwnProperty("message")) {
          errList.push(firstErr.message + "++");
        } else {
          errList.push(firstErr.toString());
        }
      }

      this.errors = function () {
        return errList
      };
      this.hasErrors = function () {
        return errList.length !== 0
      };
      this.push = function (errMsg) {
        if (errMsg instanceof Error) {
          errList.push(errMsg.message)
        } else if (typeof errMsg === "object" && errMsg.hasOwnProperty("hasErrors")) {
          let errs = errMsg.errors();
          errs.forEach(e => errList.push(e));
        } else {
          errList.push(errMsg.toString());
        }
      }
    };
    /**
     * Mongoose modal Modal form helper. This class adds scope variables that can
     * be used to display error or success messages and provides methods the modal
     * controllers can use to control these UI elements. It also provides scope variables
     * that can be attached to buttons for canceling the form and hiding the error message.
     * @param {angular object} $scope - the scope object of the controller
     * @param {angular object} $timeout - the angular timer object object of the controller
     * @param {service} configService - the config service reference
     */
    this.Helpers = function Helpers($scope, $modalInstance) {
      let acTimer = null; // used for timer to auto close modal after a delay when a C, U or D operation occurs
      let errTimer = null; // used for timer to hide errors after a delay when an error is displayed  
      // Initialize/create required scope variables 
      $scope.err = null;
      $scope.errSave = false;
      $scope.errLoad = false;
      $scope.hide = false;
      $scope.cancel = function () { //cancels form
       if (acTimer) $timeout.cancel(acTimer);
       if (errTimer) $timeout.cancel(errTimer);
       $modalInstance.dismiss('cancel');
     };
      $scope.hideErr = function _hideErr () {
        $scope.errSave = false;
      };
      $scope.close = function () {
        $modalInstance.close();
      }
      
      /**
       * Display a success message then auto close form after
       * a specified delay.
       * @param {*} msg - success message to display
       * @param {*} val  - a value returned by the modal when it closes.
       */
      this.autoClose = _autoClose;

      function _autoClose(msg, val) {
        $scope.hide = true;
        $scope.actionMsg = msg;
        _dApply();
        acTimer = $timeout(function () {
          $modalInstance.close(val);
        }, configService.constants.autoCloseTime)
      };
      /**
       * Auto hide save error messages after a time interval
       */
      this.setErrorHideTimer = _setErrorHideTimer;

      function _setErrorHideTimer() {
        errTimer = $timeout(function () {
          $scope.errSave = false;
          $scope.err = null;
        }, configService.constants.errorDisplayTime)
      }
      /**
       * Displays the save error object on the form. If the err parameter
       * is provided then it is added to the $scope.err object and the error(s)
       * are displayed. If err is not provided then the existing error object is
       * displayed.
       * @param {*} err - error message or Error object that will be 
       * added to $scope.err
       */
      this.showSaveError = _showSaveError;

      function _showSaveError(err) {
        if (err) {
          if (!$scope.err) {
            $scope.err = new _this.ErrObj(err);
          } else {
            $scope.err.push(err);
          }
        }
        $scope.errSave = true;
        _setErrorHideTimer();
        _dApply();
      }
      /**
       * Displays a load error. Note the load error message does not disappear
       * @param {*} err - error message or object
       */
      this.showLoadErr = _showLoadErr;

      function _showLoadErr(err) {
        console.error(err);
        $scope.err = new _this.ErrObj(err);
        $scope.errLoad = true;
        _dApply();
      }
      /**
       * Function that calls $apply but will
       * only call it when digest is not in progress.
       */
      this.dApply = _dApply;

      function _dApply() {
        setTimeout(() => {
          $scope.$apply()
        }, 0);
      }
    }
  }]);

  /**
   * Provides calculation methods for reporting and statistics viewing.
   */
  services.service('statCalculations', ['appConstants','datetime', function (appConstants, datetime) {
    /**
     * Calculates basic revenue management statistics for all reservations 
     * over a specified time interval. It calculates occupancy, Average Daily Rate (ADR)
     * and Revenue Per Available Room (RevPAR). It calculates the daily averages for each
     * day in the time period, each month in the time period, each year in the time period
     * and the total time period. It takes the results of the dashboard.findResDailyStatistics
     * method call.
     * @param {object} resData - reservation data object returned from the 
     * findResDailyStatistics function
     * @param {boolean} excludeUncheckedIn - if true (default value) it will not 
     * count statistics for reservations that have not been at least checked in.
     */
    this.calculateRevenueMetrics = (resData, excludeUncheckedIn = true) => {
      const totalRooms = resData.totalRooms;
      let rMap = resData.dataMap;
      let stats = {
        startDate: resData.startDate,
        endDate: resData.endDate,
        totalDays: rMap.size,
        totalOccupancy: 0,
        totalADR: 0,
        totalRevPAR: 0,
        dailyValues: [],
        monthlyResults: new Map(),
        yearlyResults: new Map()
      };
      let dtf1 = new Intl.DateTimeFormat('de-DE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      let dtf2 = new Intl.DateTimeFormat('de-DE', {
        year: 'numeric',
        month: '2-digit'
      });
      let rmNights = 0.0;
      let rmRevenue = 0.0;
      let rmNightsMax = 0;
      let first = true;
      rMap.forEach((val, day) => {
        rmNightsMax += totalRooms;
        let dt = datetime.dseToDate(day);
        let rmCnt = excludeUncheckedIn ? val.rCnt : (val.rCnt + val.rfCnt);
        let rSum = excludeUncheckedIn ? val.rSum : (val.rSum + val.rfSum);
    
        stats.dailyValues.push({
          date: dt.toLocaleDateString('de-DE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }), //dtf1.format(dt),
          days: 1,
          occupancy: Math.round(rmCnt / totalRooms * 100.0),
          ADR: +((rmCnt ? (rSum / rmCnt) : 0).toFixed(2)),
          RevPAR: +((rSum / totalRooms).toFixed(2))
        });
        // calculate intermediate total averages
        rmNights += rmCnt;
        rmRevenue += rSum;
    
        //calculate intermediate monthly averages
        let mKey = dt.toLocaleDateString('de-DE', {
          year: 'numeric',
          month: '2-digit'
        }) //dtf2.format(dt);
        let mRes = stats.monthlyResults.get(mKey);
        if (mRes) {
          mRes.rmNights += rmCnt;
          mRes.rmRevenue += rSum;
          mRes.days++;
        } else {
          stats.monthlyResults.set(mKey, {
            rmNights: rmCnt,
            rmRevenue: rSum,
            days: 1
          });
        }
    
        // calculate the intermediate yearly averages
        let yKey = dt.getFullYear().toString();
        let yRes = stats.yearlyResults.get(yKey);
        if (yRes) {
          yRes.rmNights += rmCnt;
          yRes.rmRevenue += rSum;
          yRes.days++;
        } else {
          stats.yearlyResults.set(yKey, {
            rmNights: rmCnt,
            rmRevenue: rSum,
            days: 1
          });
        }
      });
      // Now calculate monthly/yearly averages from totals and convert results to array
      let mrTemp = [];
      let yrTemp = []
      stats.monthlyResults.forEach((val, key) => {
        let mStat = {
          month: key,
          days: val.days,
          occupancy: Math.round((val.rmNights / (totalRooms * val.days)) * 100),
          ADR: +((val.rmNights ? val.rmRevenue / val.rmNights : 0).toFixed(2)),
          RevPAR: +((val.rmRevenue / (totalRooms * val.days)).toFixed(2))
        }
        mrTemp.push(mStat);
      });
      stats.yearlyResults.forEach((val, key) => {
        let yStat = {
          year: key,
          days: val.days,
          occupancy: Math.round((val.rmNights / (totalRooms * val.days)) * 100),
          ADR: +((val.rmRevenue ? val.rmRevenue / val.rmNights : 0).toFixed(2)),
          RevPAR: +((val.rmRevenue / (totalRooms * val.days)).toFixed(2))
        }
        yrTemp.push(yStat);
      });
      stats.monthlyResults = mrTemp;
      stats.yearlyResults = yrTemp;
      stats.totalOccupancy = Math.round(rmNights / rmNightsMax * 100);
      stats.totalADR = rmNights ? +((rmRevenue / rmNights).toFixed(2)) : 0;
      stats.totalRevPAR = +((rmRevenue / rmNightsMax).toFixed(2))
      return stats
    }
  }]);
  /**
   * Helper functions
   */

  /**
   * Actually does the Zip action on the directory.
   * @param {string} sourceDir 
   * @param {string} destPath 
   */
  function _zipFiles(sourceDir, destPath) {
    return new Promise((resolve, reject) => {
      let zipArchive = archiver('zip');
      try {
        let output = fs.createWriteStream(destPath);
        output.on('close', function () {
          resolve(zipArchive.pointer()); //Total bytes archived
        });

        zipArchive.on('error', function (err) {
          reject(err);
        });

        let lastDir = _lastDir(sourceDir); // specify the source dir inside the archive
        zipArchive.pipe(output);
        zipArchive.directory(sourceDir, lastDir);
        zipArchive.finalize();
      } catch (err) {
        reject(err);
      }
    });
  }
  /**
   * Returns the last directory/folder of a path string
   * @param {string} dirPath 
   */
  function _lastDir(dirPath) {
    let dp = path.parse(dirPath); //in case a file is also specified
    let pts = dp.dir.split(path.sep);
    let lastDir = dp.ext ? pts[pts.length - 1] : dp.name;
    if (lastDir === dp.root) {
      return '';
    } else {
      return lastDir;
    }
  }
});