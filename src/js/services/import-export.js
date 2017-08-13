/**
 * Import / export service. This service will import Zipped and unzipped csv and JSON files into the database .
 * NOTE: on import, the existing database files are locked against exclusive access by another app. I tried to
 * disconnect the db, then expand the zip archive then reconnect but it still didn't seem to release the files.
 * Therefore, i changed the unzip command to add a new file with the suffix _1. I then modified the db service
 * to look for these files before connecting to the db. If it finds them, it deletes to old file and renames the
 * _1.
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
              decomp = require('decompress'),
              sys = require('sys'),
              exec = require('child_process').exec,
              csv = require('csv'),
              byLine = require('byline'),
              that = this,
              validModels = [Guest, Firm, Room, RoomPlan, Resource, Event, Itemtype]; //models available for import/export

          // This replaces the existing database files with the files in the referenced zip archive.
          // It first backs up the existing database files in the same directory. The name and
          // location of the zip file is specified in the fpath argument.
          // Note: The archiver module used to zip the data can;t unzip. For that we need to
          // call an external program to do it. For windows we use the command line version of 7-zip.
          this.importAll = function (fpath) {
            var deferred = $q.defer();

            // First archive existing files in place, then restore by overwriting
            this.exportAll(this.getDefaultExportFilePath('db')).then(function () {
              db.dbDisconnect(function () {  //once closed, extract files
                decomp(fpath,appConstants.dbPath).then(function(f) {
                  db.dbReconnect(); // Reconnect no matter what.
                  console.log('Done. Extracted db files: ' + f.length);
                  deferred.resolve(f.length);
                }, function(err) {
                  deferred.reject('Error: ' + err);
                });
              });
            }, function (err) {
              db.dbReconnect(); // Reconnect no matter what.
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

          // imports a JSON file into the specified Mongoose Model. It will make a Zip backup before importing.
          // Parameters: inPath - full path to the JSON file that will be imported.
          //             model - an integer representing the Mongoose model to import to. This value can be obtained
          //
          this.importFromJSON = function (inPath, model) {
            var deferred = $q.defer(),
                invalidModel = false,
                recCnt = 0,
                vmodels = this.getAvailableModels(),
                mgModel, srcPathArr, destPath, input, byline, transformer, qryFld, qry;

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

                // set up the byLine stream
                byline = byLine.createStream(input);;
                byline.on('error', function (err) {
                  deferred.reject('{Line Reader Error: ' + err);
                });

                // Set up transformer:
                // Clean up empty fields in the objects and store record in db. The CSV export will have all fields
                // present even if they are null or empty. It is more efficient to store the record in the DB by
                // removing any empty fields
                transformer = csv.transform(function (record, callback) {
                  var newRec;
                  try {
                    newRec= JSON.parse(record);
                  }
                  catch (err) {
                    console.log(err);
                    deferred.reject('JSON Read Error: ' + err);
                  }

                  qry = _buildQry(qryFld, newRec);

                  //Save record
                  mgModel.findOneAndUpdate(qry, newRec, {upsert: true}, function (err, doc) {
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
                byline.pipe(transformer);

              }, function (err) {  // error for zip
                deferred.reject(err);
              });
            }

            return deferred.promise;
          };

          this.importFromFile = function (inPath, model, fileType) {
            var deferred = $q.defer();

            fileType = fileType.toLowerCase();
            if (fileType !== 'csv' && fileType !== 'json') {
              deferred.reject('Import Error: Invalid file type - ' + fileType);
            }
            else {
              if (fileType === 'csv') {
                that.importFromCSV(inPath, model).then(function (result) {
                  deferred.resolve(result)
                }, function (err) {
                  deferred.reject(err)
                });
              }
              else {
                that.importFromJSON(inPath, model).then(function (result) {
                  deferred.resolve(result)
                }, function (err) {
                  deferred.reject(err)
                });
              }
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
              outStream.write('\uFEFF'); //write the BOM so that Excel (Windows) can properly read file
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

          // exports the specified Mongoose model collection to a JSON file. Each record is a separate line in the file.
          // Parameters: outPath - the full path to the output file.
          //             model - an integer representing the Mongoose model to import to. This value can be obtained
          //
          this.exportToJSON  = function (outPath, model) {
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

              // now set up the csv and file items for piping
              outStream = fs.createWriteStream(outPath);
              outStream.on('close', function (){
                deferred.resolve(recCnt);
              });
              outStream.on('error', function (err) {
                deferred.reject('Output Error: ' + err);
              });

              // convert to JSON and remove the __v and _id properties
              transformer = csv.transform(function (record, callback){
                _removeSpecialProperties(record);
                var newRecord = JSON.stringify(record) + '\r\n';
                recCnt++;
                callback(null, newRecord);
              }, {parallel: 10});
              transformer.on('error', function (err) {
                deferred.reject('Transformer Error: ' + err);
              });

              // Now start exporting - use .lean() to return simple JSON object not model.
              mgModel.find().lean().stream().pipe(transformer).pipe(outStream);
            }

            return deferred.promise;
          };

          // Exports file as CSV or JSON depending on value of fileType parameter.
          this.exportToFile = function (outPath, model, fileType) {
            var deferred = $q.defer();

            fileType = fileType.toLowerCase();
            if (fileType !== 'csv' && fileType !== 'json') {
              deferred.reject('Export Error: Invalid file type - ' + fileType);
            }
            else {
              if (fileType === 'csv') {
                that.exportToCSV(outPath, model).then(function (result) {
                  deferred.resolve(result)
                }, function (err) {
                  deferred.reject(err)
                });
              }
              else {
                that.exportToJSON(outPath, model).then(function (result) {
                  deferred.resolve(result)
                }, function (err) {
                  deferred.reject(err)
                });
              }
            }
            return deferred.promise;
          };

          this.exportTaxes = function (outPath, startDate, endDate) {
            var deferred = $q.defer(),
                taxProps = [],
                recCnt = 0,
                outStream, stringifier, transformer;

             //Translate the properties from the tax item to German for German headings In the CSV file
            taxProps.push('Reservierung');
            taxProps.push('Von');
            taxProps.push('Bis');
            taxProps.push('Rechnung');
            taxProps.push('Zimmer');
            taxProps.push('Gast');
            taxProps.push('Netto 7');
            taxProps.push('Taxe 7');
            taxProps.push('Brutto 7');
            taxProps.push('Netto 19');
            taxProps.push('Taxe 19');
            taxProps.push('Brutto 19');
            taxProps.push('Kurtaxe Total');
            taxProps.push('Rechnung Total');

            // now set up the csv and file items for piping
            outStream = fs.createWriteStream(outPath);
            outStream.write('\uFEFF'); //write the BOM so that Excel (Windows) can properly read file
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

            // function to find bill number
            var findBill = function (record, guest, rm) {
              var bnum = 0;
              if (record.bill_numbers.length > 1) {
                record.bill_numbers.forEach(function (b) {
                  if (b.guest === guest && b.room_number === rm) {
                    bnum = b.billNo;
                  }
                });
              }
                else if (record.bill_numbers.length === 1) {
                bnum = record.bill_numbers[0].billNo;
              }
              return bnum;
            };
            // Transform the record. Extract the taxes array and create a cvs entry for each object in the array.
            // In order to handle creating multiple records, we need to push each record first then call callback
            // with no args.
            transformer = csv.transform(function (record, callback){  //pull out tax info from reservation
              if (record.taxes && record.taxes.length) {
                var cnt = 0;
                record.taxes.forEach(function (tobj) {
                  var trec = {};
                  trec[taxProps[0]] = record.reservation_number;
                  trec[taxProps[1]] = $filter('date')(record.start_date,'shortDate');
                  trec[taxProps[2]] = $filter('date')(record.end_date,'shortDate');
                  trec[taxProps[3]] = findBill(record, tobj.guest, tobj.room_number);
                  trec[taxProps[4]] = tobj.room_number;
                  trec[taxProps[5]] = tobj.guest;
                  trec[taxProps[6]] = tobj.net7;
                  trec[taxProps[7]] = tobj.tax7;
                  trec[taxProps[8]] = tobj.sum7;
                  trec[taxProps[9]] = tobj.net19;
                  trec[taxProps[10]] = tobj.tax19;
                  trec[taxProps[11]] = tobj.sum19;
                  trec[taxProps[12]] = tobj.kurtax_total;
                  trec[taxProps[13]] = tobj.bill_total;
                  transformer.push(trec);
                  cnt++;
                  recCnt++;
                });
                callback();
              }
              else { // we shouldn't get here but create an empty record for the reservation
                callback(null, {
                  reservation_number: record.reservation_number,
                  start_date:  $filter('date')(record.start_date,'shortDate'),
                  end_date:  $filter('date')(record.end_date,'shortDate')
                });
              }
            }, {parallel: 10});
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

          this.exportMailingList = function (outPath) {
            var deferred = $q.defer(),
                props = [],
                recCnt = 0,
                outStream, stringifier, transformer;

            // build heading columns
            props.push('Gast');
            props.push('Addresse');
            props.push('Platz');
            props.push('Ort');
            props.push('Land');
            props.push('Email');
            props.push('Firma');

            // now set up the csv and file items for piping
            outStream = fs.createWriteStream(outPath);
            outStream.write('\uFEFF'); //write the BOM so that Excel (Windows) can properly read file
            outStream.on('close', function (){
              deferred.resolve(recCnt);
            });
            outStream.on('error', function (err) {
              deferred.reject('Output Error: ' + err);
            });

            stringifier = csv.stringify({header: true, columns: props, rowDelimiter: 'windows'});
            stringifier.on('error', function (err) {
              deferred.reject('Sringify Error: ' + err);
            });
            stringifier.on('finished', function (err) {
              console.log('STRINGIFY FINISHED');
            });

            // Transform the record. Extract the name and address info.
            transformer = csv.transform(function (record, callback){
              var arec = {},
                  name, addr;
              
              if (record.salutation) {
                name = record.salutation + " " + record.first_name + " " + record.last_name;
              } else {
                name =  record.first_name + " " + record.last_name;
              }
              
              if (record.address2) {
                addr = record.address1 + ' ' + record.addres2;
              } else {
                addr = record.address1;
              }
              
              arec[props[0]] = name;
              arec[props[1]] = addr;
              arec[props[2]] = record.post_code;
              arec[props[3]] = record.city;
              arec[props[4]] = record.country;
              arec[props[5]] = record.email;
              arec[props[6]] = record.firm;
              recCnt++;
              callback(null, arec);
            }, {parallel: 10});
            
            transformer.on('error', function (err) {
              deferred.reject('Transformer Error:' + err);
            });
            transformer.on('finish',function() {console.log('TRANSFORMER FINISHED ' + recCnt + ' records')});

            // Query addresses-find all addresses include firms.
            Guest.find({})
                .sort({last_name: 1})
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

          this.getDefaultMailingListPath = function() {
            return  appConstants.defExportPath + '\\' + $filter('date')(new Date(), 'yyyy_MM_dd_HHmmss') + '_'
                + '_Adressenliste.csv'
          };

          this.getDefaultExportFilePath = function (mode, model, fileType) {
            var prefix = appConstants.defExportPath + '\\' + $filter('date')(new Date(), 'yyyy_MM_dd_HHmmss') + '_',
                dbPrefix = appConstants.dbPath + '\\' + $filter('date')(new Date(), 'yyyy_MM_dd_HHmmss') + '_',
                ftype = fileType ? '.' + fileType : '.zip',
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
                path = prefix + model + ftype;
            }

            return path;
          };

          this.getDefaultImportDirectory = function (model) {
            return appConstants.defExportPath;
          };

          // Returns an array of objects for the Mongoose Models that are available for import/export
          // Guest, Firm, Room, RoomPlan, Resource, Event, ItemType
          this.getAvailableModels = function () {
            return [
              {value: -1, text: '<' + configService.loctxt.select + '>', model_name: '', fileType: ''},
              {value: 0, text: configService.loctxt.addressGuest, model_name: 'Guest', fileType: 'csv'},
              {value: 1, text: configService.loctxt.firm, model_name: 'Firm', fileType: 'csv'},
              {value: 2, text: configService.loctxt.room, model_name: 'Room', fileType: 'json'},
              {value: 3, text: configService.loctxt.accommodationPlan, model_name: 'RoomPlan', fileType: 'json'},
              {value: 4, text: configService.loctxt.resource, model_name: 'Resource', fileType: 'json'},
              {value: 5, text: configService.loctxt.event, model_name: 'Event', fileType: 'json'},
              {value: 6, text: configService.loctxt.expenseItem, model_name: 'ItemType', fileType: 'json'}
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

          // Removes _id and __v fields from record. Traverses complex documents within the record
          function _removeSpecialProperties(obj) {
            for (var prop in obj) {
              if (obj.hasOwnProperty(prop)) {
                if (prop === '__v') {delete obj[prop]}
                if (prop === '_id') {delete obj[prop]}
                if (Array.isArray(obj[prop])) {
                  obj[prop].forEach(function (element) {
                    if (typeof(element) === 'object') {
                      _removeSpecialProperties(element);
                    }
                  });
                }
                else if (typeof(obj[prop]) === "object") {
                  _removeSpecialProperties(obj[prop]);
                }
              }
            }
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