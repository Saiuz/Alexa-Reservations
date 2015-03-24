/*
 *  Simple service that returns the Mongoose database object with an open connection and provide disconnect and
 *  reconnect methods.
 */
define(['./module'], function (services) {
  'use strict';

  services.factory('db', ['appConstants', function (appConstants) {

    var tungus = require('tungus');
    var mongoose = require('mongoose');
    var fs = require('fs');
    var path = require('path');

    var files, newfile, oldfile;

    console.log("Creating/opening database in folder", appConstants.dbPath);
    // First see if the database path exists, if not create it.
    if (!fs.existsSync(appConstants.basePath)) {
      fs.mkdirSync(appConstants.basePath);
    }
    if (!fs.existsSync(appConstants.dbPath)) {
      fs.mkdirSync(appConstants.dbPath);
    }

    // Now check to see if we have peformed an import of all data files since the last time we ran.
    // These files will have a _1 suffix on the file name.
    var files = fs.readdirSync(appConstants.dbPath);
    files.forEach(function (f) {
      if (/_1$/.test(f)) {
        newfile = path.join(appConstants.dbPath, f);
        oldfile = path.join(appConstants.dbPath, f.replace('_1', ''));
        fs.unlinkSync(oldfile);
        fs.renameSync(newfile, oldfile);
      }
    });

    // Establish the database connection
    mongoose.connect(appConstants.dbConnStr, function (err) {
      // if we failed to connect, abort
      if (err) throw err;
    });

    return {
      dbDisconnect: function (callback) {
        mongoose.disconnect(callback);
      },
      dbReconnect: function () {
        mongoose.connect(appConstants.dbConnStr, function (err) {
          // if we failed to connect, abort
          if (err) throw err;
        })
      },
      db: mongoose
    }
  }]);
});
