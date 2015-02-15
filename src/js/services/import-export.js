/**
 * Import / export service. This service will import Zipped and unzipped csv files into the database .
 * NOTE: on import, the existing database files are locked against exclusive access by another app. I tried to
 * disconnect the db, then expand the zip archive then reconnect but it still didn't seem to release the files.
 * Therefore, i changed the unzip command to add a new file with the suffix _1. I then modified the db service
 * to look for these files before connecting to the db. If it finds them, it deletes to old file and renames the
 * _1.
 * TODO-need to complete the individual import and export methods for Guests and Firms and the tax export method.
 */
define(['./module'], function (services) {
  'use strict';

  services.service('importExport', ['$q', 'appConstants', '$filter','db', function($q, appConstants, $filter, db)  {

    var fs = require('fs'),
        path = require('path'),
        child = require('child_process'),
        archiver = require('archiver'),
        sys = require('sys'),
        exec = require('child_process').exec,
        csv = require('csv');


    // This replaces the existing database files with the files in the referenced zip archive.
    // It first backs up the existing database files in the same directory. The name and
    // location of the zip file is specified in the fpath argument.
    // Note: The archiver module used to zip the data can;t unzip. For that we need to
    // call an external program to do it. For windows we use the command line version of 7-zip.
    this.importAll = function(fpath) {
      var deferred = $q.defer(),
          zcmd = appConstants.zipCommand(fpath);


      function puts(err, stdout, stderr) {
        db.dbReconnect(); // Reconnect no matter what.
        if (err) {
          console.log(err + '\n' + stdout);
          deferred.reject(err + '\n' + stdout);
        }
        else {
          console.log(stdout);
          deferred.resolve(stdout);
        }
      }
      // First archive existing files in place, then restore by overwriting
      this.exportAll(this.getDefaultExportFilePath('db')).then(function ( ) {
        db.dbDisconnect(function () {  //once closed, extract
          exec(zcmd, puts);
        });
      }, function (err) {
        deferred.reject(err);
      });

      return deferred.promise;
    };

    // This exports all existing database files into a zip archive. The name and
    // location of the created zip file is specified in the fpath argument. Note:
    // zip files can be easily created with the archiver module but this is
    // one way only, no unzip function.
    this.exportAll = function(fpath) {
      var deferred = $q.defer(),
          files = fs.readdirSync(appConstants.dbPath),
          fpaths = [];

      // find the db files in the directory read results and add full path to names
      files.forEach(function (f) {
        if (f.indexOf('.') === -1) {
          var fname = path.join(appConstants.dbPath, f);
          fpaths.push(fname);
        }
      });

      if (fpaths.length) {
        var zipArchive = archiver('zip');
        var output = fs.createWriteStream(fpath);

        console.log('Processing Archive');
        output.on('close', function () {
          console.log('Archived ' + fpaths.length + ' files, ' + zipArchive.pointer() + ' total bytes');
          deferred.resolve('Archived ' + fpaths.length + ' files, (' + zipArchive.pointer() + ' total bytes) to ' + fpath);
        });

        zipArchive.on('error', function (err) {
          deferred.reject(err); // reject promise
        });

        zipArchive.pipe(output);
        zipArchive.bulk({ src: fpaths, expand: true, flatten: true});
        zipArchive.finalize();
      }
      else {
        deferred.reject("No database files found"); //todo-move string to config.loctxt
      }

      return deferred.promise;
    };

    this.importGuest = function(fpath) {

    };

    this.exportGuest = function(fpath, zipIt) {

    };

    this.importFirm = function(fpath) {

    };

    this.exportFirm = function(fpath, zipIt) {

    };

    this.exportTaxes = function(fpath, startDate, endDate) {

    };

    this.getDefaultExportFilePath = function (model) {
      var prefix = appConstants.defExportPath + '\\' + $filter('date')(new Date(),'yyyy_MM_dd_HHmmss') +'_',
          dbbck = appConstants.dbPath + '\\' + $filter('date')(new Date(),'yyyy_MM_dd_HHmmss') +'_dbBackup.zip',
          path;

      model = (model || 'all').toLowerCase();

      switch (model) {
        case 'all':
          path = prefix + 'AlexaBck.zip';
          break;
        case 'db':
          path = dbbck;
          break;
        default:
          path = prefix + model + '.csv';
      }

      return path;
    };

    this.getDefaultImportDirectory = function () {
      return appConstants.defExportPath;
    };
    // private methods
  }]);
});