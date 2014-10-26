/**
 * Service to retrieve reservation statistics for the dashboard
 */
define(['./module'], function (services) {
  'use strict';
  //private functions available to the services
  // Strip time value off a Date object and optionally changes the date
  // by the specified number of days (+ or -). Function returns a new
  // date object, or the original object if the original object is not a Date
  // object.

  services.factory('dashboard', function (Reservation, Guest, Room, RoomPlan, Resource, Itemtype, Firm, datetime, $q) {

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
                console.log("getDepartures query failed: " + err);
              }
              else {
                deferred.resolve(reservation);
              }
            });
        return deferred.promise;
      },
      getCurrentReservations: function () {
        var deferred = $q.defer();
        Reservation.find({checked_in: {$exists: true}, checked_out: {$exists: false}})
            .sort({end_date: -1})
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
      guestNameLookup: function (val, firm) {
        var deferred = $q.defer();
        var qry = firm ? {firm: firm, $or: [
          {last_name: { $regex: val, $options: 'i' }},
          {first_name: { $regex: val, $options: 'i' }}
        ]} :
        {$or: [
          {last_name: { $regex: val, $options: 'i' }},
          {first_name: { $regex: val, $options: 'i' }}
        ]};
        Guest.find(qry)
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
      firmNameLookup: function (val) {
        var deferred = $q.defer();
        Firm.find({firm_name: { $regex: val, $options: 'i' }})
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
      // Find free rooms by finding the rooms for all reservations that
      // overlap the specified dates and then
      // returning the list of rooms not in the set.
      // If doubleOnly is true then we ignore single rooms.
      // If forlist is true then an empty Room object is added at the top of the list
      // with a room number of 0. This will create a Room object that returns a default display_name
      // value as determined in the Room schema.
      findAvailableRooms: function (start, end, doubleOnly, forlist) {
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
                    angular.forEach(item.rooms, function (room){
                      booked.push(room.number);
                    });
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
      findAvailableResources: function (start, end, resType, forlist) {
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
                    angular.forEach(item.resources, function (res){
                      if (res.resource_type === resType) {
                        booked.push(res.name);
                      }
                    });
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

      // retrieve the room plan types filtering will be done in the vm or UI
      getRoomPlanList: function () {
        var deferred = $q.defer();
        //var qryobj = isBusiness ? {item_category: 'Zimmer Plan', business_allowed: true} : {item_category: 'Zimmer Plan'};
        RoomPlan.find()
            .sort({display_order: 1})
            .exec(function (err, itemtypes) {
              if (err) {
                deferred.reject(err);
                console.log("getCurrentReservations query failed: " + err);
              }
              else {
                deferred.resolve(itemtypes);
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

      // Get all item types of a specific catagory.
      // retrieve the room plan types, filter if business reservation
      getItemTypeList: function (itemType) {
        var deferred = $q.defer();

        Itemtype.find({item_category: itemType})
            .sort({display_order: 1})
            .exec(function (err, itemtypes) {
              if (err) {
                deferred.reject(err);
                console.log("getCurrentReservations query failed: " + err);
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

        Itemtype.find({item_category: {$ne: itemType}})
            .sort({itemType: 1, display_order: 1})
            .exec(function (err, itemtypes) {
              if (err) {
                deferred.reject(err);
                console.log("getCurrentReservations query failed: " + err);
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