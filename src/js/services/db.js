define(['./module'], function (services) {
  'use strict';

  services.factory('db', [function() {

    var tungus = require('tungus');
    var mongoose = require('mongoose');

    var dbpath = process.env.PWD;

    if (!dbpath) {
      dbpath = process.env.APPDATA + "/nwapp"    //RHV changed from process.env.PWD which was not defined for windows
    }

    console.log("Creating/opening database in folder", dbpath);

    // Establish the database connection
    mongoose.connect('tingodb://'+ dbpath +'/data', function (err) {
      // if we failed to connect, abort
      if (err) throw err;
    });

    return mongoose;
  }]);
});
