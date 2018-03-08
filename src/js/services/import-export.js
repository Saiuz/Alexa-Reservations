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
      ['$q', 'appConstants', '$filter', 'Itemtype', 'RoomPlan', 'Firm', 'Guest', 'Room', 'Resource', 'Event',
        'Reservation', 'TaxItem', 'configService', 'fileExecUtil', 'datetime',
        function ($q, appConstants, $filter, Itemtype, RoomPlan, Firm, Guest, Room, Resource, Event, Reservation,
                  TaxItem, configService, fileExecUtil, datetime) {

          var fs = require('fs'),
              decomp = require('decompress'),
              sys = require('sys'),
              csv = require('csv'),
              byLine = require('byline'),
              that = this,
              validModels = [Guest, Firm, Room, RoomPlan, Resource, Event, Itemtype]; //models available for import/export

          /**
           * DEPRECATED method, imports not allowed with MongoDB
           * via the app.
           */
          this.importAll = function (fpath) {
            var deferred = $q.defer();
            deferred.resolve(0);
            // First archive existing files in place, then restore by overwriting
            // this.exportAll(this.getDefaultExportFilePath('db')).then(function () {
            //   db.dbDisconnect(function () {  //once closed, extract files
            //     decomp(fpath,appConstants.dbPath).then(function(f) {
            //       db.dbReconnect(); // Reconnect no matter what.
            //       console.log('Done. Extracted db files: ' + f.length);
            //       deferred.resolve(f.length);
            //     }, function(err) {
            //       deferred.reject('Error: ' + err);
            //     });
            //   });
            // }, function (err) {
            //   db.dbReconnect(); // Reconnect no matter what.
            //   deferred.reject(err);
            // });

            return deferred.promise;
          };

          /**
           * This uses the MongoDB utility 'mongodump' to export the complete database in 
           * binary format into a single archive file. It requires that the MongoDB utility be part of this apps distribution
           * and will execute the utility in a child process. The user gets to specifiy the directory
           * the archive file will be placed in but not the file name.
           */
          this.exportAll = async function (outPath) {
            try {
              console.log('Exporting complete database...')
              let results = await fileExecUtil.execCmd(appConstants.dbDumpCmd(outPath));
              console.log('DB dump output: ' + results);
              console.log(`Export Done`);
              return 0;
            } catch (err) {
              throw err;
            }
          };

          /**
           * DEPRECATED METHOD, imports not allowed with MongoDB via the app.
           */
          // imports a CSV file into the specified Mongoose Model. It will make a Zip backup before importing.
          // Parameters: inPath - full path to the CSV file that will be imported.
          //             model - an integer representing the Mongoose model to import to. This value can be obtained
          //                     from the getAvailableModels method that can be used by the UI to populate a dropdown.
          this.importFromCSV = function (inPath, model) {
            let deferred = $q.defer();
            deferred.resolve(0);
            return deferred.promise;
          };

          /**
           * DEPRECATED Method
           */
          // imports a JSON file into the specified Mongoose Model. It will make a Zip backup before importing.
          // Parameters: inPath - full path to the JSON file that will be imported.
          //             model - an integer representing the Mongoose model to import to. This value can be obtained
          //
          this.importFromJSON = function (inPath, model) {
            let deferred = $q.defer();
            deferred.resolve(0);    
            return deferred.promise;
          };

          this.importFromFile = function (inPath, model, fileType) {
            let deferred = $q.defer();
            deferred.resolve(0);    
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
              }, {parallel: 1});
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
              }, {parallel: 1});
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

          this.exportMailingList = function (outPath) {
            var deferred = $q.defer(),
                props = [],
                recCnt = 0,
                outStream, stringifier, transformer;

            // build heading columns
            props.push('MC');
            props.push('Name1');
            props.push('Name2');
            props.push('Strasse');
            props.push('Platz');
            props.push('Ort');
            props.push('AnredeU');
            props.push('Letzter Aufenthalt');
            props.push('Email');

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
              let arec = {};
             
              let name =  `${record.first_name || ' '} ${record.last_name || ' '}`.replace(/\s\s+/g, ' ').trim();
              let addr = `${record.address1 || ' '} ${record.address2 || ' '}`.replace(/\s\s+/g, ' ').trim();
          
              if (addr && /^[0-9]*$/g.test(record.post_code)) {
              arec[props[0]] = record.last_name;
              arec[props[1]] = name;
              arec[props[2]] = record.partner_name;
              arec[props[3]] = addr;
              arec[props[4]] = postPad(record.post_code, 5);
              arec[props[5]] = record.city;
              arec[props[6]] = record.salutation;
              arec[props[7]] = datetime.toDeDateString(record.last_stay);
              arec[props[8]] = record.email;
            } else {
                arec = null;
              }
              recCnt++;
              callback(null, arec);
            }, {parallel: 1});

            //pads number with leading zeros and returns a quoted string for Excel to interpret as a string
            function postPad(num, size)  { 
              num = num || 0;
              let s = String(num);
              while (s.length < (size || 2)) {s = "0" + s;}
              return `="${s}"`;
            };

            transformer.on('error', function (err) {
              deferred.reject('Transformer Error:' + err);
            });
            transformer.on('finish',function() {console.log('TRANSFORMER FINISHED ' + recCnt + ' records')});

            // Query addresses-find all addresses without firms and that have postcodes.
            let gQry = {$and: [{firm: ''},{post_code: {$exists: true}},{$or:[{country: {$exists: false}},{country: ''}, {country: 'Deutschland'}]}]};
            Guest.find(gQry)
                .sort({post_code: 1, last_name: 1})
                .lean()
                .stream()
                .pipe(transformer)
                .pipe(stringifier)
                .pipe(outStream);
            return deferred.promise;
          };

          this.getDefaultTaxFilePath = function(startDate, endDate) {
            let name = `Steuern_${$filter('date')(startDate, 'yyyyMMdd')}_${$filter('date')(endDate, 'yyyyMMdd')}.csv`;
           return  fileExecUtil.pathJoin(appConstants.defExportPath,name);
          };

          this.getDefaultMailingListPath = function() {
            let name = `Addressliste_${$filter('date')(new Date(), 'yyyyMMdd')}.csv`;
            return  fileExecUtil.pathJoin(appConstants.defExportPath,name);
          };

          this.getDbExportFilePath = (dirPath) => {
            let name = `${appConstants.dbName}_${$filter('date')(new Date(), 'yyyyMMdd')}.archive`;
            return fileExecUtil.pathJoin(dirPath,name);
          }

          this.getDefaultExportFilePath = function (model, ext) {

            model = (model || appConstants.dbName);
            ext = (ext || 'archive');
            ext = ext.startsWith('.') ? ext : '.' + ext;
            let name = `${model}_${$filter('date')(new Date(), 'yyyyMMdd')}${ext}`;
            return fileExecUtil.pathJoin(appConstants.defExportPath,name);
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