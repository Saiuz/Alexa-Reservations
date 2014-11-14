/**
 * Utility and conversion services. Provides methods for math conversion, text formatting, object copying etc.
 *
 * Dependencies: ExpenseItem - mongoose model.
 */
define(['./module'], function (services) {
  'use strict';
  services.service('convert', [function () {

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
  }]);

  services.service('utility', [function () {

    // An error object that can be returned by ViewModel validation and by the factory methods.
    // It has two properties and one method:
    //    hasErrors = read only property that returns true if there are error messages in the object
    //    errors = read only property that returns an array with the list of errors.
    //    push(errMsg) = method to add an error message to the object.
     this.errObj = function (firstErr) {
      var errList= [];
      if (firstErr) {
        errList.push(firstErr);
      }
      this.errors = function () {return errList};
      this.hasErrors = function () {return errList.length !== 0};
      this.push = function (errMsg) {
        errList.push(errMsg)
      }
    };
  }]);
});