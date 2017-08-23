/*
 *  Simple service that returns the Mongoose database object with an open connection and provide disconnect and
 *  reconnect methods.
 */
define(['./module'], function (services) {
  'use strict';

  services.factory('db', ['appConstants', function (appConstants) {

    //var tungus = require('tungus');
    var mongoose = require('mongoose');
    var fs = require('fs');
    var path = require('path');

    var files, newfile, oldfile;

    //console.log("Creating/opening database in folder", appConstants.dbPath);
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
    var constr = appConstants.dbConnStr; // 'mongodb://192.168.1.32:27017/AlexaDB';
    console.log('Connecting to db ' + constr);
    mongoose.Promise = global.Promise;
    mongoose.connect(constr, {
      useMongoClient: true
    }, (err) => {
      if (err) throw err;
      console.log("Connected to db: " + constr);
    });
    // mongoose.connect(constr, {useMongoClient: true}, function (err) {
    //   // if we failed to connect, abort
    //   if (err) throw err;
    //   console.log("Connected to db: " + constr);
    // });

    return {
      dbDisconnect: function (callback) {
        mongoose.disconnect(callback);
      },
      dbReconnect: function () {
        mongoose.connect(constr, {useMongoClient: true}, function (err) {
          // if we failed to connect, abort
          if (err) throw err;
          console.log("Reconnected to db: " + constr);
        })
      },
      db: mongoose
    }
  }]);
});
