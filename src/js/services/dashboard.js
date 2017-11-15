/**
 * Service to retrieve reservation information for various directives
 */
define(['./module'], function (services) {
  'use strict';
  //private functions available to the services
  // Strip time value off a Date object and optionally changes the date
  // by the specified number of days (+ or -). Function returns a new
  // date object, or the original object if the original object is not a Date
  // object.

  services.factory(
    'dashboard',
    function (Reservation, Guest, Room, RoomPlan, Resource, Itemtype, Firm, Event, Counters,
      dbEnums, datetime, $q, configService, $filter) {
      return {
        // Return reservations with start dates on date specified
        getArrivals: function (dateval) {
          var deferred = $q.defer();
          var qry = {
            $and: [{
              start_date: {
                $gte: datetime.dateOnly(dateval)
              }
            }, {
              start_date: {
                $lt: datetime.dateOnly(dateval, 1)
              }
            }]
          };
          Reservation.find(qry)
            .sort('room')
            .exec(function (err, reservations) {
              if (err) {
                deferred.reject(err);
                console.log("getArrivals query failed: " + err);
              } else {
                deferred.resolve(reservations);
              }
            });
          return deferred.promise;
        },
        // Return reservations with end dates on date specified
        getDepartures: function (dateval) {
          var deferred = $q.defer();
          var qry = {
            $and: [{
              end_date: {
                $gte: datetime.dateOnly(dateval)
              }
            }, {
              end_date: {
                $lt: datetime.dateOnly(dateval, 1)
              }
            }]
          };
          Reservation.find(qry)
            .sort('room')
            .exec(function (err, reservations) {
              if (err) {
                deferred.reject(err);
                console.log("getDepartures query failed: " + err);
              } else {
                deferred.resolve(reservations);
              }
            });
          return deferred.promise;
        },
        getReservationById: function (id) {
          var deferred = $q.defer();
          Reservation.findOne({
              _id: id
            })
            .exec(function (err, reservation) {
              if (err) {
                deferred.reject(err);
                console.log("getDepartures query failed: " + err);
              } else {
                deferred.resolve(reservation);
              }
            });
          return deferred.promise;
        },
        getReservationByNumber: function (resnum) {
          var deferred = $q.defer();
          Reservation.findOne({
              reservation_number: resnum
            })
            .exec(function (err, reservation) {
              if (err) {
                deferred.reject(err);
                console.log("getReservationByNumber query failed: " + err);
              } else {
                // searching by res number returns null if it is not found. It doesn't throw an error like searching
                // for an id. Therefore we throw our own error on null.
                if (reservation) {
                  deferred.resolve(reservation);
                } else {
                  var errs = configService.loctxt.reservation + ': ' + resnum + ' ' + configService.loctxt.notFound;
                  console.log(errs);
                  deferred.reject(errs);
                }
              }
            });
          return deferred.promise;
        },
        getCurrentReservations: function () {
          var deferred = $q.defer();
          Reservation.find({
              checked_in: {
                $exists: true
              },
              checked_out: {
                $exists: false
              }
            })
            .sort({
              end_date: 1
            })
            .exec(function (err, reservations) {
              if (err) {
                deferred.reject(err);
                console.log("getCurrentReservations query failed: " + err);
              } else {
                deferred.resolve(reservations);
              }
            });
          return deferred.promise;
        },
        getPastReservations: function (after) {
          var deferred = $q.defer();

          Reservation.find({
              checked_out: {
                $gte: after
              }
            })
            .sort({
              end_date: -1
            })
            .exec(function (err, reservations) {
              if (err) {
                deferred.reject(err);
                console.log("getPastReservations query failed: " + err);
              } else {
                deferred.resolve(reservations);
              }
            });
          return deferred.promise;
        },
        /**
         * Retrieves the next reservation number sequence and saves it in the reservation
         * number counter record (counters collection). It tests to see if the
         * new value is less than the yearStart value which would be the first counter value
         * for the current year. If so then we update the current count to the yearStart
         * value. The reservation number is in YY0000 format where YY are the last two
         * digits of the current year.
         */
        getNewReservationNumber: async function () {
          try {
            let yearStart = (new Date().getFullYear() - 2000) * 10000; //Y3k bug!!!

            let cntr = await Counters.findOneAndUpdate({
              counter: configService.constants.resNumberID
            }, {
              $inc: {
                seq: 1
              }
            }, {
              new: true,
              upsert: true
            });

            if (cntr.seq < yearStart) {
              cntr = await Counters.findOneAndUpdate({
                counter: configService.constants.resNumberID
              }, {
                seq: yearStart
              }, {
                new: true
              });
            }
            return cntr.seq;
          } catch (err) {
            console.log("getNewReservationNumber query failed: " + err);
            throw err;
          }
        },
        /**
         * Retrieves the next bill number in the bill number sequence and updates the seq
         * property of the bill number record with the new value. If the record does not
         * exist it will seed the counter with the billNoSeed value.
         */
        getNewBillNumber: async function () {
          try {
            let cntr = await Counters.findOneAndUpdate({
              counter: configService.constants.billNumberID
            }, {
              $inc: {
                seq: 1
              }
            }, {
              new: true,
              upsert: true
            });

            if (cntr.seq < configService.constants.billNoSeed) {
              cntr = await Counters.findOneAndUpdate({
                counter: configService.constants.billNumberID
              }, {
                seq: configService.constants.billNoSeed
              }, {
                new: true
              });
            }
            return cntr.seq;
          } catch (err) {
            console.log("getNewReservationNumber query failed: " + err);
            throw err;
          }
        },
        getGuestNamesIds: function () {
          var deferred = $q.defer();
          Guest.find()
            .select('_id name')
            .exec(function (err, guests) {
              if (err) {
                deferred.reject(err);
                console.log("getGuestNamesIds guery failed: " + err);
              } else {
                deferred.resolve(guests);
              }
            });
          return deferred.promise;
        },
        getGuestById: function (id) {
          var deferred = $q.defer();
          Guest.findById(id)
            .exec(function (err, guest) {
              if (err) {
                deferred.reject(err);
                console.log("getGuestById query failed: " + err);
              } else {
                deferred.resolve(guest);
              }
            });
          return deferred.promise;
        },
        // updates the firm for guests that are associated with a firm that's name has changed. Note: because the
        // Guest collection has a pre 'save' function, we can't just do an update, we have to do a find then save the
        // individual matches.
        updateFirmInGuests: async function (oldFirm, newFirm) {
          try {
            let guests = await Guest.find({
              firm: oldFirm
            });
            for (let i = 0; i < guests.length; i++) {
              let g = guests[i];
              g.firm = newFirm;
              await g.save();
            }
            return guests.length;

          } catch (err) {
            throw new Error("updateFirmInGuests query failed: " + err)
          }
        },
        /**
         * Updates all reservations with the specified firm and firm addresses.
         * If oldFirm is specified then we search for reservations with the old name and
         * the firm name will be updated with the newFirm name.
         */
        updateFirmInReservations: async function (oldFirmName, firmRecord) {
          try {
            let findName = oldFirmName ? oldFirmName : firmRecord.firm_name;
            let reservations = await Reservation.find({
              $and: [{
                firm: findName
              }, {
                checked_out: {
                  $exists: false
                }
              }]
            });
            for (let i = 0; i < reservations.length; i++) {
              let r = reservations[i];
              r.firm = firmRecord.firm_name;
              r.address1 = firmRecord.address1;
              r.address2 = firmRecord.address2;
              r.city = firmRecord.city;
              r.post_code = firmRecord.post_code;
              r.country = firmRecord.country;
              await r.save();
            }
            return reservations.length;

          } catch (err) {
            throw new Error("updateFirmInReservations query failed: " + err)
          }
        },
        // retrieves firms based on a a full firm name.
        getFirmByName: function (name) {
          var deferred = $q.defer();
          Firm.findOne({
              'firm_name': name
            })
            .exec(function (err, firm) {
              if (err) {
                deferred.reject(err);
                console.log("getFirmByName query failed: " + err);
              } else {
                deferred.resolve(firm);
              }
            });
          return deferred.promise;
        },
        // retrieves guest names based on a partial name. If firm is provided, then the firm name must match. There
        // are two special search character sequences '^' and '^^' that can start the string. A single caret means
        // search the first name, a double caret means search the last name.  Also if val starts with ?? and there is a
        // firm name
        guestNameLookup: function (val, firm) {
          var deferred = $q.defer(),
            clean = /[\\.\#\^\$\|\?\+\(\)\[\{\}\]*]/g, //contains all regex special characters
            specialSearch = (val.match(/^\^+/) || []).length ? val.match(/^\^+/)[0].length : 0, //look for special search chars at start of string
            allFirmNames = (firm && firm.trim().length) && (val.trim() === '?'),
            qry = {},
            sort = {};

          if (allFirmNames) { // search for all names associated with the specified firm
            specialSearch = 10;
          }

          val = val.replace(clean, ''); //remove any regex specific characters from input string, otherwise unpredictable results
          if (val.length || specialSearch === 10) {
            switch (specialSearch) { //build the query
              case 0: // default match val anywhere in the unique_name field
                sort = {
                  unique_name: 1
                };
                qry = firm ? {
                  firm: firm,
                  unique_name: {
                    $regex: val,
                    $options: 'i'
                  }
                } : {
                  unique_name: {
                    $regex: val,
                    $options: 'i'
                  }
                };
                break;

              case 1: // (^) first_name field starts with val
                sort = {
                  first_name: 1
                };
                val = '^' + val;
                qry = firm ? {
                  firm: firm,
                  first_name: {
                    $regex: val,
                    $options: 'i'
                  }
                } : {
                  first_name: {
                    $regex: val,
                    $options: 'i'
                  }
                };
                break;

              case 2: // (^^) last_name field starts with val
                sort = {
                  last_name: 1
                };
                val = '^' + val;
                qry = firm ? {
                  firm: firm,
                  last_name: {
                    $regex: val,
                    $options: 'i'
                  }
                } : {
                  last_name: {
                    $regex: val,
                    $options: 'i'
                  }
                };
                break;
              case 10: // (?) retrieve all names associated with the firm
                sort = {
                  last_name: 1
                };
                qry = {
                  firm: firm
                };
            }

            Guest.find(qry)
              .sort(sort)
              //.select('_id name unique_name') -can't select just virtual fields!! if they are calculated from fields that aren't returned in model
              .exec(function (err, guests) {
                if (err) {
                  deferred.reject(err);
                  console.log("guestNameLookup query failed: " + err);
                } else {
                  deferred.resolve(guests);
                }
              });
          } else {
            deferred.resolve([]);
          }
          return deferred.promise;
        },
        //retrieves firms based on a partial name string. The partial string can occur anywhere in the firm name. If
        // the string is preceded with a caret '^' then the partial string will be located at the start of the firm name.
        firmNameLookup: function (val) {
          var deferred = $q.defer(),
            clean = /[\\.\#\^\$\|\?\+\(\)\[\{\}\]*]/g, //contains all regex special characters
            special = (val.match(/^\^+/) || []).length;


          val = val.replace(clean, ''); //remove any regex specific characters from input string, otherwise unpredictable results

          if (special) { // firm name starts with val
            val = '^' + val;
          }

          Firm.find({
              firm_name: {
                $regex: val,
                $options: 'i'
              }
            })
            .sort({
              firm_name: 1
            })
            .exec(function (err, firms) {
              if (err) {
                deferred.reject(err);
                console.log("firmNameLookup query failed: " + err);
              } else {
                deferred.resolve(firms);
              }
            });
          return deferred.promise;
        },
        //finds all of the reservations that start within the specified month and year. We will split the reservations
        // out for multiple room-individual bill reservations and single room-individual bill reservations where there are
        // two occupants.
        getReservationsInMonth: function (month, year) {
          var deferred = $q.defer(),
            startmonth = new Date(year, month, 1),
            endmonth = new Date(year, month + 1, 0),
            results = [],
            findPlan = function (id, plan) {
              var ix = -1;
              for (var i = 0; i < plan.length; i++) {
                if (plan[0]._id === id) {
                  ix = i;
                  break;
                }
              }
              return ix !== -1 ? plan[ix] : plan[0]; //if can't find then default to standard
            },
            buildRec = function (rec, guest, room) {
              var guestName;
              var cnt = 0;

              if (guest && typeof guest.hasOwnProperty('name')) {
                guestName = guest.name;
              } else {
                guestName = rec.guest.name;
              }

              room = room || rec.rooms[0];
              rec.rooms.forEach(function (r) {
                cnt += r.guest_count;
              });
              return {
                resNum: rec.reservation_number,
                start: $filter('date')(rec.start_date, 'shortDate'),
                end: $filter('date')(rec.end_date, 'shortDate'),
                nights: datetime.getNightsStayed(rec.start_date, rec.end_date),
                room: room.number,
                guest: guestName,
                type: rec.type,
                canEdit: !room.isCheckedOut,
                canCheckIn: !room.isCheckedIn && datetime.dateCompare(rec.start_date, new Date()) === 0,
                lateCheckIn: !room.isCheckedIn && datetime.dateCompare(rec.start_date, new Date()) < 0,
                lateCheckOut: !room.isCheckedOut && datetime.dateCompare(new Date(), rec.end_date) > 0,
                canCancel: !rec.checked_in,
                canCancelIf: rec.checked_in && !rec.checked_out,
                rcount: rec.rooms.length,
                guestCount: cnt
              };
            };

          // need to get some information from the room plans first
          RoomPlan.find().lean().select('_id is_group one_bill, one_room, one_bill').exec(function (err, plans) {
            if (err) {
              deferred.reject(err);
            } else {
              Reservation.find({
                  $and: [{
                    start_date: {
                      $gte: startmonth
                    }
                  }, {
                    start_date: {
                      $lte: endmonth
                    }
                  }]
                })
                .lean()
                .sort({
                  start_date: 1
                })
                .exec(function (err, resResults) {
                  if (err) {
                    deferred.reject(err);
                    console.log("getReservationsInMonth query 1 failed: " + err);
                  } else {
                    // break out reservations based on type:
                    // standard - just one line
                    // business-one room - line for each guest in room
                    // kur - line for each guest in room
                    // group-bus. - one line for each room and guest in room
                    // group-travel - one line, list room # as comma separated string
                    resResults.forEach(function (res) {
                      var plan = findPlan(res.plan_code, plans);
                      if (plan.one_room) {
                        results.push(buildRec(res));
                        if (!plan.one_bill && res.occupants === 2) {
                          results.push(buildRec(res, res.guest2));
                        }
                      } else if (!plan.one_room && plan.one_bill) {
                        results.push(buildRec(res));
                      } else {
                        res.rooms.forEach(function (rm) {
                          results.push(buildRec(res, rm.guest, rm));
                          if (rm.guest_count === 2) {
                            results.push(buildRec(res, rm.guest2, rm));
                          }
                        });
                      }
                    });
                    deferred.resolve(results);
                  }
                });
            }
          });

          return deferred.promise;
        },
        /**
         * find reservations during a specified date interval. Returns an array of objects on a per-room basis containing the
         * reservation number, title, start_date, end_date, room number, room guest name, day of year of start date,
         * day of year of end date, and two flags that indicate if the reservation starts before the specified date or
         * ends after the specified date. Also returns an array of any resources 
         * @param {Date} start - starting date (time part ignored) of date range
         * @param {Date} end - ending date  (time part ignored) of date range
         * 
         */
        findReservationsByDateRange: async function (start, end) {
          try {
            let results = {
                reservations: [],
                resources: []
              },
              startDoy = datetime.dayOfYear(start),
              endDoy = datetime.dayOfYear(end);

            let resResults = await Reservation.find({
              $and: [{
                start_date: {
                  $lt: datetime.lastSecondUTC(end)
                }
              }, {
                end_date: {
                  $gt: datetime.lastSecondUTC(start)
                }
              }]
            }).sort({
              start_date: 1
            }).exec();
            resResults.forEach(function (res) {
              let rstartDse = datetime.daysSinceEpoch(res.start_date),
                rendDse = datetime.daysSinceEpoch(res.end_date);

              res.rooms.forEach(function (room) {
                let r = {
                  reservation_number: res.reservation_number,
                  start_date: res.start_date,
                  start_dse: rstartDse,
                  end_date: res.end_date,
                  end_dse: rendDse,
                  room: room.number,
                  guest: room.guest,
                  guest2: room.guest2,
                  before_start: rstartDse < startDoy,
                  after_end: rendDse > endDoy,
                  nights: res.nights,
                  price: room.price,
                  status: res.checked_out ? 1 : res.checked_in ? 0 : -1,
                  title: res.title,
                  oneRoom: res.rooms.length === 1,
                  comments: res.comments
                };
                results.reservations.push(r);
              });
              res.resources.forEach(function (resource) {
                let r = {
                  resource_name: resource.name,
                  reservation_number: res.reservation_number,
                  start_date: res.start_date,
                  start_dse: rstartDse,
                  end_date: res.end_date,
                  end_dse: rendDse,
                  room: resource.room_number,
                  guest: resource.guest,
                  before_start: rstartDse < startDoy,
                  after_end: rendDse > endDoy,
                  nights: res.nights,
                  title: res.title,
                  oneRoom: res.rooms.length === 1
                };
                results.resources.push(r);
              });
            });
            return results;
          } catch (err) {
            console.log("findReservationsByDateRange query 1 failed: " + err);
            throw err;
          }
        },
        /**
         * Async function that generates the raw data needed to calculate various hotel metrics
         * such as % Occupancy, Average Daily Rate and Revenue Per Available Room. It retrieves
         * the daily occupied room data for all reservations over a specified time interval. 
         * It calculates occupied room totals and revenue for each day in the time period.
         * @param {Date} startDate  - starting date (time part ignored) of date range
         * @param {Date} endDate - ending date  (time part ignored) of date range 
         * @returns {object} An object with the following properties:
         * {
         *    startDate: - starting date of the time interval of interest
         *    endDate: - ending date of the time interval of interest
         *    dataMap: - a Map object with the key being the DSE (days since unix epoch)
         *               of each day in the time interval, and the value being a simple
         *               object containing the following properties:
         *               {
         *                  rSum: - the revenue (price sum) of occupied rooms (checked in or out)
         *                  rCnt: - the number of occupied rooms (checked in or out)
         *                  rfSum: - the potential revenue of occupied rooms (not checked in yet)
         *                  rfCnt: - the count of reserved rooms (not checked in yet)
         *               }
         * }
         */
        findResDailyStatistics: async function (startDate, endDate) {
          try {
            const ds = datetime.daysSinceEpoch(startDate);
            const de = datetime.daysSinceEpoch(endDate);
            const excludedRooms = configService.constants.getExcludedRooms();
            const totalRooms = await Room.count() - excludedRooms.length;

            // Initialize the reservations statistics data map
            let resMap = new Map();
            for (let d = ds; d <= de; d++) {
              resMap.set(d, {
                rSum: 0,
                rCnt: 0,
                rfSum: 0,
                rfCnt: 0
              }); //add room sum$
            }
            // query reservations, return only data needed
            let resResults = await Reservation.find({
              $and: [{
                start_date: {
                  $lt: datetime.lastSecondUTC(endDate)
                }
              }, {
                end_date: {
                  $gt: datetime.lastSecondUTC(startDate)
                }
              }]
            }, {
              start_date: 1,
              end_date: 1,
              checked_in: 1,
              checked_out: 1,
              rooms: 1
            });
            // Build the daily data for all reserved rooms 
            resResults.forEach(function (res) {
              let rStartDse = datetime.daysSinceEpoch(res.start_date)
              let rEndDse = datetime.daysSinceEpoch(res.end_date);
              res.rooms.forEach((r) => {
                if (!excludedRooms.includes(r.room)) { //don't process excluded 'fake' rooms
                  let ds = rStartDse
                  while (ds < rEndDse) {
                    if (resMap.has(ds)) { //ignore days of res that are outside of time range (not in map)
                      let dVal = resMap.get(ds);
                      if (res.checked_in) { //active or past reservation
                        dVal.rSum += r.price;
                        dVal.rCnt++;
                      } else { //future or abandoned reservation
                        dVal.rfSum += r.price;
                        dVal.rfCnt++;
                      }
                    }
                    ds++;
                  }
                }
              });
            });
            return {startDate: startDate, endDate: endDate, totalRooms: totalRooms, dataMap: resMap};
          } catch (err) {
            console.log("findReservationsByDateRange query 1 failed: " + err);
            throw err;
          }
        },
        // find events during a specified date interval. Returns an array of objects containing the
        // event id, title, start_date, end_date, comments, day of year of start date,
        // day of year of end date, and two flags that indicate if the event starts before the specified date or
        // ends after the specified date.
        findEventsByDateRange: function (start, end) {
          var deferred = $q.defer(),
            results = [];

          Event.find({
              start_date: {
                $lt: end
              },
              end_date: {
                $gt: start
              }
            })
            .sort({
              start_date: 1
            })
            .exec(function (err, evtResults) {
              if (err) {
                deferred.reject(err);
                console.log("findEventsByDateRange query failed: " + err);
              } else {
                evtResults.forEach(function (event) {
                  var eStartDse = datetime.daysSinceEpoch(event.start_date),
                    eEndDse = datetime.daysSinceEpoch(event.end_date),
                    evt = {
                      id: event._id,
                      title: event.title,
                      start_date: event.start_date,
                      start_dse: eStartDse,
                      end_date: event.end_date,
                      end_dse: eEndDse,
                      comments: event.comments
                    };
                  results.push(evt);
                });

                deferred.resolve(results);
              }
            });
          return deferred.promise;
        },
        // Find free rooms by finding the rooms for all reservations that
        // overlap the specified dates and then
        // returning the list of rooms not in the set.
        // If doubleOnly is true then we ignore single rooms.
        // If forlist is true then an empty Room object is added at the top of the list
        // with a room number of 0. This will create a Room object that returns a default display_name
        // value as determined in the Room schema.
        // The currentResNumber parameter, if provided will exclude any rooms from the booked list that
        // are currently associated with the reservation. Technically a reservations booked rooms should
        // be available to itself.
        findAvailableRooms: function (start, end, doubleOnly, forlist, currentResNumber) {
          var deferred = $q.defer();
          Reservation.find({
              start_date: {
                $lt: end
              },
              end_date: {
                $gt: start
              }
            })
            .exec(function (err, res) {
              if (err) {
                deferred.reject(err);
                console.log("findAvailableRooms query 1 failed: " + err);
              } else {
                //get a list of the rooms that don't work
                var booked = [];
                if (res.length > 0) {
                  angular.forEach(res, function (item) {
                    if (!currentResNumber || currentResNumber !== item.reservation_number) { //skip current res's rooms
                      angular.forEach(item.rooms, function (room) {
                        booked.push(room.number);
                      });
                    }
                  });
                }
                console.log("Booked: " + booked.length);
                // then perform a "not-in" query on rooms
                var qryobj = doubleOnly ? {
                  number: {
                    $nin: booked
                  },
                  room_type: {
                    $ne: 'Einzelzimmer'
                  }
                } : {
                  number: {
                    $nin: booked
                  }
                };
                Room.find(qryobj)
                  .sort({
                    display_order: 1,
                    number: 1
                  })
                  .exec(function (err, rooms) {
                    if (err) {
                      deferred.reject(err);
                      console.log("findAvailableRooms query 2 failed: " + err);
                    } else {
                      if (forlist) {
                        var defroom = new Room({
                          number: 0
                        });
                        rooms.unshift(defroom);
                      }
                      deferred.resolve(rooms);
                    }
                  });
              }
            });
          return deferred.promise;
        },
        // find bookable resources such as parking places available between the specified dates
        findAvailableResources: function (start, end, resType, forlist, currentResNumber) {
          var deferred = $q.defer();
          Reservation.find({
              start_date: {
                $lt: end
              },
              end_date: {
                $gt: start
              }
            })
            .exec(function (err, res) {
              if (err) {
                deferred.reject(err);
                console.log("findAvailableResources query 1 failed: " + err);
              } else {
                //get a list of the parking places that don't work
                var booked = [];
                if (res.length > 0) {
                  angular.forEach(res, function (item) {
                    if (!currentResNumber || currentResNumber !== item.reservation_number) { //skip current res's resources
                      angular.forEach(item.resources, function (res) {
                        if (res.resource_type === resType) {
                          booked.push(res.name);
                        }
                      });
                    }
                  });
                }
                console.log(resType + " Booked: " + booked.length);
                // then perform a "not-in" query on resources of the specified type
                var qryobj = {
                  name: {
                    $nin: booked
                  },
                  resource_type: resType
                };
                Resource.find(qryobj)
                  .sort({
                    display_order: 1,
                    number: 1
                  })
                  .exec(function (err, res) {
                    if (err) {
                      deferred.reject(err);
                      console.log("findAvailableResources query 2 failed: " + err);
                    } else {
                      if (forlist) {
                        var defres = new Resource({
                          name: '',
                          resource_type: resType,
                          price: -1
                        });
                        res.unshift(defres);
                      }
                      deferred.resolve(res);
                    }
                  });
              }
            });
          return deferred.promise;
        },
        // Retrieve Room number type and class for all rooms, orders by room number
        getRoomListInfo: function () {
          var deferred = $q.defer();
          Room.find()
            .sort({
              number: 1
            })
            .select('number room_type room_class display_abbr')
            .exec(function (err, rooms) {
              if (err) {
                deferred.reject(err);
                console.log("getRoomListInfo query failed: " + err);
              } else {
                deferred.resolve(rooms);
              }
            });

          return deferred.promise;
        },
        // Retrieve Room number type and class for all rooms
        getResourceListInfo: function () {
          var deferred = $q.defer();
          Resource.find()
            .select('name resource_type display_name')
            .exec(function (err, res) {
              if (err) {
                deferred.reject(err);
                console.log("getResourceListInfo query failed: " + err);
              } else {
                deferred.resolve(res);
              }
            });

          return deferred.promise;
        },
        // retrieve the room plan types filtering will be done in the vm or UI
        getRoomPlanList: function () {
          var deferred = $q.defer();
          RoomPlan.find()
            .sort({
              display_order: 1
            })
            .exec(function (err, plans) {
              if (err) {
                deferred.reject(err);
                console.log("getRoomPlanList query failed: " + err);
              } else {
                deferred.resolve(plans);
              }
            });
          return deferred.promise;
        },
        // retrieve the room plan types filtering will be done in the vm or UI
        getRoomPlanById: function (id) {
          var deferred = $q.defer();
          RoomPlan.findById(id)
            .exec(function (err, plan) {
              if (err) {
                deferred.reject(err);
                console.log("getRoomPlanById query failed: " + err);
              } else {
                deferred.resolve(plan);
              }
            });
          return deferred.promise;
        },
        //Get the room rate based on plan, from room table
        // todo-currently only returning base rate. Need to figure out how to link rate to plan type.
        getRoomRate: function (room_number, plan) {
          var deferred = $q.defer();
          Room.findOne({
              number: room_number
            })
            .exec(function (err, room) {
              if (err) {
                deferred.reject(err);
                console.log("getRoomRate query failed: " + err);
              } else {
                deferred.resolve(room.price.base_rate);
              }
            });
          return deferred.promise;
        },
        // Get the room rate associated with the business. Returns 0 if business not found.
        getBusinessRoomRate: function (business) {
          var deferred = $q.defer();
          Firm.findOne({
              firm_name: business
            })
            .exec(function (err, bis) {
              if (err) {
                deferred.reject(err);
                console.log("getBusinessRoomRate query failed: " + err);
              } else {
                deferred.resolve(bis.room_price);
              }
            });
          return deferred.promise;
        },
        // Get all item types of a specific catagory. If no parameter specified returns all ItemType documents
        getItemTypeList: function (itemType) {
          var deferred = $q.defer();
          var qry = itemType ? {
            category: itemType
          } : null;
          Itemtype.find(qry)
            .sort({
              display_order: 1,
              name: 1
            })
            .exec(function (err, itemtypes) {
              if (err) {
                deferred.reject(err);
                console.log("getItemTypeList query failed: " + err);
              } else {
                deferred.resolve(itemtypes);
              }
            });
          return deferred.promise;
        },
        // Get all item types for all categories except the category specified.
        // retrieve the room plan types, filter if business reservation
        getItemTypeListExcept: function (itemType) {
          var deferred = $q.defer();

          Itemtype.find({
              category: {
                $ne: itemType
              }
            })
            .sort({
              category: 1,
              display_order: 1
            })
            .exec(function (err, itemtypes) {
              if (err) {
                deferred.reject(err);
                console.log("getItemTypeListExcept query failed: " + err);
              } else {
                deferred.resolve(itemtypes);
              }
            });
          return deferred.promise;
        },
        // Retrieve all ItemType items specified in the list of names of item types to retrieve.
        // If the category parameter is not specified it will default to the first item in the itemTypeEnum ('Plan')
        getItemTypesInList: function (itemTypeList, category) {
          var deferred = $q.defer();
          if (!category) {
            category = dbEnums.getItemTypeEnum()[0];
          }
          Itemtype.find({
              name: {
                $in: itemTypeList
              },
              category: category
            })
            .sort({
              display_order: 1
            })
            .exec(function (err, itemtypes) {
              if (err) {
                deferred.reject(err);
                console.log("getItemTypesInList query failed: " + err);
              } else {
                deferred.resolve(itemtypes);
              }
            });
          return deferred.promise;
        },
        // Retrieve a list of plans that use a specified plan expense item.
        /*      getPlansUsingItem: function (itemName) {
                var deferred = $q.defer();
                RoomPlan.find({required_items: itemName})
                    .exec(function (err, plans) {
                      if (err) {
                        deferred.reject(err);
                        console.log("getPlansUsingItem query failed: " + err);
                      }
                      else {
                        deferred.resolve(plans);
                      }
                    });
                return deferred.promise;
              },*/
        // retrieve item types that are associated with package plans, returns all item types
        getPackagePlanItemTypes: function () {
          var deferred = $q.defer(),
            types = configService.constants.getPackageItemCodes();

          Itemtype.find({
              bill_code: {
                $in: types
              }
            })
            .sort({
              display_order: 1
            })
            .exec(function (err, itemtypes) {
              if (err) {
                deferred.reject(err);
                console.log("getPackagePlanItemTypes query failed: " + err);
              } else {
                deferred.resolve(itemtypes);
              }
            });
          return deferred.promise;
        },
        getPackagePlanItemDefaultObj: function (bill_code) {
          return Itemtype.planExpenseItemDefaults(bill_code);
        },
        getRoomPlanPackageDefaultObj: function (resType) {
          return RoomPlan.packagePlanDefaults(resType);
        }

      }
    });
});