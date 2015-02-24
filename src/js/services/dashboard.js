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
      function (Reservation, Guest, Room, RoomPlan, Resource, Itemtype, Firm, Event, dbEnums, datetime, $q, configService) {
    return {
      getNextDaysDate: function (dateval) {
        return datetime.dateOnly(dateval, 1);
      },
      getUpcomming: function (dateval) {
        var deferred = $q.defer();
        Reservation.find()
            .where('end_date')
            .gte(datetime.dateOnly(dateval))
            .lte(datetime.dateOnly(dateval, 1))
            .sort('end_date')
            .exec(function (err, reservations) {
              if (err) {
                deferred.reject(err);
                console.log("getUpcomming query failed: " + err);
              }
              else {
                deferred.resolve(reservations);
              }
            });
        return deferred.promise;
      },
      getArrivals: function (dateval) {
        var deferred = $q.defer();
        Reservation.find()
            .where('start_date')
            .equals(datetime.dateOnly(dateval))
            .sort('room')
            .exec(function (err, reservations) {
              if (err) {
                deferred.reject(err);
                console.log("getArrivals query failed: " + err);
              }
              else {
                deferred.resolve(reservations);
              }
            });
        return deferred.promise;
      },
      getDepartures: function (dateval) {
        var deferred = $q.defer();
        Reservation.find()
            .where('end_date')
            .equals(datetime.dateOnly(dateval))
            .sort('room')
            .exec(function (err, reservations) {
              if (err) {
                deferred.reject(err);
                console.log("getDepartures query failed: " + err);
              }
              else {
                deferred.resolve(reservations);
              }
            });
        return deferred.promise;
      },
      getReservationById: function (id) {
        var deferred = $q.defer();
        Reservation.findOne({_id: id})
            .exec(function (err, reservation) {
              if (err) {
                deferred.reject(err);
                console.log("getDepartures query failed: " + err);
              }
              else {
                deferred.resolve(reservation);
              }
            });
        return deferred.promise;
      },
      getReservationByNumber: function (resnum) {
        var deferred = $q.defer();
        Reservation.findOne({reservation_number: resnum})
            .exec(function (err, reservation) {
              if (err) {
                deferred.reject(err);
                console.log("getReservationByNumber query failed: " + err);
              }
              else {
                // searching by res number returns null if it is not found. It doesn't throw an error like searching
                // for an id. Therefore we throw our own error on null.
                if (reservation) {
                  deferred.resolve(reservation);
                }
                else {
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
        Reservation.find({checked_in: {$exists: true}, checked_out: {$exists: false}})
            .sort({end_date: 1})
            .exec(function (err, reservations) {
              if (err) {
                deferred.reject(err);
                console.log("getCurrentReservations query failed: " + err);
              }
              else {
                deferred.resolve(reservations);
              }
            });
        return deferred.promise;
      },
      getPastReservations: function (after) {
        var deferred = $q.defer();

        Reservation.find({checked_out: {$gte: after}})
            .sort({end_date: -1})
            .exec(function (err, reservations) {
              if (err) {
                deferred.reject(err);
                console.log("getPastReservations query failed: " + err);
              }
              else {
                deferred.resolve(reservations);
              }
            });
        return deferred.promise;
      },
      getNewReservationNumber: function () {
        var deferred = $q.defer();
        var yearstart = (new Date().getFullYear() - 2000) * 10000;  //Y3k bug!!!
        Reservation.find({reservation_number: {$gt: yearstart}})
            .sort({reservation_number: -1})
            .limit(1)
            .exec(function (err, res) {
              if (err) {
                deferred.reject(err);
                console.log("getNewReservationNumber query failed: " + err);
              }
              else {
                if (res.length === 0) {
                  deferred.resolve(yearstart + 1);
                }
                else {
                  deferred.resolve(res[0].reservation_number + 1);
                }
              }
            });
        return deferred.promise;
      },
      getGuestNamesIds: function () {
        var deferred = $q.defer();
        Guest.find()
            .select('_id name')
            .exec(function (err, guests) {
              if (err) {
                deferred.reject(err);
                console.log("getGuestNamesIds guery failed: " + err);
              }
              else {
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
              }
              else {
                deferred.resolve(guest);
              }
            });
        return deferred.promise;
      },
      // updates the firm for guests that are associated with a firm that's name has changed. Note: because the
      // Guest collection has a pre 'save' function, we can't just do an update, we have to do a find then save the
      // individual matches.
      updateFirmInGuests: function (oldFirm, newFirm) {
        var deferred = $q.defer();
        Guest.find({firm: oldFirm})
            .exec(function (err, guests) {
              if (err) {
                deferred.reject(err);
                console.log("updateFirmInGuests query failed: " + err);
              }
              else {
                guests.forEach(function (guest) {
                  guest.firm = newFirm;
                  guest.save();
                });
                return deferred.resolve(guests.length);
              }
            });
        return deferred.promise;
      },
      // retrieves firms based on a a full firm name.
      getFirmByName: function (name) {
        var deferred = $q.defer();
        Firm.findOne({'firm_name': name})
            .exec(function (err, firm) {
              if (err) {
                deferred.reject(err);
                console.log("getFirmByName query failed: " + err);
              }
              else {
                deferred.resolve(firm);
              }
            });
        return deferred.promise;
      },
      // retrieves guest names based on a partial name. If firm is provided, then the firm name must match. There
      // are two special search character sequences '^' and '^^' that can start the string. A single caret means
      // search the first name, a double caret means search the last name.
      guestNameLookup: function (val, firm) {
        var deferred = $q.defer(),
            clean = /[\\.\#\^\$\|\?\+\(\)\[\{\}\]*]/g, //contains all regex special characters
            specialSearch = (val.match(/^\^+/) || []).length ? val.match(/^\^+/)[0].length : 0,//look for special search chars at start of string
            qry = {},
            sort = {};

        val = val.replace(clean, ''); //remove any regex specific characters from input string, otherwise unpredictable results

        switch (specialSearch) { //build the query
          case 0:  // default match val anywhere in the unique_name field
            sort = {unique_name: 1};
            qry = firm ? {firm: firm, unique_name: { $regex: val, $options: 'i'}} : {unique_name: { $regex: val, $options: 'i' }};
            break;

          case 1:  // first_name field starts with val
            sort = {first_name: 1};
            val = '^' + val;
            qry = firm ? {firm: firm, first_name: { $regex: val, $options: 'i'}} : {first_name: { $regex: val, $options: 'i' }};
            break;

          case 2: // last_name field starts with val
            sort = {last_name: 1};
            val = '^' + val;
            qry = firm ? {firm: firm, last_name: { $regex: val, $options: 'i'}} : {last_name: { $regex: val, $options: 'i' }};
            break;
        }

        Guest.find(qry)
            .sort(sort)
            .select('_id name unique_name')
            .exec(function (err, guests) {
              if (err) {
                deferred.reject(err);
                console.log("guestNameLookup query failed: " + err);
              }
              else {
                deferred.resolve(guests);
              }
            });
        return deferred.promise;
      },
      //retrieves firms based on a partial name string. The partial string can occur anywhere in the firm name. If
      // the string is preceded with a caret '^' then the partial string will be located at the start of the firm name.
      firmNameLookup: function (val) {
        var deferred = $q.defer(),
            clean = /[\\.\#\^\$\|\?\+\(\)\[\{\}\]*]/g,  //contains all regex special characters
            special = (val.match(/^\^+/) || []).length;


        val = val.replace(clean, ''); //remove any regex specific characters from input string, otherwise unpredictable results

        if (special){  // firm name starts with val
          val = '^' + val;
        }

        Firm.find({firm_name: { $regex: val, $options: 'i' }})
            .sort({firm_name: 1})
            .exec(function (err, firms) {
              if (err) {
                deferred.reject(err);
                console.log("firmNameLookup query failed: " + err);
              }
              else {
                deferred.resolve(firms);
              }
            });
        return deferred.promise;
      },
      // find reservations during a specified date interval. Returns an array of objects containing the
      // reservation number, title, start_date, end_date, room number, room guest name, day of year of start date,
      // day of year of end date, and two flags that indicate if the reservation starts before the specified date or
      // ends after the specified date.
      findReservationsByDateRange: function(start, end) {
        var deferred = $q.defer(),
            results = {reservations: [], resources: []},
            startDoy = datetime.dayOfYear(start),
            endDoy = datetime.dayOfYear(end);

        Reservation.find({start_date: {$lt: end}, end_date: {$gt: start}})
          .sort({start_date: 1})
          .exec(function (err, resResults) {
            if (err) {
              deferred.reject(err);
              console.log("findReservationsByDateRange query 1 failed: " + err);
            }
            else {
              resResults.forEach(function (res) {
                var rstartDse = datetime.daysSinceEpoch(res.start_date),
                    rendDse = datetime.daysSinceEpoch(res.end_date);

                res.rooms.forEach(function (room) {
                  var r = {
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
                    title: res.title,
                    oneRoom: res.rooms.length === 1,
                    comments: res.comments
                  };
                  results.reservations.push(r);
                });
                res.resources.forEach(function (resource) {
                  var r = {
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

              deferred.resolve(results);
            }
          });
        return deferred.promise;
      },
      // find events during a specified date interval. Returns an array of objects containing the
      // event id, title, start_date, end_date, comments, day of year of start date,
      // day of year of end date, and two flags that indicate if the event starts before the specified date or
      // ends after the specified date.
      findEventsByDateRange: function(start, end) {
        var deferred = $q.defer(),
            results = [];

        Event.find({start_date: {$lt: end}, end_date: {$gt: start}})
            .sort({start_date: 1})
            .exec(function (err, evtResults) {
              if (err) {
                deferred.reject(err);
                console.log("findEventsByDateRange query failed: " + err);
              }
              else {
                evtResults.forEach(function (event) {
                  var eStartDse = datetime.daysSinceEpoch(event.start_date),
                      eEndDse = datetime.daysSinceEpoch(event.end_date),
                      evt = {
                              id: event._id.id,
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
        Reservation.find({start_date: {$lt: end}, end_date: {$gt: start}})
            .exec(function (err, res) {
              if (err) {
                deferred.reject(err);
                console.log("findAvailableRooms query 1 failed: " + err);
              }
              else {
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
                var qryobj = doubleOnly ? {number: {$nin: booked}, room_type: {$ne: 'Einzelzimmer'}} : {number: {$nin: booked}};
                Room.find(qryobj)
                    .sort({display_order: 1, number: 1})
                    .exec(function (err, rooms) {
                      if (err) {
                        deferred.reject(err);
                        console.log("findAvailableRooms query 2 failed: " + err);
                      }
                      else {
                        if (forlist) {
                          var defroom = new Room({number: 0});
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
        Reservation.find({start_date: {$lt: end}, end_date: {$gt: start}})
            .exec(function (err, res) {
              if (err) {
                deferred.reject(err);
                console.log("findAvailableResources query 1 failed: " + err);
              }
              else {
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
                var qryobj = {name: {$nin: booked}, resource_type: resType};
                Resource.find(qryobj)
                    .sort({display_order: 1, number: 1})
                    .exec(function (err, res) {
                      if (err) {
                        deferred.reject(err);
                        console.log("findAvailableResources query 2 failed: " + err);
                      }
                      else {
                        if (forlist) {
                          var defres = new Resource({name: '', resource_type: resType, price: -1});
                          res.unshift(defres);
                        }
                        deferred.resolve(res);
                      }
                    });
              }
            });
        return deferred.promise;
      },
      // Retrieve Room number type and class for all rooms
      getRoomListInfo: function() {
        var deferred = $q.defer();
        Room.find()
            .select('number room_type room_class display_abbr')
            .exec(function (err, rooms) {
              if (err) {
                deferred.reject(err);
                console.log("getRoomListInfo query failed: " + err);
              }
              else {
                deferred.resolve(rooms);
              }
            });

        return deferred.promise;
      },
      // Retrieve Room number type and class for all rooms
      getResourceListInfo: function() {
        var deferred = $q.defer();
        Resource.find()
            .select('name resource_type display_name')
            .exec(function (err, res) {
              if (err) {
                deferred.reject(err);
                console.log("getResourceListInfo query failed: " + err);
              }
              else {
                deferred.resolve(res);
              }
            });

        return deferred.promise;
      },
      // retrieve the room plan types filtering will be done in the vm or UI
      getRoomPlanList: function () {
        var deferred = $q.defer();
        RoomPlan.find()
            .sort({display_order: 1})
            .exec(function (err, plans) {
              if (err) {
                deferred.reject(err);
                console.log("getRoomPlanList query failed: " + err);
              }
              else {
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
              }
              else {
                deferred.resolve(plan);
              }
            });
        return deferred.promise;
      },
      //Get the room rate based on plan, from room table
      // todo-currently only returning base rate. Need to figure out how to link rate to plan type.
      getRoomRate: function (room_number, plan) {
        var deferred = $q.defer();
        Room.findOne({number: room_number})
            .exec(function (err, room) {
              if (err) {
                deferred.reject(err);
                console.log("getRoomRate query failed: " + err);
              }
              else {
                deferred.resolve(room.price.base_rate);
              }
            });
        return deferred.promise;
      },
      // Get the room rate associated with the business. Returns 0 if business not found.
      getBusinessRoomRate: function (business) {
        var deferred = $q.defer();
        Firm.findOne({firm_name: business})
            .exec(function (err, bis) {
              if (err) {
                deferred.reject(err);
                console.log("getBusinessRoomRate query failed: " + err);
              }
              else {
                deferred.resolve(bis.room_price);
              }
            });
        return deferred.promise;
      },
      // Get all item types of a specific catagory. If no parameter specified returns all ItemType documents
      getItemTypeList: function (itemType) {
        var deferred = $q.defer();
        var qry = itemType ? {category: itemType} : null;
        Itemtype.find(qry)
            .sort({display_order: 1, name: 1})
            .exec(function (err, itemtypes) {
              if (err) {
                deferred.reject(err);
                console.log("getItemTypeList query failed: " + err);
              }
              else {
                deferred.resolve(itemtypes);
              }
            });
        return deferred.promise;
      },
      // Get all item types for all categories except the category specified.
      // retrieve the room plan types, filter if business reservation
      getItemTypeListExcept: function (itemType) {
        var deferred = $q.defer();

        Itemtype.find({category: {$ne: itemType}})
            .sort({category: 1, display_order: 1})
            .exec(function (err, itemtypes) {
              if (err) {
                deferred.reject(err);
                console.log("getItemTypeListExcept query failed: " + err);
              }
              else {
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
        Itemtype.find({name: {$in: itemTypeList}, category: category})
            .sort({display_order: 1})
            .exec(function (err, itemtypes) {
              if (err) {
                deferred.reject(err);
                console.log("getItemTypesInList query failed: " + err);
              }
              else {
                deferred.resolve(itemtypes);
              }
            });
        return deferred.promise;
      }
    }
  });
});