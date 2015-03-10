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

  services.service('importExport',
      ['$q', 'appConstants', '$filter', 'db', 'Itemtype', 'RoomPlan', 'Firm', 'Guest', 'Room', 'Resource', 'Event',
        'Reservation', 'TaxItem', 'configService',
        function ($q, appConstants, $filter, db, Itemtype, RoomPlan, Firm, Guest, Room, Resource, Event, Reservation,
                  TaxItem, configService) {

          var fs = require('fs'),
              path = require('path'),
              archiver = require('archiver'),
              sys = require('sys'),
              exec = require('child_process').exec,
              csv = require('csv'),
              validModels = [Guest, Firm, Room, RoomPlan, Resource, Event, Itemtype]; //models available for import/export

          // This replaces the existing database files with the files in the referenced zip archive.
          // It first backs up the existing database files in the same directory. The name and
          // location of the zip file is specified in the fpath argument.
          // Note: The archiver module used to zip the data can;t unzip. For that we need to
          // call an external program to do it. For windows we use the command line version of 7-zip.
          this.importAll = function (fpath) {
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
            this.exportAll(this.getDefaultExportFilePath('db')).then(function () {
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
          this.exportAll = function (outPath) {
            var deferred = $q.defer(),
                files = fs.readdirSync(appConstants.dbPath),
                srcPaths = [];

            // find the db files in the directory read results and add full path to names
            files.forEach(function (f) {
              if (f.indexOf('.') === -1) {
                var fname = path.join(appConstants.dbPath, f);
                srcPaths.push(fname);
              }
            });

            if (srcPaths.length) {
              _zipFiles(srcPaths,outPath).then(function (result) {
                deferred.resolve(result);
              }, function (err) {
                deferred.reject(err);
              });
            }
            else {
              deferred.reject("No database files found"); //todo-move string to config.loctxt
            }

            return deferred.promise;
          };

          // imports a CSV file into the specified Mongoose Model. It will make a Zip backup before importing.
          // Parameters: inPath - full path to the CSV file that will be imported.
          //             model - an integer representing the Mongoose model to import to. This value can be obtained
          //                     from the getAvailableModels method that can be used by the UI to populate a dropdown.
          this.importFromCSV = function (inPath, model) {
            var deferred = $q.defer(),
                invalidModel = false,
                recCnt = 0,
                vmodels = this.getAvailableModels(),
                mgModel, srcPathArr, destPath, input, parser, transformer, qryFld, qry;

            switch (model) {
              case 0: //Guest
                qryFld = 'unique_name';
                break;
              case 1: //Firm
                qryFld = 'firm_name';
                break;
              case 2: //Room
                qryFld = 'number';
                break;
              case 3: //RoomPlan
                qryFld = 'name';
                break;
              case 4: //Resource
                qryFld = 'name';
                break;
              case 5: //Event
                qryFld = 'title,start_date';
                break;
              case 6: //ItemType
                qryFld = 'name,category';
                break;
              default:
                invalidModel = true;
                break;
            }

            if (invalidModel) {
              deferred.reject(model + ' is not a valid database model.');
            }
            else {
              mgModel = validModels[model]; //specify model
              // first archive file
              srcPathArr = [path.join(appConstants.dbPath, vmodels[model].model_name)];
              destPath = this.getDefaultExportFilePath('db',vmodels[model].model_name,false);

              _zipFiles(srcPathArr,destPath).then(function (result) {
                // Now add records to the model collection
                input = fs.createReadStream(inPath);
                input.setEncoding('utf8');
                input.on('error', function (err) {
                  deferred.reject('Input Error: ' + err);
                });

                // set up parser
                parser = csv.parse({columns: true});
                parser.on('error', function (err) {
                  deferred.reject('{Parse Error: ' + err);
                });

                // Set up transformer:
                // Clean up empty fields in the objects and store record in db. The CSV export will have all fields
                // present even if they are null or empty. It is more efficient to store the record in the DB by
                // removing any empty fields
                transformer = csv.transform(function (record, callback) {
                 // var qry = useGuest ? {unique_name: record.unique_name} : {firm_name: record.firm_name};
                  qry = _buildQry(qryFld, record);

                  //Remove empty properties
                  for (var p in record) {
                    if(record.hasOwnProperty(p)) {
                      if (typeof(record[p]) !== "number" && !record[p]) { //don't test number properties
                        delete record[p];
                      }
                    }
                  }

                  //Save record
                  mgModel.findOneAndUpdate(qry, record, {upsert: true}, function (err, doc) {
                    if (err) {
                      console.log(err);
                      deferred.reject('Find-Update Error: ' + err);
                    }
                    else {
                      recCnt++;
                      callback(null); //record stops here
                    }
                  });
                });

                // we will resolve promise when the process completes
                transformer.on('finish', function () {
                  deferred.resolve(recCnt); //return the record count
                });
                transformer.on('error', function (err) {
                  deferred.reject('Transformer Error: ' + err);
                });

                // Now start the import
                input.pipe(parser).pipe(transformer);

              }, function (err) {  // error for zip
                deferred.reject(err);
              });


            }

            return deferred.promise;
          };

          // exports the specified Mongoose model to a CSV file.
          // Parameters: outPath - the full path to the output file.
          //             model - an integer representing the Mongoose model to import to. This value can be obtained
          //                     from the getAvailableModels method that can be used by the UI to populate a dropdown.
          this.exportToCSV = function (outPath, model) {
            var deferred = $q.defer(),
                recCnt = 0,
                mprops = [],
                invalidModel, mgModel, outStream, stringifier, transformer;

            // initialize variables based on model selected
            invalidModel = (model < 0 || model >= validModels.length); //check for error
            if (invalidModel) {
              deferred.reject(model + ' is not a valid database model.');
            }
            else {
              mgModel = validModels[model]; //specify model
              // get the Model's properties but remove the _id and __v fields.
              // NOTE this only works properly (for CSV extraction) for properties that are not objects.
              mgModel.schema.eachPath(function (p) {
                if (p !== '_id' && p !=='__v') {
                  mprops.push(p);
                }
              });
              // now set up the csv and file items for piping
              outStream = fs.createWriteStream(outPath);
              outStream.on('close', function (){
                deferred.resolve(recCnt);
              });
              outStream.on('error', function (err) {
                deferred.reject('Output Error: ' + err);
              });

              stringifier = csv.stringify({header: true, columns: mprops, rowDelimiter: 'windows'});
              stringifier.on('error', function (err) {
                deferred.reject('Stringify Error: ' + err);
              });

              transformer = csv.transform(function (record, callback){  //remove __v and _id properties
                delete record.__v;
                delete record._id;
                callback(null, record);
                recCnt++;
              }, {parallel: 10});
              transformer.on('error', function (err) {
                deferred.reject('Transformer Error: ' + err);
              });

              // Now start exporting - use .lean() to return simple JSON object not model.
              mgModel.find().lean().stream().pipe(transformer).pipe(stringifier).pipe(outStream);
            }

            return deferred.promise;
          };

          this.exportTaxes = function (outPath, startDate, endDate) {
            var deferred = $q.defer(),
                taxProps = [],
                recCnt = 0,
                outStream, stringifier, transformer;

             //Get the properties for the taxItem schema for the CSV column headings removing _id and __v
            // then add reservation_number, start_date, end_date to start of object
            // ToDo-will need to translate these properties to German at some point and map them in transformer
             TaxItem.eachPath(function (p) {
               if (p !== '_id' && p !=='__v') {
                 taxProps.push(p);
               }
             });
            taxProps.unshift('end_date');
            taxProps.unshift('start_date');
            taxProps.unshift('reservation_number');

            // now set up the csv and file items for piping
            outStream = fs.createWriteStream(outPath);
            outStream.on('close', function (){
              deferred.resolve(recCnt);
            });
            outStream.on('error', function (err) {
              deferred.reject('Output Error: ' + err);
            });

            stringifier = csv.stringify({header: true, columns: taxProps, rowDelimiter: 'windows'});
            stringifier.on('error', function (err) {
              deferred.reject('Sringify Error: ' + err);
            });
            stringifier.on('finished', function (err) {
              console.log('STRINGIFY FINISHED');
            });

            // Transform the record. Extact the taxes array and create a cvs entry for each object in the array.
            //NOTE: There was an issue with the transformer not sending EOF to next stream. I added the setTimeout
            // and set the parallel option to 1 and it seemed to fixe the problem. Got the idea from :
            //https://github.com/wdavidw/node-stream-transform/issues/4
            transformer = csv.transform(function (record, callback){  //pull out tax info from reservation
              if (record.taxes && record.taxes.length) {
                record.taxes.forEach(function (tobj) {
                  delete tobj.__v;
                  delete tobj._id;
                  tobj.reservation_number = record.reservation_number;
                  tobj.start_date = $filter('date')(record.start_date,'shortDate');
                  tobj.end_date = $filter('date')(record.end_date,'shortDate');
                  setTimeout(function() {
                    callback(null, tobj);
                  },100);
                  recCnt++;
                });
              }
              else { // we shouldn't get here but create an empty record for the reservation
                callback(null, {
                  reservation_number: record.reservation_number,
                  start_date:  $filter('date')(record.start_date,'shortDate'),
                  end_date:  $filter('date')(record.end_date,'shortDate')
                });
              }
            }, {parallel: 1});
            transformer.on('error', function (err) {
              deferred.reject('Transformer Error:' + err);
            });
            transformer.on('finish',function() {console.log('TRANSFORMER FINISHED ' + recCnt + ' records')});

            // Query reservations-find all reservations that end between the dates specified.
            Reservation.find({$and: [{end_date: {$gte: startDate}}, {end_date: {$lte: endDate}}, {checked_out: {$exists: true}}]})
                .sort({end_date: 1})
                .lean()
                .stream()
                .pipe(transformer)
                .pipe(stringifier)
                .pipe(outStream);

            return deferred.promise;
          };

          this.getDefaultTaxFilePath = function(startDate, endDate) {
           return  appConstants.defExportPath + '\\' + $filter('date')(startDate, 'yyMMdd') + '_'
                   + $filter('date')(endDate, 'yyMMdd') + '_steuern.csv'
          };

          this.getDefaultExportFilePath = function (mode, model, isCsv) {
            var prefix = appConstants.defExportPath + '\\' + $filter('date')(new Date(), 'yyyy_MM_dd_HHmmss') + '_',
                dbPrefix = appConstants.dbPath + '\\' + $filter('date')(new Date(), 'yyyy_MM_dd_HHmmss') + '_',
                ftype = isCsv ? '.csv' : '.zip',
                path;

            mode = (mode || 'all').toLowerCase();
            model = (model || 'dbBackup');

            switch (mode) {
              case 'all':
                path = prefix + 'AlexaBck.zip';
                break;
              case 'db':
                path = dbPrefix + model + ftype;
                break;
              default:
                path = prefix + model + '.csv';
            }

            return path;
          };

          this.getDefaultImportDirectory = function () {
            return appConstants.defExportPath;
          };

          // Returns an array of objects for the Mongoose Models that are available for import/export
          // Guest, Firm, Room, RoomPlan, Resource, Event, ItemType
          this.getAvailableModels = function () {
            return [
              {value: 0, text: configService.loctxt.addressGuest, model_name: 'Guest'},
              {value: 1, text: configService.loctxt.firm, model_name: 'Firm'},
              {value: 2, text: configService.loctxt.room, model_name: 'Room'},
              {value: 3, text: configService.loctxt.roomPlan, model_name: 'RoomPlan'},
              {value: 4, text: configService.loctxt.resource, model_name: 'Resource'},
              {value: 5, text: configService.loctxt.event, model_name: 'Event'},
              {value: 6, text: configService.loctxt.expenseItem, model_name: 'ItemType'}
            ];
          };

          // private methods
          // Zip up files and store the archive in the specified path. Expects an array of input file paths
          function _zipFiles(sourceArr, destPath) {
            var deferred = $q.defer();
            if (sourceArr && sourceArr.length && destPath) {
                var zipArchive = archiver('zip');
                var output = fs.createWriteStream(destPath);

                console.log('Zipping files');
                output.on('close', function () {
                  console.log('Archived ' + sourceArr.length + ' files, ' + zipArchive.pointer() + ' total bytes');
                  deferred.resolve('Archived ' + sourceArr.length + ' files, (' + zipArchive.pointer() + ' total bytes) to ' + destPath);
                });

                zipArchive.on('error', function (err) {
                  deferred.reject(err); // reject promise
                });

                zipArchive.pipe(output);
                zipArchive.bulk({src: sourceArr, expand: true, flatten: true});
                zipArchive.finalize();

              }
            else {
              deferred.reject('Invalid parameters for zipFiles method');
            }

            return deferred.promise;
          }

          function _buildQry (qryFields, record) {
            var parts = qryFields.split(','),
                qryObj = {};

            parts.forEach(function (p) {
                qryObj[p] = record[p];
            });
            return qryObj;
          }
        }]);
});