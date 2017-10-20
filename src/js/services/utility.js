/**
 * Utility and conversion services. Provides methods for math conversion, text formatting, object copying etc.
 *
 * Dependencies: ExpenseItem - mongoose model.
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
        match, words, num, wix;

      while (match = regex.exec(string)) {
        //console.log(match);
        //mPlus = match[0];
        //mPlus = match[0].replace(match[1],'');
        words = match[1].split('|');
        num = Number(match[0].replace(match[1], ''));
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
      var a = [1, 10, 100, 1000, 10000, 100000, 1000000, 10000000, 100000000, 1000000000, 10000000000];
      return Math.round(x * a[p]) / a[p];
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

  services.service('utility', [function () {

    // An error object that can be returned by ViewModel validation and by the factory methods.
    // It has two properties and one method:
    //    hasErrors = read only property that returns true if there are error messages in the object
    //    errors = read only property that returns an array with the list of errors.
    //    push(errMsg) = method to add an error message to the object.
    this.errObj = function (firstErr) {
      var errList = [];
      if (firstErr) {
        errList.push(firstErr);
      }
      this.errors = function () {
        return errList
      };
      this.hasErrors = function () {
        return errList.length !== 0
      };
      this.push = function (errMsg) {
        errList.push(errMsg)
      }
    };
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

        let lastDir = _lastDir(sourceDir); // specifiy the source dir inside the archive
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
   * @param {string} dirpath 
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