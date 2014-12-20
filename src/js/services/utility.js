/**
 * Utility and conversion services. Provides methods for math conversion, text formatting, object copying etc.
 *
 * Dependencies: ExpenseItem - mongoose model.
 */
define(['./module'], function (services) {
  'use strict';
  services.service('convert', [function () {
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
        num = Number(match[0].replace(match[1],''));
        wix = num > 1 ? 1 : 0;
        matches.push({replace: match[1], withWord: words[wix]});
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
    // on the object or a properties of the extras object.
    this.formatDisplayString = function (mainObj, extras) {

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
      var dStr = mainObj['display_string']
      if (dStr) {
        //find all of the keywords in the string and match them to properties in the main object.
        // if they are not found then we assume the missing properties are in the extras object.
        // we add the properties from the mainObject to the extra object. However, if the extra
        // object already has the property then we do not override it!
        var keywords = dStr.match(/%[^%]*%/g);
        keywords.forEach(function (val) {
          var prop = val.replace(/%/g, '');
          if (mongoose ? (prop in mainObj) : mainObj.hasOwnProperty(prop)) {
            if (!intExtras.hasOwnProperty(prop)) {
              intExtras[prop] = mainObj[prop];
            }
          }
        });

        // now replace the keywords in the display string with the values of the matching properties
        result = dStr;
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
      return result;
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
});