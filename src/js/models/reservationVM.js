/**
 * Reservation view-model. Incorporates the business logic for creating and managing reservations. Is the glue between
 * the view and the database Reservation model.
 * The model.factory returns a singleton instance of a "ViewModel factory". This factory has two methods:
 *       newReservationVM - this method returns a new Reseravation view-model instance containing a new Mongoose
 *                          Reservation document.
 *       getReservationVM - this method returns a new Reservation view-model containing the specified Reservation
 *                          document from the reservation collection. This method has two parameters:
 *                              resnum - the unique reservation number of the Reservation document to retrieve from
 *                                       the Reservation collection.
 *                              readOnly - a boolean value that is set to true if the reservation is retrieved for
 *                                         display purposes only. Other collection objects required for the VM will
 *                                         not be retrieved from the database.
 *
 * Note this module is very large and has a lot of complex business logic. The class exposes many properties and methods.
 * Methods that begin with an underscore '_' are private methods. While this is a view-model for the reservation model,
 * by necessity, there are a number of other db models an methods that must be accessed.
 */
define(['./module'], function (model) {
  'use strict';
  model.factory('ReservationVM', function ($q, Reservation, Itemtype, TaxItem, dbEnums, dashboard, datetime, configService, modalUtility, convert) {
    console.log("Invoking ReservationVM");

    // ******* Define the View Model object
    // ******* ViewModel definition  ********
    var reservationVM = function (reservation, roomPlanList, itemTypeList, loadExisting) {
      var that = this; // for internal function reference

    //#region - public properties assigned to VM and initialization code

      this.res = reservation; // The Reservation (Mongoose model) that this ViewModel works with.
      this.guest1rec = null; // Holds complete guest record
      this.guest2rec = null; // Holds complete guest2 record
      this.roomPlanFirstText = '<' + configService.loctxt.selectRoomPlan + '>'; // default text for first item in room plan list
      this.roomPlansAll = roomPlanList; // The list of available room plans for the reservation. This list is filtered based on
      // reservation type and the filtered list is placed in the roomPlans array.
      this.roomPlans = [];  // Filtered list of room plans based on reservation type. Used by UI.
      this.selectedPlan = {}; // The currently selected room plan object
      this.availableRooms = []; // A list of available rooms for a specific date range.
      this.availableResources = []; // A list of available resources for a specific date range.
      this.expenseItemTypes = itemTypeList; // Exposes a list of all expense item types available to the reservation.
      this.showFirm = false; // viewmodel property that is true if the reservation requires a firm name.
      this.showInsurance = false; // viewmodel property that is true if the reservation requires insurance.
      this.single_only = false; // viewmodel property that is true if the selected room plan is a single room only plan.
      this.double_only = false; // viewmodel property that is true if the selected room plan is a double room only plan.
      this.isGroup = false; //viewmodel property that is true if the selected plan is a group plan with multiple rooms.
      this.isPackage = false; // viewmodel property that is true if the selected plan is a package plan.
      this.oneBill = false; // viewmodel property that is true if the selected plan is a group plan and requires a single bill.
      this.oneRoom = true; // viewmodel property that is true if the selected plan has the one_room flag set
      this.isStandard = false; // True if the reservation type is "Standard";
      this.isBusiness = false; // True if the reservation type is "Business" or is a group reservation with multiple bills.
      this.isKur = false; // True if the reservation type is "Kur"
      this.isTour = false; // True if the reservation type is a group reservation with one bill.
      this.isPrivateGroup = false; // True if reservation type is private group (multi-room private reservation)
      this.secondGuest = false; // VM property that is true if selected plan has the second_guest flag set
      this.showSecondGuest = false; // VM property that is true if selected plan has the second_guest flag set and the
                                    // reservation has 2 guests and  and the plan has the one_room flag set
      this.includesBreakfast = false; // True if selected plan includes breakfast.
      this.includesBusBreakfast = false; // True if firm associated with res. has the includes_breakfast (in price) flag set
      this.requiresKurtax = false; // True if the selected plan requires the collection of city Kurtax.
      this.guestLookup = false; // If true then quest name associated with room must be in guest database.
      this.planPrice = 0; //set by room plan selection
      this.firmPrice = 0; // set by selection of a firm with a negotiated price
      this.planNights = 0; //set by room plan selection
      this.singleSurcharge = 0; // set by room plan selection.
      this.nights = 0; //property of the viewmodel since the Reservation schema property is calculated.
      this.minNights = 1; // minimum # nights for a reservation, set to the plan duration for 'package' type room plans
      this.statusList = dbEnums.getReservationStatusEnum();
      this.sourceList = dbEnums.getReservationSourceEnum();
      this.resTypeList = dbEnums.getReservationTypeEnum(); //holds a list of the reservation types e.g. standard, business, cure
      this.insuranceList = dbEnums.getReservationInsuranceEnum();
      this.fullGuestInfo = null; // will hold full info about primary guest
      this.fullFirmInfo = null; // will hold full info about firm associated with reservation
      var rOpts = [];
      this.resTypeList.forEach(function (item) {
        rOpts.push({value: item, text: item});
      });
      this.resTypeOptions = rOpts;
      this.occupantOptions = [
        {value: 1, text: '1'},
        {value: 2, text: '2'}
      ];
      // **** Other private globals ***
      // used by pre-save function. Set to the initial value of the plan property of an existing reservation when loaded,
      // default values are given for new reservations.
      var lastPlanCode,
          lastGuest,
          lastGuest2,
          lastFirm,
          lastNights,
          lastRoomHash,
          lastRoomInfo = [],
          lastResourceHash,
          lastInsurance1,
          lastInsurance2;
      var planRequiredItems = []; //used by pre-save code stores required items of current plan.
    //#endregion

    //region *** Public methods assigned to VM ***

      // Utility method to return a room type abbreviation from a reservedRoom item
      this.generateRoomAbbrv = function (rrObj) {
        return dbEnums.getRoomDisplayAbbr(rrObj);
      };

      // test function used by UI. Returns true if the insurance selected allows copay
      this.allowCopay = function () {
        return (that.res.insurance && that.res.insurance !== 'Privat'); // todo - this is hardwired. Not the best approach
      };
      // test function used by UI. Returns true if the insurance2 selected allows copay
      this.allowCopay2 = function () {
        return (that.res.insurance2 && that.res.insurance2 !== 'Privat'); // todo - this is hardwired. Not the best approach
      };

      // Respond to change of reservation type from UI.
      // If a reservation type is changed, then we may remove any rooms currently attached and will remove any expenses
      // attached to the current reservation. This is needed because billing logic may be totally different for
      // different types and much of the billing logic is based on the expense items associated with the reservation.
      this.reservationTypeChanged = function () {
        console.log("Reservation type changed to " + this.res.type);
        //_removeAllEmbeddedDocs(that.res.rooms);
        _removeAllEmbeddedDocs(that.res.expenses);
        if (this.res.type === dbEnums.getReservationTypeEnum()[3]) {
          this.res.occupants = 0;
          _removeAllEmbeddedDocs(that.res.rooms);
        }

        _filterRoomPlans(this.res.type, undefined);
        //if there is a pre-selected plan, not the default, then execute the roomPlanChanged method
        //if (this.selectedPlan.value) {
        this.roomPlanChanged(); //defer removing rooms to plan changed.
        //}
      };

      // Respond to a change in the number of occupants from the UI. Returns a promise since it may call the
      // updateAvailableRoomsAndResources method
      this.occupantsChanged = function () {
        var deferred = $q.defer();
        var plan = _findSelectedPlan();
        if (plan.is_group) {
          deferred.resolve(0); // don't do anything, just resolve the promise
        }
        else {
          this.showSecondGuest = plan.second_guest && this.res.occupants === 2 && plan.one_room;

          // If selected room plan has a plan price then adjust price based on the number of occupants.
          if (plan.is_plan) {
            that.planPrice = that.res.occupants === 1 ? plan.pp_price + plan.single_surcharge : plan.pp_price;
          }

          // If there is an existing room and plan.one_room then we need to update the room occupancy and perhaps
          // price.
          if (plan.one_room && that.res.rooms.length) {
            that.res.rooms[0].guest_count = that.res.occupants;
            that.res.rooms[0].price = plan.is_plan ? that.planPrice : that.res.rooms[0].price;
            that.res.rooms[0].guest2 = that.res.occupants === 1 ? '' : that.res.guest2.name;
          }

          var rdates = that.getResDateDse();
          var doubleOnly = that.double_only || (that.res.occupants === 2 && that.oneRoom);
          this.updateAvailableRoomsAndResources(rdates, doubleOnly, true).then(function (cnt) {
            deferred.resolve(cnt);
          }, function (err) {
            deferred.reject(err);
          });
        }

        return deferred.promise;
      };

      // Respond to changes in room plan from the UI. This contains specific business logic.
      this.roomPlanChanged = function () {
        console.log("Room plan changed. ID: " + this.selectedPlan.value);
        var plan = _findSelectedPlan();
        if (plan) {
          planRequiredItems =  plan.required_items;// used by methods that manage reservation expense items
          // Update reservation fields with plan information
          this.res.plan = plan.name;
          this.res.plan_code = plan._id;
          this.res.individualBill = !plan.one_bill;
          // Set public boolean properties based on plan
          this.showFirm = plan.needs_firm;
          this.showInsurance = plan.needs_insurance;
          this.single_only = plan.single_only;
          this.double_only = plan.double_only;
          this.isGroup = plan.is_group;
          this.oneBill = plan.one_bill;
          this.isPackage = plan.is_plan;
          this.oneRoom = plan.one_room;
          this.isStandard = this.res.type === dbEnums.getReservationTypeEnum()[0];
          this.isBusiness = (this.res.type === dbEnums.getReservationTypeEnum()[1]) || (this.res.type === dbEnums.getReservationTypeEnum()[3] && plan.bus_breakfast);
          this.isKur = (this.res.type === dbEnums.getReservationTypeEnum()[2]);
          this.isTour = (this.res.type === dbEnums.getReservationTypeEnum()[3] && plan.one_bill && plan.needs_firm);
          this.isPrivateGroup = (this.res.type === dbEnums.getReservationTypeEnum()[3] && plan.one_bill && !plan.needs_firm);
          this.secondGuest = plan.second_guest;
          this.includesBreakfast = plan.includes_breakfast;
          this.requiresKurtax = plan.requires_kurtax;
          this.showSecondGuest = plan.second_guest && this.res.occupants === 2 && plan.one_room;
          this.guestLookup = (this.isGroup && !this.oneBill);
          // now implement logic that removes content from hidden Model properties
          if (!this.showFirm) {
            this.res.firm = '';
          }
          if (!this.showInsurance) {
            this.res.insurance = '';
          }

          // Implement logic to pre-set occupants if the plan is single_only or double_only and the occupant numbers
          // don't match. But only for changes from UI not on first load of an existing res.
          if (loadExisting) {
            loadExisting = false;
          }
          else {
            if (this.double_only && this.res.occupants  !== 2) {
              this.res.occupants = 2;
            }
            else if (this.single_only && (this.res.occupants > 1 || this.res.occupants === 0)) {
              this.res.occupants = 1;
            }
          }

          // If selected room plan has a plan price then set the property. If the # of occupants is 1 then add any
          // single surcharge. Also if the plan has a set duration, set the nights property accordingly.
          if (plan.is_plan) {
            this.planPrice = plan.pp_price;
            this.minNights = plan.duration ? plan.duration : 1;
            this.singleSurcharge = plan.single_surcharge;
            if (this.res.occupants === 1) {
              this.planPrice = plan.pp_price + plan.single_surcharge;
            }
            if (plan.duration) { //update nights property if plan has a fixed duration
              this.nights = plan.duration;
            }
          }
          else {
            this.planPrice = 0;
            this.singleSurcharge = 0;
          }
        }
        else {
          this.showFirm = false;
          this.showInsurance = false;
          this.planPrice = 0;
          this.singleSurcharge = 0;
          this.single_only = false;
          this.double_only = false;
          this.res.plan = '';
          this.res.plan_code = null;
        }
      };

      // Returns an object with a the provided reservation start date and a new end date in response to a change in a
      // reservation start date or the number of nights (nights property of the VM) in the UI
      this.calculateEndDate = function (start) {
        return {
          start: datetime.dateOnly(new Date(start)),
          end: datetime.dateOnly(new Date(start), this.nights)
        };
      };

      // Updates the nights property of the VM based on the start and end dates of the reservation
      this.calculateNights = function () {
        var rdates = that.getResDateDse();
        this.nights = rdates.end - rdates.start; //datetime.getNightsStayed(new Date(rdates.start), new Date(rdates.end));
        return {  //returned the clean dates
          start: rdates.start,
          end: rdates.end
        };
      };

      // Utility routine that will return the start and end DSE values for the reservation.
      // Returns a simple object with the dse values in the start and an end properties.
      // Note replaces the cleaned dates function
      this.getResDateDse = function () {
        if (this.res) {
          return {
            start: this.res.start_dse, // datetime.dateOnly(new Date(this.res.start_date)),
            end: this.res.end_dse // datetime.dateOnly(new Date(this.res.end_date))
          };
        }
        else {
          return {start: 0, end: 0};
        }
      };

      // Retrieves the available rooms and resources for the reservation dates specified.
      // Parameters:
      // dateObj - a simple object with a start and end property that contains the start and end dates respectively.
      // noSingles - a flag that if true, then the room search will be limited to double rooms and suites only.
      // roomOnly - a flag that if true will limit the search to rooms only and not to resources.
      // The method returns a promise that resolves to the count of the rooms found. Internally, the avalableRooms and
      // the availableResources arrays are updated with the results of the search.
      this.updateAvailableRoomsAndResources = function (roomOnly) {
        var rdates = that.getResDateDse(); //retrieve reservation dates and clean of time portion
        var doubleOnly = that.double_only || (that.res.occupants === 2 && that.oneRoom);
        var resource = dbEnums.getResourceTypeEnum()[0]; //currently the only bookable resource type.
        var deferred = $q.defer();
        if (!that.res.start_date || !that.res.end_date) {
          this.availableRooms = [];
          this.availableResources = [];
          deferred.resolve(0);
        }
        else {
          dashboard.findAvailableRooms(rdates.start, rdates.end, doubleOnly, true,
              that.res.reservation_number).then(function (rooms) {
                console.log('%d available rooms found', rooms.length);
                that.availableRooms = rooms;
                if (!roomOnly) {
                  dashboard.findAvailableResources(rdates.start, rdates.end, resource, true,
                      that.res.reservation_number).then(function (resources) {
                        console.log('%d available ' + resource + ' found', resources.length);
                        that.availableResources = resources;
                        deferred.resolve(resources.length + rooms.length);
                      });
                }
                else {
                  deferred.resolve(rooms.length);
                }
              });
        }

        return deferred.promise;
      };

      // guest changed, perform logic to update guest name in room if needed.   Only applies to one room reservations
      this.guestChanged = function (secondGuest) {
        if (that.oneRoom && that.res.rooms.length === 1) {
          if (secondGuest && that.res.guest2) {
            that.res.rooms[0].guest2 = that.res.guest2.name;
          }
          else if (that.res.guest) {
            that.res.rooms[0].guest = that.res.guest.name;
          }
        }
      };

      // Can be called by UI to update guest information
      this.updateGuestDataFromDb = function () {
        var deferred = $q.defer();
        if (that.res.guest && that.res.guest.id) {
          dashboard.getGuestById(that.res.guest.id).then(function (guest){
            var g = {dname: guest.unique_name, name: guest.name, id: guest._id, firm:guest.firm, partner: guest.partner};
            that.guestSelectionChanged(g);
            deferred.resolve();
          }, function (err) {deferred.reject(err)})
        }
        else { // just return without doing anything of no guest
          deferred.resolve();
        }
        return deferred.promise;
      };

      // called by UI when a new guest is selected from the select-guest directive. Performs a potential update of the
      // Firm field if needed, and for Kur reservations, updates the Guest 2 name to the partner name of the main guest.
      // For standard reservations, if the occupants are 2 then if the guest partner name is defined, use it, if not
      // then second guest becomes "roomate". Room updating is handled by the guestChanged method.
      this.guestSelectionChanged = function (guest) {
        var name2 = '';

        if (guest) {
          //console.log("Guest changed: " + guest.firm);
          if (that.showFirm && guest.firm) {
            that.res.firm = guest.firm;
          }

          if (that.isKur && that.showSecondGuest) {
            that.res.guest2 = {name: guest.partner, id: that.res.guest.id};
            name2 = guest.partner;
          }

          if (that.isStandard && that.res.occupants == 2) {
            name2 = (guest.partner && guest.partner.indexOf('**') === -1) ? guest.partner : configService.loctxt.roommate;
            that.res.guest2 = {name: name2, id: that.res.guest.id};
          }

          //if (that.oneRoom && that.res.rooms.length)  {
          //  that.res.rooms[0].guest = guest.name;
          //  if (name2)  {
          //    that.res.rooms[0].guest2 = name2;
          //  }
        }
      };

      // Utility method that retrieves the room expense item in the reservation for the specified room number and guest
      this.getRoomExpenseInReservation = function (roomNum, guest) {
        var roomExp = null;
        for (var i = 0; i < this.res.expenses.length; i++) {
          if (this.res.expenses[i].room === roomNum
              && this.res.expenses[i].guest === guest
              && this.res.expenses[i].is_room) {
            roomExp = this.res.expenses[i];
            break;
          }
        }
        return roomExp;
      };

      // Utility to retrieve the specified reservedRoom object from the reservation's rooms property
      this.getRoomInReservation = function (roomNum) {
        var room = null;
        for (var i = 0; i < this.res.rooms.length; i++) {
          if (this.res.rooms[i].number === roomNum) {
            room = this.res.rooms[i];
            break;
          }
        }
        return room;
      };

      // method retrieves the plan object that is associated with the reservation, or if
      // the 'planID' parameter is specified  then it retrieves that plan object.
      this.getPlanInReservation = function (planID) {
        var curPlan = null,
            pid = planID ? planID : that.selectedPlan.value;

        that.roomPlansAll.forEach(function (plan) {
          if (plan._id === pid) {
            curPlan = plan;
          }
        });

        return curPlan;
      };

      // method to generate the plan / room display string for the reservation. It returns an object with the following
      // properties:
      //    roomGuest1 - name of the main guest in a room
      //    roomGuest2 - name of the second guest in a room
      //    groupRooms - an array of objects containing the room number and main guest name for each room in a group
      //                 reservation. Can be used by the UI.
      //    displayText - a formatted string containing the plan description with unit price.
      //
      this.generatePlanRoomString = function (roomNum, guest) {
        var rmExp = that.getRoomExpenseInReservation(roomNum, guest),
            plan = that.getPlanInReservation(),
            extras = {},
            rmObj = that.getRoomInReservation(roomNum),
            result = {roomGuest1: undefined, roomGuest2: undefined, groupRooms: [], displayText: '****'},
            instructions = {price: 'c', roomprice: 'c'};

        if (rmExp) {
          rmObj = that.getRoomInReservation(roomNum);
          result.roomGuest1 = rmObj.guest;
          result.roomGuest2 = rmObj.guest2;
          if (that.isGroup && !that.oneBill) { //group business reservation //This mode is deprecated
            extras = {nights: that.res.nights, roomType: rmObj.room_type, roomPrice: rmObj.price};
            result.displayText = convert.formatDisplayString(plan, extras, instructions);
          }
          else if (that.isGroup && that.oneBill) { //group business, tour and private reservation.
            extras = {nights: that.res.nights, occupants: that.res.occupants, roomCnt: that.res.rooms.length};
            result.displayText = convert.formatDisplayString(plan, extras, instructions);

            // for the tour case the UI needs to create buttons for each room
            //if (that.isTour) {
            that.res.rooms.forEach(function (rm) {
              result.groupRooms.push({room: rm.number, guest: rm.guest});
            });
            //}
          }
          else if (that.oneRoom && that.oneBill) { //should cover standard reservations
            extras = {nights: that.res.nights, roomprice: rmExp.price};
            if (plan.is_plan) {
              extras.perPerson = that.res.occupants === 2 ? configService.loctxt.forTwoPeople : '';
            }
            result.displayText = convert.formatDisplayString(plan, extras, instructions);
          }
          else if (that.oneRoom && !that.oneBill) { // covers business and kur plans
            extras = {nights: that.res.nights, roomprice: rmExp.price};
            if (plan.is_plan) {
              extras.perPerson = ''; //that.res.occupants === 2 ? configService.loctxt.forTwoPeople : '';
            }
            result.displayText = convert.formatDisplayString(plan, extras, instructions);
          }
        }

        return result;
      };

      // method that implements the check-in logic. The reservation is checked in by room for most reservations.
      // The current exception is for travel group reservations, for this type, all rooms are checked in at once.
      // The method excepts a room number parameter. This parameter is only used for multi-room, individual bill
      // reservations. For all other types, the parameter is ignored.
      // The method returns a promise since it saves the reservation after updating..
      this.checkIn = function (roomNum) {
        var deferred = $q.defer(),
            room,
            allCheckedIn = true,
            msg;

        if (that.isGroup && that.oneBill) {  // group reservation
          that.res.rooms.forEach(function (rm) {
            rm.isCheckedIn = true;
          });
          if (that.res.rooms.length) {
            that.res.checked_in = new Date();
          }
        }
        else if (that.oneRoom && that.oneBill) {  //single bill one room res. only check that a room exists
          if (that.res.rooms.length) {
            that.res.rooms[0].isCheckedIn = true;
            that.res.checked_in = new Date();
          }
          else {
            msg = configService.loctxt.errorBold + ' ' + configService.loctxt.noRoom;
            deferred.reject(msg);
          }

        }
        else { //All other reservations
          room = that.getRoomInReservation(roomNum);
          if (room) {
            room.isCheckedIn = true;
            that.res.rooms.forEach(function (rm) {
              if (!rm.isCheckedIn) {
                allCheckedIn = false;
              }
            });
            if (allCheckedIn) {
              that.res.checked_in = new Date();
            }
          }
          else { //error couldn't find room.
            msg = configService.loctxt.errorBold + ' ' + configService.loctxt.room + ' ' + roomNum + ' ' +
                configService.loctxt.notFound;
            deferred.reject(msg);
          }
        }
        that.res.save(function (err) {
          if (err) {
            deferred.reject(err);
          }
          else {
            deferred.resolve();
          }
        });

        return deferred.promise;
      };

      // method that implements the check-out logic. The reservation is checked out by room for most reservations.
      // The current exception is for group reservations, for this type, all rooms are checked out at once.
      // The method excepts a room number parameter. This parameter is only used for multi-room, individual bill
      // reservations. For all other types, the parameter is ignored.
      // Prior to saving the reservation we will update the address just incase the main guest or the firm
      // address has been edited. The checked out reservation captures the state of things at the time of
      // checkout only.
      // The method returns a promise since it saves the reservation after updating..
      this.checkOut = async function (roomNum, guest) {
        let room,
            allCheckedOut = true,
            msg, cr;
      
        try {

          if (that.isGroup && that.oneBill) {  // group reservation
            that.res.rooms.forEach(function (rm) {
              rm.isCheckedOut = true;
            });
            if (that.res.rooms.length) {
              that.res.checked_out = new Date();
            }
            _addTaxItem();
          }
          else if (that.oneRoom && that.oneBill) {  //single bill one room res. only check that a room exists
            if (that.res.rooms.length) {
              that.res.rooms[0].isCheckedOut = true;
              that.res.checked_out = new Date();
              _addTaxItem(that.res.rooms[0].number, that.res.rooms[0].guest);
            }
            else {
              msg = configService.loctxt.errorBold + ' ' + configService.loctxt.noRoom;
              throw new Error(msg);
            }

          }
          else { //All other reservations - should not get here any more.
            room = that.getRoomInReservation(roomNum);
            if (room) {
              room.isCheckedOut = true;
              that.res.rooms.forEach(function (rm) {
                if (!rm.isCheckedOut) {
                  allCheckedOut = false;
                }
              });
              if (allCheckedOut) {
                that.res.checked_out = new Date();
              }
              _addTaxItem(roomNum, guest);
              // If we have someone else in the room with their own bill, they will also be checked out
              // at the same time, so add the taxes for the second bill. 
              if (room.guest_count === 2) {
                _addTaxItem(roomNum, room.guest2);
              }
            }
            else { //error couldn't find room.
              msg = configService.loctxt.errorBold + ' ' + configService.loctxt.room + ' ' + roomNum + ' ' +
                  configService.loctxt.notFound;
              throw new Error(msg);
            }
          }
          //update the reservation address
          if (that.res.firm) {
            let f = await dashboard.getFirmByName(that.res.firm);
            if (f) {
              that.res.address1 = f.address1;
              that.res.address2 = f.address2;
              that.res.post_code = f.post_code;
              that.res.city = f.city;
              that.res.country = f.country;
            }           
          } else {
            let g = await dashboard.getGuestById(that.res.guest.id);
            if (g) {
              that.res.address1 = g.address1;
              that.res.address2 = g.address2;
              that.res.post_code = g.post_code;
              that.res.city = g.city;
              that.res.country = g.country;
            }
          }
          await that.res.save()
          await that.afterSave();
        } catch (err) {
          console.error("Checkout Error: " + err.message);
        }
    }

      // Method that returns a boolean that determines if a reservation / room can be checked in. It implements similar
      // logic used in the checkIn method.
      this.canCheckIn = function (roomNum) {
        var room;

        if (that.isGroup && that.oneBill) {  // group reservation
          return that.res.canCheckIn; // uses the reservation model's virtual property
        }
        else if (that.oneRoom && that.oneBill) {  //single bill one room res. also check that a room exists
          return (that.res.canCheckIn && that.res.rooms.length);
        }
        else { //All other reservations
          room = that.getRoomInReservation(roomNum);
          if (room) {
            return (that.res.canCheckIn && !room.isCheckedIn);
          }
          else {
            return false;
          }
        }
      };

      // Method that returns a boolean that determines if a reservation / room can be checked out. It implements similar
      // logic used in the checkIn method.
      this.canCheckOut = function (roomNum) {
        var room;

        if (that.isGroup && that.oneBill) {  // group reservation
          return that.res.canCheckOut; // uses the reservation model's virtual property
        }
        else if (that.oneRoom && that.oneBill) {  //single bill one room res. also check that a room exists
          return (that.res.canCheckOut && that.res.rooms.length);
        }
        else { //All individual bill reservations: NOTE: this logic has changed since we only have
          // single room, individual bill reservations.
          room = that.getRoomInReservation(roomNum);
          if (room) { //Handle case where a single room res is checked in but the room property is not set
            return (that.oneRoom && datetime.isDate(that.res.checked_in) && !datetime.isDate(that.res.checked_out)) ? true : (room.isCheckedIn && !room.isCheckedOut);
            //return ((room.isCheckedIn && !room.isCheckedOut) || (that.oneRoom && datetime.isDate(that.res.checked_in)));
          }
          else {
            return false;
          }
        }
      };

      // This method is called prior to saving the reservation. It performs the following functions:
      //    Validates various reservation properties
      //    Cleans up start and end dates (removes time component)
      //    Calculates the days since Unix epoch (dse) values of the start and end dates.
      //    Generates the reservation title.
      //    Copies the required expense items from the room plan to the reservation if the plan has changed.
      //    Copies the address details from the guest or firm if the guest or firm properties have changed.
      this.beforeSave = function () {
        var deferred = $q.defer(),
            changes, vobj;

        // first validate the reservation, if it fails validation reject the promise.
        vobj = _validate();
        if (vobj.hasErrors()) {
          deferred.reject(vobj);
        }
        else {
          // perform stuff that doesn't require a promise
          // Recalculate res start and end DSE values
          this.res.start_date = datetime.dateOnly(new Date(this.res.start_date));
          this.res.start_dse = datetime.daysSinceEpoch(new Date(this.res.start_date));
          this.res.end_date = datetime.dateOnly(new Date(this.res.end_date));
          this.res.end_dse = datetime.daysSinceEpoch(new Date(this.res.end_date))

          // generate title (required field)
          if (this.res.firm) {
            this.res.title = this.res.firm + ' (' + this.res.guest.name + ')';
          }
          else {
            this.res.title = this.res.guest.name
                + (this.res.guest2 && this.res.guest2.name ? ' / ' + this.res.guest2.name : '');
          }

          // If we have insurance, check if the plan requires a prescription fee. If so then set the
          // res prescripton_charges flag.
          if (this.res.insurance && (this.res.insurance !== dbEnums.getReservationInsuranceEnum()[3])) {
            this.res.prescription_charges = true;
          }
          if (this.res.insurance2 && (this.res.insurance2 !== dbEnums.getReservationInsuranceEnum()[3])) {
            this.res.prescription_charges2 = true;
          }

          // Code requiring promises. Get guest and firm and update address and guest name if changed
          _updateNameFirmAddressReqItems().then(function () {
            //_getPlanRequiredItems().then(function () {
              // if a new reservation Copy required items from the plan, if the plan or room info changed then
              // remove the existing items and replace with new plan, if resources changed then replace related
              // resource expense items.
              changes = _updateRequiredExpenses();
              // required expenses update then resource expenses where also updated, if no change then we still want
              // to check for any resource changes.
              if (!changes) {
                _updateResourceExpenses();
              }
              //add/update the expenses for prescription charges and or copay if required.
              _updatePrescriptionAndCopay();

              // update the day count if needed.
              _updateDayCount();

              deferred.resolve();
            //}, function (err) {
            //  deferred.reject(new utility.ErrObj(err));
            //});
          }, function (err) {
            deferred.reject(new modalUtility.ErrObj(err));
          });
        }

        return deferred.promise;
      };
      /**
       * Called after reservation save. Updates the last_stay field
       * of the guest(s) records.
       */
      this.afterSave = async function () {
        try {
          if (that.res.checked_out) {
            let g1 = that.res.guest.id;
            let g2 = that.res.guest2 ? that.res.guest2.id : undefined;
            if (g1) {
              let gst =  await dashboard.getGuestById(g1);
              if (gst) {
                gst.last_stay = that.res.checked_out;
                await gst.save();
              }
            }

            if (g2) {
              let gst2 =  await dashboard.getGuestById(g2);
              if (gst2) {
                gst2.last_stay = that.res.checked_out;
                await gst2.save();
              }
            }
          }
        } catch (err) {
          throw new modalUtility.ErrObj(err);
        }
      }

      // Public convenience method to return a new error object similar to that returned by errors generated
      // by the beforeSave method
      this.getErrorObj = function (firstErr) {
        return new modalUtility.ErrObj(firstErr);
      };
      
      // Function that returns true if the person specified in the room has
      // a kurtax expense item associated with them.
      this.guestInRoomHasKurtax = function (guest, roomNo) {
        return (_getExpenseItem(configService.loctxt.cityTax, roomNo, guest)  != null);
      };
      
      // Function adds a Kurtax item for the guest in the specified room.
      // Adds a kurtax item if it doesn't already exist.
      this.addKurtaxForGuestInRoom = function (guest, roomNo) {
        var deferred = $q.defer();
        if (!roomNo || !guest) {
          deferred.reject(configService.loctxt.expenseItemErr1)
        }
        else {
          if (_getExpenseItem(configService.loctxt.cityTax, roomNo, guest)) {
            deferred.resolve();
          }
          else {
            var exp = new Itemtype();
            exp.name = configService.loctxt.cityTax;
            exp.room = roomNo;
            exp.guest = guest;
            exp.category = dbEnums.getItemTypeEnum()[0];
            exp.bill_code = configService.constants.bcKurTax;
            exp.bus_pauschale = true;
            exp.per_person = true;
            exp.day_count = true;
            exp.no_delete = true;
            exp.fix_price = true;
            exp.one_per = true;
            exp.no_display = false;
            exp.low_tax_rate = true;
            exp.display_string = configService.loctxt.addedKurtaxDisplayString;
            exp.display_order = 3;
            exp.date_added = datetime.dateOnly(new Date()); //date only ignore time
            exp.last_updated = datetime.dateOnly(new Date()); //date only ignore time
            exp.addThisToDocArray(that.res.expenses, configService.constants.cityTax, that.res.nights);
            that.res.save(function (err) {
              if (err) {
                deferred.reject(err);
              }
              else {
                deferred.resolve();
              }
            });
          }
        }
        return deferred.promise;
      };
      
      // Removes a kurtax item if it exists.
      this.removeKurtaxForGuestInRoom = function (guest, roomNo) {
        var deferred = $q.defer();
        var exp; 
        if (!roomNo || !guest) {
          deferred.reject(configService.loctxt.expenseItemErr1)
        }
        else {
          exp = _getExpenseItem(configService.loctxt.cityTax, roomNo, guest);
          if (!exp) {
            deferred.resolve();
          }
          else {
            that.res.expenses.id(exp._id).remove();
            that.res.save(function (err) {
              if (err) {
                deferred.reject(err);
              }
              else {
                deferred.resolve();
              }
            });
          }
        }
        return deferred.promise;
      };
      
      // method to add an expense item and saves the reservation - called by the expense item directive
      // Business Logic: If plan has one_bill true and the room has two guests then add this item for both
      // guests if the item is of type per_person. For example, adding a "Full Pension" item, the assumption is that
      // both guests in the room would want full pension.
      this.addExpenseItemSave = function (item, room, guest) {
        var deferred = $q.defer();
        if (!item || !room || !guest) {
          deferred.reject(configService.loctxt.expenseItemErr1)
        }
        else {
          item.room = room;
          item.guest = guest;
          item.date_added = datetime.dateOnly(new Date()); //date only ignore time
          item.last_updated = datetime.dateOnly(new Date()); //date only ignore time
          if (item.price_lookup) {
            item.price = configService.constants.get(item.price_lookup);
          }
          var count = item.day_count ? that.res.nights : item.count;
          item.addThisToDocArray(that.res.expenses, null, count);
          // now check to see if we need to add a copy or just double the count
          if (item.per_person && that.oneBill && !that.isGroup && that.res.rooms[0].guest_count === 2) {
            if (item.bill_code === configService.constants.bcPackageItem) { //just up count for the extra person
              var rlen = that.res.expenses.length - 1;
              that.res.expenses[rlen].count = that.res.expenses[rlen].count * 2; //double count
            }
            else { // add the extra item
              item.guest = configService.loctxt.roommate;
              item.addThisToDocArray(that.res.expenses, null, count);
            }
          }

          // In case we added a Kur item see if we need to add/update some fixed and variable
          // charges
          _updatePrescriptionAndCopay();

          // Now save reservation with new expense
          that.res.save(function (err) {
            if (err) {
              deferred.reject(err);
            }
            else {
              deferred.resolve();
            }
          });
        }
        return deferred.promise;
      };

      // method to remove an existing expense item and save then reload the reservation if it was successfully removed.
      // NOTE: ran across a bug in the Tingus Driver (most likely). When removing an expense item then saving the
      // reservation Model(as shown in the Mongoose manual) the removed item was not persisted to the database. I
      // found a work-around that is not perfect but it works. If I delete an item then modify an existing item
      // before saving then the change is persisted
      this.removeExpenseItemSave = function (itemID) {
        var deferred = $q.defer();
        var ecnt = that.res.expenses.length;
        var doc = that.res.expenses.id(itemID).remove();
        console.log('Removing doc: ' + doc);
        if (that.res.expenses.length === ecnt) {
          deferred.reject(configService.loctxl.expenseItemErr2);
        }
        else {
          // In case we removed a Kur item see if we need to add/update some fixed and variable
          // charges
          _updatePrescriptionAndCopay();

          that.res.expenses[0].last_updated = new Date();  //test for bug work around  TODO-This works but is not ideal
          that.res.save(function (err) {
            if (err) {
              deferred.reject(err);
            }
            else {
              deferred.resolve();
            }
          });
        }
        return deferred.promise;
      };

      // Method to retrieve bill number for the room guest combination. If the room guest combination does not
      // have a bill number yet, one is created.
      this.getBillNumber = function (room, guest) {
        var deferred = $q.defer(),
            bnItem = null,
            rm = Number(room);
        that.res.bill_numbers.forEach(function (bit) {
          if (bit.room_number === rm && bit.guest === guest) {
            bnItem = bit;
          }
        });
        if (bnItem) {
          deferred.resolve(bnItem.billNo);
        }
        else {
          dashboard.getNewBillNumber().then(function (num) {
            _addBillNumberItem(room, guest, num);
            that.res.save(function (err) {
              if (err) {
                deferred.reject(err);
              }
              else {
                deferred.resolve(num);
              }
            });
          }, function (err) {
            deferred.reject(err);
          });
        }
        return deferred.promise;
      };

      // This method generates the billing name associated with the billing address
      // For business and Travel group reservations, the Firm Name is used for the billing name. For Kur reservations
      // the individuals name is used, for Standard reservations, if a single person, that persons name is used, if
      // a couple then the main person and partner name is used. If the custom_name flag is set then we do nothing.
      this.generateBillingName = function () {
        var deferred = $q.defer();

        if (!that.res.custom_name) {
          if (that.showFirm) {
            that.res.billing_name = that.res.firm;
            deferred.resolve();
          }
          else {
            if (that.res.occupants === 1) {
              that.res.billing_name = that.res.guest.name;
              deferred.resolve();
            }
            else if (that.res.occupants === 2 && that.res.rooms.length === 1) {
              dashboard.getGuestById(that.res.guest.id).then(function (guest) {
                    //build name
                    if (guest) {
                      that.res.billing_name = guest.billing_name;
                      deferred.resolve();
                    }
                    else {
                      that.res.billing_name = '???';
                      deferred.reject("NAME NOT FOUND");
                    }
                  },
                  function (err) {
                    that.res.billing_name = "*** ERROR ***";
                    deferred.reject(err);
                  });
            }
            else {
              that.res.billing_name = that.res.guest.name;
              deferred.resolve();
            }
          }
        }
        else {
          deferred.resolve();
        }
        return deferred.promise;
      };

      // called when UI changes billing_name. Sets the custom_name flag and saves the reservation as-is.
      this.updateBillingNameSave = function () {
        var deferred = $q.defer();
        if (that.res.billing_name) {
          that.res.custom_name = true;
          that.res.save(function (err) {
            if (err) {
              deferred.reject(err);
            }
            else {
              deferred.resolve();
            }
          });
        }
        else {
          return deferred.resolve();
        }
        return deferred.promise;
      }

      // method to save reservation after an expense item is edited. The only business logic implemented is
      // if the edited expense item is a room expense item and the price is modified. We must recalculate
      // the taxable amount if the room includes breakfast. We also update the last_updated field
      this.updateExpenseItemSave = function (itemID) {
        var deferred = $q.defer(),
            item = that.res.expenses.id(itemID);

        if (item && item.is_room) {
          _updateRoomTaxablePrice(item);
        }
        // In case we updated a Kur item see if we need to add/update some fixed and variable
        // charges
        _updatePrescriptionAndCopay();
        item.last_updated = datetime.dateOnly(new Date()); //date only ignore time

        that.res.save(function (err) {
          if (err) {
            deferred.reject(err);
          }
          else {
            deferred.resolve();
          }
        });
        return deferred.promise;
      };

      // Calculate expense totals for included expense items. It returns an object with the sum, detail information and
      // taxes for the specified items. The method calculates totals and taxes for the specific items specified in
      // the incItems parameter. It will also filter by guest and room if the reservation does not require one bill.
      // It will generate the expense item details for bill creation. It can perform various aggregation functions
      // on the items.
      this.calculateTotals = function (incItems, room, guest, extras, aggregate, aggrTxt, busPauschale, excludeKur) {
        var net19 = 0,
            sum19 = 0,
            net7 = 0,
            sum7 = 0,
            tax19 = 0,
            tax7 = 0,
            kurtax = 0,
            calcResult = {sum: 0, detail: [], totalsTaxes: {}, hiddenSum: 0, prescription: 0, copay: 0},
            instructions = {price: 'c', credit: 'c'}, //formatting instructions for price/credit in bill item
            hidden = [], //for holding all hidden items.
            hiddenKur = [], // for holding hidden Cure items
            roomBin = [], // for multi room bills that require breaking out room details based on room type and price
            roomItem = undefined, //for holding room item
            hiddenTotal = 0,
            ignoreRmGuest = !room && !guest,
            exclude = false;

        // Expense detail object, for a bill
        var LineItem = function (expItem, extras, instructions) {
          this.text = convert.formatDisplayString(expItem, extras, instructions);
          this.total = expItem.item_total;
          this.bus_pauschale = expItem.bus_pauschale;
          this.count = expItem.count;
          this.display_string = expItem.display_string;
          this.bill_code = expItem.bill_code;
          this.price = expItem.price;
          this.isRoom = expItem.is_room;
          this.clone = function () {
            return {
              text: this.text,
              total: this.total,
              bus_pauschale: this.bus_pauschale,
              count: this.count,
              display_string: this.display_string,
              bill_code: this.bill_code,
              price: this.price,
              isRoom: this.isRoom
            }
          }
        };

        var binRoomItems = function (rbin, ritem) {
          var room = that.getRoomInReservation(ritem.room),
              ix;
          if (rbin && room) {
            for (ix = 0; ix < rbin.length; ix++) {
              if (room.room_type === rbin[ix].type && room.room_class === rbin[ix].class && ritem.price === rbin[ix].price) {
                rbin[ix].count++;
                break;
              }
            }
            if (ix === rbin.length) {
              rbin.push({
                count: 1,
                type: room.room_type,
                class: room.room_class,
                price: ritem.price,
                days: ritem.count
              });
            }
          }
        };
        // process each expense item and create detail items for display as well as calculating totals and taxes
        angular.forEach(that.res.expenses, function (item) {
          var includeIt = ((that.oneBill && !that.isGroup) || ignoreRmGuest || (item.guest === guest && item.room === Number(room))),
              inCategory = ( !incItems || incItems.length === 0 || incItems.indexOf(item.bill_code) !== -1);

          if (inCategory && includeIt) {
            if (!item.no_display && !item.is_room) {
              if (item.price || item.taxable_price)
                calcResult.detail.push(new LineItem(item, extras, instructions));
            }
            else if (item.is_room) { // filter down to one room entry only
              if (roomItem) {
                roomItem.total += item.item_total;
              }
              else {
                roomItem = new LineItem(item, extras, instructions); //add one room item
              }
              binRoomItems(roomBin, item);
            }
            else if (item.no_display) {
              // special kur item handling
              if (item.bill_code === configService.constants.bcKurPackageItem) {
                hiddenKur.push(item);
                hidden.push(item);
              }
              else if (item.bill_code === configService.constants.bcKurSpecial) {
                if (item.name === configService.loctxt.copay) {
                  calcResult.copay = item.price;
                }
                else {
                  calcResult.prescription = item.price;
                }
              }
              else {
                hidden.push(item); //gather hidden items.
              }
            }

            // if kur item and excludeKur flag set then do not include item in totals and tax calculations
            exclude = excludeKur && item.bill_code === configService.constants.bcKur;
            if (!exclude) {
              calcResult.sum += item.item_total;
              if (item.low_tax_rate) {
                tax7 += item.item_tax;
                net7 += item.item_tax_net;
                sum7 += item.item_tax_total;
              }
              else {
                tax19 += item.item_tax;
                net19 += item.item_tax_net;
                sum19 += item.item_tax_total;
              }
            }

            //sum Kurtax items
            if (item.bill_code === configService.constants.bcKurTax) {
              kurtax += item.item_total;
            }
          }
        });

        //If we have hidden items, then add to the total of the detail item that is identified as the room item.
        //If the hidden item has a value in the credit field and a 0 price then add a credit item to the details array.
        hidden.forEach(function (item) {
          hiddenTotal += item.item_total;
          if (item.price === 0 && item.credit && roomItem) {
            var hitem = new LineItem(item, extras, instructions); //create credit item
            hitem.display_string = configService.loctxt.creditForDisplayString; //need different display text
            hitem.name = item.name; //needed to properly format text.
            hitem.credit = item.credit * item.count; //ditto
            hitem.text = convert.formatDisplayString(hitem, extras, instructions); //New display string
            hitem.total = undefined; //don't want 0 to show in bill
            calcResult.detail.push(hitem)
          }
        });

        calcResult.hiddenSum = hiddenTotal;
        if (hiddenTotal && roomItem) {
          roomItem.total += hiddenTotal;
        }
        // now pop the room item at the top of the details array
        if (roomItem && roomBin.length === 1 && (roomBin[0].count === 1 || that.isPackage)) {
          calcResult.detail.unshift(roomItem);
        }
        else if (roomItem && roomBin.length > 0) { // pop individual room items onto top of details array
          roomItem.total = undefined;
          roomBin.forEach(function (bitem) {
            var newItem = roomItem.clone(),
                extra = {type: bitem.type, class: bitem.class, days: bitem.days};

            newItem.display_string = "%count% x %days% Tag|Tage - %class% %type%  à %price%"//configService.loctxt.roomTypeDisplayString;
            newItem.count = bitem.count;
            newItem.price = bitem.price;
            newItem.total = bitem.count * bitem.price * bitem.days;
            newItem.text = convert.formatDisplayString(newItem, extra, instructions);
            calcResult.detail.unshift(newItem);
          });
          calcResult.detail.unshift(roomItem);
        }
        // If we have hidden cure items but no roomItem then add these hidden items to the detail array.
        if (!roomItem) {
          hiddenKur.forEach(function (item) {
            if (item.price || item.taxable_price) {
              calcResult.detail.push(new LineItem(item, extras, instructions));
            }
          });
        }

        //add taxes object to results
        calcResult.taxes = {
          tax7: tax7,
          net7: net7,
          sum7: sum7,
          tax19: tax19,
          net19: net19,
          sum19: sum19,
          kurtax: kurtax // used only for final bill checkout
        };
        if (busPauschale) {
          calcResult.detail = _aggregatePauschaleItems(calcResult.detail, configService.loctxt.busPauschale);
        }
        else if (aggregate) {
          calcResult.detail = _aggregateItems(calcResult.detail, aggrTxt, extras); // aggregate the same expenses into one item
        }

        return calcResult;
      };

      // Aggregates the array of bill items (LineItem class) by bill code. The billItems parameter is an array
      // of LineItem objects. The aggrOptions is an array of objects with two properties 'code' and 'text'. The
      // code property is the bill_code value (as defined in the constants service) and the 'text' property is
      // the display text for the aggregated category.
      this.aggregateByBillType = function (billItems, aggrOptions) {
        var aggArr,
            locItems = billItems ? JSON.parse(JSON.stringify(billItems)) : [];

        if (!aggrOptions || aggrOptions.length === 0) {
          return locItems;
        }

        // first pass through items, look for matching item codes and change the text
        locItems.forEach(function (item) {
          aggrOptions.forEach(function (opt) {
            if (item.bill_code === opt.code) {
              item.text = opt.text;
            }
          });
        });

        // now perform a standard aggregation
        aggArr = _aggregateItems(locItems);
        return aggArr;
      };
    //#endregion

    //#region ******* private methods  and constructor initialization *******

      // retrieves a specific expense item based on name gues and room
      function _getExpenseItem(name, roomNo, guest) {
        var exp = null;
        that.res.expenses.forEach(function (e) {
          if (e.name === name && e.room === roomNo && e.guest === guest) {
            exp = e;
          }
        });
        return exp;
      }
        
      // Aggregates all items with the "bus_pauschale" flag set into one item with the total value the sum of all items
      function _aggregatePauschaleItems(sourceArr, pText) {
        var paschale = {text: pText, total: 0},
            aggArr = [];

        sourceArr.forEach(function (item) {
          if (item.bus_pauschale) {
            paschale.total += item.total;
          }
          else {
            aggArr.push(item);
          }
        });

        if (paschale.total) {
          aggArr.push(paschale);
        }

        return aggArr;
      }

      // Function that will aggregate the descriptive items in the source array by combining all items
      // with the same description into one item in which the item's total is the sum of all duplicate items.
      // If text is provided for aggrText parameter then the items are counted by the number of matches and the
      // provided text is used to reformat the message. If the aggrText parameter is not provided, then if the
      // text begins with a number, that number is used as the count  of the aggregated item. The
      // aggregated item display text is adjusted to reflect the count.
      //
      function _aggregateItems(sourceArr, aggrText, extras) {
        var aggArr = [],
            firstOne = true,
            hasTxt = !!(aggrText),// boolean is true if aggrText has a value.
            ix;

        sourceArr.forEach(function (item) {
          _addCountModifyText(item, hasTxt);
          if (firstOne) {
            //item.count = (aggrText) ? 1 : _getItemCount(item.text); //add a property to the original item to keep track of the number of times aggregated
            aggArr.push(item);
            firstOne = false;
          }
          else {
            ix = _hasDetailItem(item, aggArr);
            if (ix !== -1) {
              aggArr[ix].total += item.total;
              aggArr[ix].count += item.count;
              if (aggrText) {
                aggArr[ix].display_string = aggrText;
              }
            }
            else {
              aggArr.push(item);
            }
          }
        });

        // Now modify the text property, either returning the number at the
        // start or adding the aggregation text, then remove the added properties.
        aggArr.forEach(function (agItem) {
          if (hasTxt && agItem.count > 1) {
            agItem.text = convert.formatDisplayString(agItem, extras);
            //delete agItem.display_string;
          }
          else if (agItem.numStart) {
            agItem.text = agItem.count + ' ' + agItem.text; //add back number to text
          }
          //delete agItem.count;
          delete agItem.numStart;
        });

        return aggArr;
      }

      // helper for _aggregateItems, checks for a match with existing items
      function _hasDetailItem(item, arr) {
        var ix = -1;
        for (var i = 0; i < arr.length; i++) {
          if (arr[i].text === item.text) {
            ix = i;
            break;
          }
        }

        return ix;
      }

      // helper for _aggregateItems
      function _addCountModifyText(item, skip) {
        var m = item.text.match(/^\d+\s/),
            n;
        if (m && !skip) { //update text with correct count
          n = Number(m[0]);
          item.count = n;
          item.text = item.text.replace(/^\d+\s/, ''); // remove number at start for correct comparison with other items
          item.numStart = true;
        }
        else { // doesn't start with number or we have text, set count to 1 for aggregation
          item.count = 1;
          item.numStart = false;
        }
      }

      // This method checks critical reservation properties for validity.
      //  It returns an object with an isValid property (true if valid) and a valErrors array of error
      // messages if the reservation is not valid.
      function _validate() {
        var res = that.res,
            vObj = new modalUtility.ErrObj(),
            plan = that.getPlanInReservation(res.plan_code),
            privat = dbEnums.getReservationInsuranceEnum()[3],
            gcnt;

        // first check that a valid plan is specified (plan_code defined and greater than 0), we do not
        // check if the plan code is valid.
        if (!plan) {
          vObj.push(configService.loctxt.val_invalidPlan);
        }
        // check that we have a firm if needed.
        if (that.showFirm && !res.firm) {
          vObj.push(configService.loctxt.val_invalidFirm);
        }        
        // check that we have a guest defined we do not check if guest exists in guest list.
        if (!res.guest || !res.guest.id) {
          vObj.push(configService.loctxt.val_invalidGuest);
        }
        // if we require a second guest make sure we have one
        if ((!that.oneBill && res.occupants === 2) && (!res.guest2 || !res.guest2.id)) {
          vObj.push(configService.loctxt.val_missingGuest2);
        }
        // need at least one room
        if (res.rooms.length === 0) {
          vObj.push(configService.loctxt.val_invalidRoom);
        }
        // dates are defined and end_date > start_date
        if (!res.start_date || !res.end_date || (res.end_date <= res.start_date)) {
          vObj.push(configService.loctxt.val_invalidDates);
        }

        // If a kur plan, make sure we have insurance
        if (that.showInsurance && !that.res.insurance) {
          vObj.push(configService.loctxt.val_invalidInsurance);
        }
        if (that.showInsurance && that.res.occupants === 2 && !that.res.insurance2) {
          vObj.push(configService.loctxt.val_invalidInsurance);
        }
        // if Kur plan make sure that the insurance is private not VDAK or AOK & Andere
        if (that.isKur && (plan && plan.is_plan)
            && ((res.insurance !== privat) || (res.insurance2 && res.insurance2 !== privat))) {
          vObj.push(configService.loctxt.val_invalidPlanInsurance);
        }
        // if group make sure that the number of guests match the number of guests in all of the rooms.
        if (that.isGroup) {
          gcnt = 0;
          that.res.rooms.forEach(function (rm) {
            gcnt += rm.guest_count;
          });
          if (gcnt !== that.res.occupants) {
            vObj.push(configService.loctxt.val_guestCountMismatch);
          }
        }
        return vObj;
      }

/*      //retrieves the required items associated with the current plan.
      function _getPlanRequiredItems() {
        var deferred = $q.defer(),
            curPlan = that.getPlanInReservation(),
            requiredItems = curPlan ? curPlan.required_items : [];

        dashboard.getItemTypesInList(requiredItems).then(function (items) {
          planRequiredItems = items;  // may be empty
          deferred.resolve();
        }, function (err) {
          deferred.reject("Error retrieving plan: " + err);
        });
        return deferred.promise;
      }*/

      // Method to update the expense items to deal with changes to the reservation such as to the number of rooms or
      // occupants.
      // It will try and update existing expenses with the changes made to the reservation. Some changes, such as
      // changing the plan will require replacing the required expenses associated with the plan.
      function _updateRequiredExpenses() {
        var category = dbEnums.getItemTypeEnum()[0], // Retrieve first item category which is the plan items category
            guest = that.res.guest ? that.res.guest.name : '',
            guest2 = that.res.guest2 ? that.res.guest2.name : '',
            roomsChanged = (lastRoomHash !== _buildRoomHash(that.res.rooms, that.res.occupants)),
            changesMade = false,
            replaceAll = false,
            curPlan = that.getPlanInReservation(),
            lstPlan = lastPlanCode ? that.getPlanInReservation(lastPlanCode) : null,
            lastRequiredItems = _getPlanRequiredItemNames(lstPlan),
            roommate = configService.loctxt.roommate,
            rnum, rchanges;

        //Update the count property of items based on the number of nights of the reservation
        // also, check to see if this reservation is a plan with a fixed duration, if so make sure
        // we add or adjust extra nights.
        if (lastNights !== that.res.nights) {
          changesMade = true;

          // first update current expense items. We need to be careful about updating the room items
          // if the plan is a package with fixed days then don't update the room count. Need to add extra days.
          that.res.expenses.forEach(function (exp) {
            if (exp.day_count) {
              if (exp.is_room) {
                if (!curPlan.is_plan) {    //todo with new logic may have to update or add extra night item here
                  exp.count = that.res.nights;
                }
              }
              else {
                exp.count = that.res.nights;
              }
            }
          });
        }

        // If insurance has changed then remove any Kur items
        if (lastInsurance1 !== that.res.insurance) {
          _removeExistingExpenseItemsByBillCode(configService.constants.bcKur, guest)
        }

        if (lastInsurance2 !== that.res.insurance2) {
          _removeExistingExpenseItemsByBillCode(configService.constants.bcKur, (guest2 ? guest2 : 'xxxx')); //bogus name if guest 2 not defined dont want to delete all
        }

        // Update the names associated with the expense items if the names of the guests change and we only have
        // one room. For multi room reservations, this will be handled by looking at room changes
        if (that.oneRoom && (lastGuest !== guest || lastGuest2 !== guest2)) {
          that.res.expenses.forEach(function (exp) {
            switch (exp.guest) {
              case lastGuest:
                exp.guest = that.res.guest.name;
                break;
              case roommate:
                exp.guest = configService.loctxt.roommate;
                break;
              case lastGuest2:
                exp.guest = that.res.guest2.name;
                break;
            }
          });
          changesMade = true;
        }

        // If the plan has not changed but the room hash has changed, see if we can handle changes without replacing
        // all expenses.
        if (that.res.plan_code.equals(lastPlanCode) && roomsChanged) {
          rchanges = _buildRoomChanges(lastRoomInfo, that.res.rooms);
          if (that.res.rooms.length) that.res.rooms[0].update_date = new Date(); // handles bug if only array length changes.
          replaceAll = _updateExpenseRooms(rchanges, curPlan);
          changesMade = true;
        }

        // If plan changed, or we couldn't handle room changes then remove all expense items
        // and replace the required items. This is a drastic move since we could deleted recorded expense items
        // such as food or drink.
        if (!that.res.plan_code.equals(lastPlanCode) || replaceAll) {
          // First see if we can
          // Remove the current required items, retrieve the new required Items and add them to the current reservation
          // (copy and initialize based on business logic) TODO-- Need to refine all this logic based on Billing Logic doc.

          lastRequiredItems.push(configService.loctxt.breakfastInc);
          lastRequiredItems.push(configService.loctxt.cityTax);
          _removeExistingExpenseItemsByCategory(category, lastRequiredItems);
          rnum = curPlan.one_bill && curPlan.one_room ? that.res.rooms[0].number : null;
          _addRequiredExpenses(planRequiredItems, curPlan, rnum);
          _updateResourceExpenses(); // updated any resource expenses if needed
          changesMade = true;
        }
        else {
          changesMade = _updateResourceExpenses(); // updated any resource expenses if needed
        }

        return changesMade;
      }

      // Retrieve the names of the required items that are associated with the specified plan
      function _getPlanRequiredItemNames(plan) {
        var pnames = [];
        if (plan) {
          plan.required_items.forEach(function (itm) {
            pnames.push(itm.name);
          });
        }
        return pnames;
      }
      // Tries to update expenses for multiple rooms. If we can't deal with the changes then the method returns
      // true which tells the caller we need to replace all expenses. This method deals with the array returned
      // from the _buildRoomChanges method. It handles room adds, deletes, swaps as well as room guest name changes and
      // room price changes.
      function _updateExpenseRooms(chgArr, plan) {
        var darr = [],
            aarr = [],
            carr = [],
            ix = -1,
            item, bfast, room;

        if (chgArr && chgArr.length) {
          chgArr.forEach(function (c) { //first categorize room change types into delete, add, or other changes
            ix++;
            if (c.a) aarr.push(ix);
            if (c.d) darr.push(ix);
            if (c.s || c.g || c.g1 || c.p || c.c) carr.push(ix);
          });

          // see if we can handle - if the current room plan is a packaged plan then don't deal with adds or deletes,
          // also if the one room flag is set and we have an add and delete then we changed room types. Safer to not
          // try and handle this. We should be able to handle other changes.
          if ((that.isPackage || that.oneRoom) && (darr.length || aarr.length)) {
            return true;
          }

          // now process in order of deletes, adds, changes
          //room deleted, remove all expense items associated with the specified room number
          darr.forEach(function (i) {
            item = chgArr[i];
            _removeExpenseFromProperty('room', item.r);
          });

          // add the new room's required expenses - also update the room's checked-in flag. We do this here
          // since we have access to all of the info.
          aarr.forEach(function (i) {
            item = chgArr[i];
            room = that.getRoomInReservation(item.r);
            if (room) {
              room.isCheckedIn = datetime.isDate(that.res.checked_in);
            }
            _addRequiredExpenses(planRequiredItems, plan, item.r);
          });

          // handle all other changes
          carr.forEach(function (i) {
            var chng = chgArr[i], rmitem, room;
            if (chng.s) { //swap room numbers
              _updateExpenseRoomProperty(chng.s.oldval, 'room', chng.s.newval);
            }

            if (chng.g1) { //guest name changed for room, change all expense items associated with room for one bill res
              if (plan.one_bill) {
                _updateExpenseRoomProperty(chng.r, 'guest', chng.g1.newval);
              }
              else {
                _updateExpenseProperty('guest', chng.g1.oldval, chng.g1.newval);
              }
            }

            if (chng.g2) { //second guest name changed for room
              if (plan.one_bill) {
                _updateExpenseRoomProperty(chng.r, 'guest2', chng.g2.newval);
              }
              else {
                _updateExpenseProperty('guest2', chng.g2.oldval, chng.g2.newval);
              }
            }

            if (chng.c) { //room occupancy count changed
              rmitem = _getRoomExpenseItem(chng.r);
              rmitem.guest_count = chng.c.newval;
              if (chng.c.oldval < chng.c.newval) {  //added a guest to room, add bfast and kurtax if needed for second guest.
                room = that.getRoomInReservation(chng.r);
                _removeExpenseRoomProperty(chng.r, 'name', configService.loctxt.breakfast); //remove all breakfast and kurtax entries for room
                _removeExpenseRoomProperty(chng.r, 'name', configService.loctxt.kurtax);
                //add breakfast and curtax if needed
                bfast = plan.includesBreakfast ? configService.constants.breakfast : 0;
                _addBreakfastKurtax(room, bfast); //todo check that this works for bus res.
              }
              else if (chng.c.oldval > chng.c.newval) {  //removed guest in room, remove second guest's items.
                _removeExpenseFromProperty('guest', chng.c.oldval);
              }
            }

            if (chng.p) {   //room price changed. We do not handle price logic if business res.
              rmitem = _getRoomExpenseItem(chng.r);
              room = that.getRoomInReservation(chng.r);
              if (rmitem) { //adjust taxable_price if plan includes bfast
                if (plan.includes_breakfast) {
                  rmitem.taxable_price = chng.p.newval - configService.constants.breakfast * room.guest_count;
                  rmitem.taxable_price = rmitem.taxable_price > 0 ? rmitem.taxable_price : 0;
                }
                else {
                  rmitem.taxable_price = 0;
                }
                rmitem.price = chng.p.newval;
              }
            }
          });
        }
        return false;
      }

      // build room change list handle adds, deletes, swaps and price and name changes
      function _buildRoomChanges(oldRms, newRms) {
        var findRm = function (rmNum, rmArray) {
          var rm = null;
          for (var i = 0; i < rmArray.length; i++) {
            if (rmNum === rmArray[i].number) {
              rm = rmArray[i];
              break;
            }
          }
          return rm
        };
        var carray = [],
            darray = [],
            aarray = [],
            sarray = [],
            ix;

        // start by checking old against new
        oldRms.forEach(function (orm) {
          var nrm = findRm(orm.number, newRms),
              rec = {r: orm.number, d: false, a: false, s: null, g1: null, g2: null, p: null, c: null},
              change = false;

          if (nrm) { //check new against old
            if (orm.guest !== nrm.guest) {
              change = true;
              rec.g1 = {oldval: orm.guest, newval: nrm.guest};
            }
            if (orm.guest2 !== nrm.guest2) {
              change = true;
              rec.g2 = {oldval: orm.guest2, newval: nrm.guest2};
            }
            if (orm.count !== nrm.guest_count) {
              rec.c = {oldval: orm.count, newval: nrm.guest_count};
            }
            if (orm.price !== nrm.price) {
              change = true;
              rec.p = {oldval: orm.price, newval: nrm.price};
            }
            if (change) carray.push(rec);
          }
          else {
            darray.push(orm); //add to delete array
          }
        });

        // check for new rooms added
        newRms.forEach(function (nrm) {
          if (!findRm(nrm.number, oldRms)) {
            aarray.push(nrm); // add to add array
          }
        });

        // Now look for swapped rooms and add deletes and adds to list if not swapped
        if (aarray.length > 0 && darray.length > 0) { //check for swaps
          ix = -1;
          darray.forEach(function (dr) {
            var ar;
            ix++;
            for (var i = 0; i < aarray.length; i++) {
              ar = aarray[i];
              if (ar.room_type === dr.type && ar.guest === dr.guest && ar.guest2 === dr.guest2) {
                sarray.push({dr: dr.number, ar: ar.number, dp: oldRms[ix].price, ap: newRms[i].price});
              }
            }
          });

          sarray.forEach(function (sp) {  // now process swaps only update price if they are different.
            carray.push({
              r: sp.ar,
              d: false,
              a: false,
              s: {oldval: sp.dr, newval: sp.ar},
              g1: null,
              g2: null,
              p: sp.dp !== sp.ap ? {oldval: sp.dp, newval: sp.ap} : null
            });
            darray.splice(sp.dx, 1);
            aarray.splice(sp.ax, 1);
          });
        }

        if (aarray.length) {   //anything left is an add
          aarray.forEach(function (nrm) {
            carray.push({r: nrm.number, d: false, a: true, s: null, g1: null, g2: null, p: null});
          });
        }

        if (darray.length) {
          darray.forEach(function (orm) {   //anything left is a delete
            carray.push({r: orm.number, d: true, a: false, s: null, g1: null, g2: null, p: null});
          });
        }

        return carray;
      }

      // method to update the specified property of all expenses items that have the value
      // specified by 'oldval' with the value in the 'newval' parameter
      function _updateExpenseProperty(prop, oldval, newval) {
        that.res.expenses.forEach(function (exp) {
          if (exp[prop] === oldval) {
            exp.last_updated = new Date();
            exp[prop] = newval;
          }
        });
      }

      // method to update the specified property of all expense items with the specified room number
      // with the value in the 'newval' parameter
      function _updateExpenseRoomProperty(rmNum, prop, newval) {
        that.res.expenses.forEach(function (exp) {
          if (exp.room === Number(rmNum)) {
            exp.last_updated = new Date();
            exp[prop] = newval;
          }
        });
      }

      // removes the expense item for the specified room and with the specified property value
      function _removeExpenseRoomProperty(rmNum, prop, propval) {
        var expIDs = [];
        //find expenses to remove
        that.res.expenses.forEach(function (exp) {
          if (exp.room === Number(rmNum) && exp[prop] === propval) {
            expIDs.push(exp._id);
          }
        });
        // now remove the expenses
        expIDs.forEach(function (id) {
          that.res.expenses.id(id).remove();
        });
      }

      // removes expense items where the value of the specified property matches the specified property value
      function _removeExpenseFromProperty(prop, propval) {
        var expIDs = [];
        //find expenses to remove
        that.res.expenses.forEach(function (exp) {
          if (exp[prop] === propval) {
            expIDs.push(exp._id);
          }
        });
        // now remove the expenses
        expIDs.forEach(function (id) {
          that.res.expenses.id(id).remove();
        });
      }

      // gets the room expense item for the specified room
      function _getRoomExpenseItem(rmNum) {
        for (var ix = 0; ix < that.res.expenses.length; ix++) {
          if (that.res.expenses[ix].room === Number(rmNum)) {
            return that.res.expenses[ix];
          }
        }
        return null;
      }

      // removes and replaces the resource related expenses such as parking if needed.
      function _updateResourceExpenses() {
        var curResHash = _buildResourceHash(that.res.resources),
            changesMade = false;

        if (lastResourceHash !== curResHash) {
          _removeExistingResourceExpenseItems();
          _addResourceExpenses();
        }

        return changesMade;
      }

      // Add expense items for the booked resources such as parking
      function _addResourceExpenses() {
        that.res.resources.forEach(function (res) {
          var exp = new Itemtype();
          exp.name = res.resource_type;
          exp.category = dbEnums.getItemTypeEnum()[0];
          exp.bill_code = configService.constants.bcPlanDiverses;
          exp.date_added = datetime.dateOnly(new Date()); //date only ignore time
          exp.last_updated = datetime.dateOnly(new Date()); //date only ignore time
          exp.bus_pauschale = true;
          exp.room = res.room_number;
          exp.guest = res.guest;
          exp.per_person = false;
          exp.no_delete = true; // To remove, we must remove by editing reservation.
          exp.no_display = false;
          exp.display_string = configService.loctxt.parkCharge; //todo-need to change if we introduce other resource types
          exp.day_count = true;
          exp.display_order = 2;
          exp.taxable_price = 0;
          exp.addThisToDocArray(that.res.expenses, res.price, that.res.nights);
        });
      }

      // checks to see if the reservation is a Kur reservation, if so, handle adding the prescription_charge expense
      // item if the insurance requires it and also add or update the copay expense item if the reservation's copay
      // flag is set. Copay is a fixed percentage of all items. It needs to add the amounts for each person in the
      // room. Kur plans are single room plans only. todo-figure out tax on this if any
      function _updatePrescriptionAndCopay() {
        if (that.isKur) {
          var insurance1 = that.res.insurance,
              insurance2 = that.res.insurance2,
              hasCopay1 = that.res.copay,
              hasCopay2 = that.res.copay2,
              checkItems1 = insurance1 !== dbEnums.getReservationInsuranceEnum()[3],
              checkItems2 = insurance2 !== dbEnums.getReservationInsuranceEnum()[3] && that.res.rooms[0].guest2,
              guest1 = that.res.guest.name,
              guest2 = that.res.guest2 ? that.res.guest2.name : '',
              room = that.res.rooms[0].number,
              chkArr = [configService.constants.bcKurPackageItem, configService.constants.bcKur, configService.constants.bcKurSpecial],
              presItm = configService.loctxt.prescription_charge,
              copItm = configService.loctxt.copay,
              copPrct = configService.constants.get('ownContribution') / 100.,
              kursum1 = 0,
              kursum2 = 0,
              prescrip1, prescrip2, copay1, copay2;

          if (checkItems1 || checkItems2) { //process all
            that.res.expenses.forEach(function (item) {
              if (chkArr.indexOf(item.bill_code) !== -1) {
                if (item.name === presItm) {
                  if (item.guest === guest1) {
                    prescrip1 = item;
                  }
                  else {
                    prescrip2 = item;
                  }
                }
                else if (item.name === copItm) {
                  if (item.guest === guest1) {
                    copay1 = item;
                  }
                  else {
                    copay2 = item;
                  }
                }
                else {
                  if (item.guest === guest1) {
                    kursum1 += item.item_total;
                  }
                  else {
                    kursum2 += item.item_total;
                  }
                }
              }
            });
            // now process results
            kursum1 = convert.roundp(kursum1 * copPrct, 2);
            kursum2 = convert.roundp(kursum2 * copPrct, 2);
            if (checkItems1 && !prescrip1) {
              _addPrescriptionCharge(room, guest1, insurance1);
            }

            if (checkItems2 && !prescrip2) {
              _addPrescriptionCharge(room, guest2, insurance2);
            }

            if (checkItems1 && hasCopay1) {
              if (copay1) {
                copay1.price = kursum1;
              }
              else {
                _addCopayItem(room, guest1, kursum1, insurance1);
              }
            }

            if (checkItems2 && hasCopay2) {
              if (copay2) {
                copay2.price = kursum1;
              }
              else {
                _addCopayItem(room, guest2, kursum2, insurance2);
              }
            }
          }

          // If private make sure we remove any items that may be present
          if (insurance1 && !checkItems1) {
            _removeExistingExpenseItemsByBillCode(configService.constants.bcKurSpecial, guest1);
          }
          else if (insurance1 && checkItems1 && !hasCopay1) {
            _removeExistingExpenseItemsByBillCode(configService.constants.bcKurSpecial, [configService.loctxt.copay], guest1)
          }

          if (insurance2 && !checkItems2) {
            _removeExistingExpenseItemsByBillCode(configService.constants.bcKurSpecial, guest2);
          }
          else if (insurance2 && checkItems2 && !hasCopay2) {
            _removeExistingExpenseItemsByBillCode(configService.constants.bcKurSpecial, [configService.loctxt.copay], guest2)
          }

        }
      }

      // add prescription charge expense item
      function _addPrescriptionCharge(room, guest, insurance) {
        var exp = new Itemtype(),
            price = configService.constants.get("prescriptionCharges");

        exp.name = configService.loctxt.prescription_charge;
        exp.category = insurance;
        exp.bill_code = configService.constants.bcKurSpecial;
        exp.date_added = datetime.dateOnly(new Date()); //date only ignore time
        exp.last_updated = datetime.dateOnly(new Date()); //date only ignore time
        exp.room = room;
        exp.guest = guest;
        exp.is_room = false;
        exp.per_person = true;
        exp.fix_price = true;
        exp.no_delete = true;
        exp.no_display = true; //must be true for bill logic to work
        exp.included_in_room = false;
        exp.day_count = false;
        exp.one_per = true;
        exp.low_tax_rate = true;
        exp.display_order = 5;
        exp.display_string = "%name%";
        exp.price = price;
        exp.count = 1;
        exp.addThisToDocArray(that.res.expenses);
      }

      // add copay charge expense item
      function _addCopayItem(room, guest, copayAmt, insurance) {
        var exp = new Itemtype();

        exp.name = configService.loctxt.copay;
        exp.category = insurance;
        exp.bill_code = configService.constants.bcKurSpecial;
        exp.date_added = datetime.dateOnly(new Date()); //date only ignore time
        exp.last_updated = datetime.dateOnly(new Date()); //date only ignore time
        exp.room = room;
        exp.guest = guest;
        exp.is_room = false;
        exp.per_person = true;
        exp.fix_price = true;
        exp.no_delete = true;
        exp.no_display = true; //must be true for bill logic to work
        exp.included_in_room = false;
        exp.day_count = false;
        exp.one_per = true;
        exp.low_tax_rate = true;
        exp.display_order = 5;
        exp.display_string = "%name%";
        exp.price = copayAmt;
        exp.count = 1;
        exp.addThisToDocArray(that.res.expenses);
      }

      // Removes expenses by category. If the specificItems parameter is specified (array)
      // Then only the specific items (by name) in the array (in the specified category) will be removed.
      function _removeExistingExpenseItemsByCategory(category, specificItems) {
        // first find all of the matching expense item ids
        var matches = [];

        that.res.expenses.forEach(function (exp) {
          if (exp.category === category) {
            if (specificItems && specificItems.length) {
              if (specificItems.indexOf(exp.name) !== -1) {
                matches.push(exp._id);
              }
              else {
                matches.push(exp._id); //specific items not specified, remove all category items
              }
            }
          }
        });

        // now remove these items from the reservation
        matches.forEach(function (id) {
          that.res.expenses.id(id).remove();
        });
      }

      // Removes expenses by bill code. If the specificItems parameter is specified (array)
      // Then only the specific items (by name) in the array (with the specified bill code) will be removed.
      // If the guest is specified then only the items specific to the guest will be removed.
      function _removeExistingExpenseItemsByBillCode(code, guest, specificItems) {
        // first find all of the matching expense item ids
        var matches = [];

        that.res.expenses.forEach(function (exp) {
          if (exp.bill_code === code) {
            if (specificItems && specificItems.length) {
              if (specificItems.indexOf(exp.name) !== -1) {
                if (!guest || exp.guest === guest) {
                  matches.push(exp._id);
                }
              }
            }
            else {
              if (!guest || exp.guest === guest) {
                matches.push(exp._id);
              }
            }
          }
        });

        // now remove these items from the reservation
        matches.forEach(function (id) {
          that.res.expenses.id(id).remove();
        });
      }

      // Removes the existing expenses related to any booked resources (such as parking)
      function _removeExistingResourceExpenseItems() {
        var resExp = [];
        var resources = dbEnums.getResourceTypeEnum();

        // find all of the resource related expenses
        that.res.expenses.forEach(function (exp) {
          resources.forEach(function (res) {
            if (exp.name === res) {
              resExp.push(exp._id);
            }
          });
        });

        // now remove these items from the reservation
        resExp.forEach(function (id) {
          that.res.expenses.id(id).remove();
        });
        // NOTE: This code is a kluge to work around a Tingus driver bug that will not save a removed sub-document correctly
        // unless some other sub-document is modified. We do this here incase the user only removes a resource and nothing
        // else.
        if (that.res.expenses.length) {
          that.res.expenses[0].last_updated = new Date(); //typically the room expense
        }
      }

      // Adds all of the required expense items to a reservation as defined by the 'required_items' property of the
      // reservation's selected plan. Business logic:
      // Items are added for each room in the reservation unless the roomNum is specified, then only add items for that room.
      // Create the room expense item. If the plan is a package plan then get the room price from the plan object
      // If an item has the 'per_person' property set true then the item is added for each person in a room
      // The plan must have one required item that represents the room expense ('is_room' property true)
      // Breakfast is added automatically if the plan specifies ('includes_breakfast' property true) but is not displayed,
      // also the room price is internally adjusted for tax purposes but displays the price including breakfast.
      // If 'includesBusBreakfast' is set then breakfast is added as a displayable item and the displayed room price is adjusted
      // Kurtaxe is added automatically to each person in each room.
      // The taxable_rate property is calculated for the room expense item since components such as breakfast that may
      //  be included in the room price are taxed at a different rate.
      function _addRequiredExpenses(items, curPlan, roomNum) {
        // Process each required item
        // First find if breakfast is part of the room plan. We need to get the price being charged.
        // The logic is extended for any other item that are "baked in" to the room price.
        var includedInPrice = 0,
            singleRoom = roomNum ? that.getRoomInReservation(roomNum) : null;

        // first  get the price of any item other than breakfast that is included in room price but has a different
        // tax rate than the room. (Currently only breakfast but able to handle other custom items) NOTE: breakfast
        // items should not be part of the plan's required item list. Breakfast items are generated as needed based on
        // the .includes_breakfast flag.
        items.forEach(function (item) {
          if (item.included_in_room) {
            includedInPrice = includedInPrice + item.price;
          }
        });
        // Now add breakfast price if the plan includes it.
        if (curPlan.includes_breakfast) {
          includedInPrice = includedInPrice + configService.constants.breakfast;
        }

        // Now add the room expense item and implement the room logic..
        // Each plan should have at least one room ExpenseItem associated with it.
        // Kurtax and breakfast items are also added for each person in the room if needed.
        if (singleRoom) {
          _addRoomTaxBreakfast(singleRoom, curPlan, includedInPrice);
        }
        else {
          that.res.rooms.forEach(function (room) {
            _addRoomTaxBreakfast(room, curPlan, includedInPrice);
          });
        }

        // now add any required items to the reservation
        items.forEach(function (item) {
          // update price if it is a lookup
            item.price = item.price_lookup ? configService.constants.get(item.price_lookup) : item.price;
          // Implement item for each room as needed or only to a single room
          if (singleRoom) {
            // add item or items if item needs to be duplicated.
            _addExpenseItem(singleRoom, item);
          }
          else {
            that.res.rooms.forEach(function (room) {
              _addExpenseItem(room, item);
            });
          }
        });
      }

      // Implements the complex business logic around adding the room component to the total bill. Also
      // adds breakfast and kurtax entries (if needed) for each person in the room for non-business reservations.
      // May break out a room component for each person in a double room if needed. Can also add an extra days item if
      // the # of nights of the reservation exceed the duration of a plan.
      function _addRoomTaxBreakfast(room, curPlan, includedInPrice) {

        var price,
            count,
            extraDays = 0,
            isSingleRoom = (room.guest_count == 1),
            taxable_price = 0,
            roomDiff,
            roomItems;

        // is the plan a "package plan"?
        if (curPlan.is_plan) {
          // We must adjust the price if the per person plan price associated with the room is different
          // than the default plan price.
          roomDiff = (that.planPrice - room.price) / curPlan.duration;

          price = isSingleRoom ? (curPlan.single_room_price - roomDiff) : (curPlan.double_room_price - roomDiff);
          count = curPlan.duration;
          extraDays = that.res.nights - curPlan.duration; // do we need to add or subtract extra days?

          // Included component is typically breakfast. We need to add an expense item for it (can be generic)
          // If there is an included item, it is probable at a different tax rate so remove it for the  price.
          if (includedInPrice) {
            taxable_price = (price - (includedInPrice * room.guest_count));
            if (taxable_price < 0) taxable_price = 0;
          }
        }
        else { // Get the room price from the reservation reservedRoom object and if breakfast is
          // part of the room plan then remove the breakfast part and set it to the taxable rate.
          // If there is two people in the room then we need to subtract twice the breakfast cost.
          price = room.price;
          count = that.res.nights;
          if (includedInPrice) {
            taxable_price = (price - (includedInPrice * room.guest_count));
            if (taxable_price < 0) taxable_price = 0;
          }
          // If a business reservation and the firm includes breakfast then reduce the room price
          // by the amount of the breakfast.
          if (that.isBusiness && that.includesBusBreakfast) {
            price = room.price - configService.constants.breakfast;
          }
        }
        // Build room expense item and add it then add Breakfast and Kurtax if needed
        var exp = new Itemtype();
        exp.name = configService.loctxt.room;
        exp.category = dbEnums.getItemTypeEnum()[0];
        exp.bill_code = configService.constants.bcRoom;
        exp.is_room = true;
        exp.per_person = (that.isBusiness || curPlan.is_plan);  //todo-do we need true for kur, was not that way before.
        exp.no_delete = true;
        exp.no_display = true;
        exp.day_count = true;
        exp.edit_name = false;
        exp.low_tax_rate = true;
        exp.taxable_price = taxable_price;
        exp.display_string = configService.loctxt.roomDisplayString;
        exp.display_order = 1;

        _addExpenseItem(room, exp, price, count);
        _addBreakfastKurtax(room, includedInPrice);

        if (extraDays) {
          _addExtraPackageDaysExpense(exp, price, extraDays);
        }
      }

      // Creates and adds expense items for included expenses (breakfast) and kurtaxe for non business reservations
      function _addBreakfastKurtax(room, includedInPrice) {
        if (that.isBusiness && that.includesBusBreakfast) {
          var exp = new Itemtype();
          exp.name = configService.loctxt.breakfast;
          exp.category = dbEnums.getItemTypeEnum()[0];
          exp.bill_code = configService.constants.bcMeals;
          exp.per_person = true;
          exp.no_delete = false;
          exp.no_display = false;
          exp.included_in_room = false;
          exp.day_count = true;
          exp.edit_count = true;
          exp.fix_price = true;
          exp.low_tax_rate = false;
          exp.bus_pauschale = true;
          exp.display_order = 2;
          exp.display_string = '%count% %name% à %price%';
          exp.taxable_price = 0;
          exp.price = configService.constants.get('breakfast');
          _addExpenseItem(room, exp);
        }
        else if (includedInPrice) {
          var exp = new Itemtype();
          exp.name = configService.loctxt.breakfastInc;
          exp.category = dbEnums.getItemTypeEnum()[0];
          exp.bill_code = configService.constants.bcPackageItem;
          exp.per_person = true;
          exp.no_delete = true;
          exp.no_display = true;
          exp.included_in_room = true;
          exp.day_count = true;
          exp.fix_price = true;
          exp.low_tax_rate = false;
          exp.display_order = 2;
          exp.taxable_price = includedInPrice;
          exp.price = 0;
          _addExpenseItem(room, exp);
        }

        //now add city tax (kurtax) if required
        if (that.requiresKurtax) {
          exp = new Itemtype();
          exp.name = configService.loctxt.cityTax;
          exp.category = dbEnums.getItemTypeEnum()[0];
          exp.bill_code = configService.constants.bcKurTax;
          exp.bus_pauschale = true;
          exp.per_person = true;
          exp.day_count = true;
          exp.no_delete = true;
          exp.fix_price = true;
          exp.one_per = true;
          exp.low_tax_rate = true;
          exp.display_string = configService.loctxt.addedKurtaxDisplayString;
          exp.display_order = 3;
          _addExpenseItem(room, exp, configService.constants.cityTax);
        }
      }

      //Simple method to add an expense item, It will duplicate item if needed based on the item flags and room guest
      // count
      function _addExpenseItem(room, item, price, count, guest) {
        var expCnt = that.res.expenses.length === 0 ? 0 : that.res.expenses.length - 1,
            i,
            result = [];

        item.room = room.number;
        item.guest = guest ? guest : room.guest;
        item.date_added = datetime.dateOnly(new Date()); //date only ignore time
        item.last_updated = datetime.dateOnly(new Date()); //date only ignore time
        count = count ? count : (item.day_count ? that.res.nights : null);
        item.addThisToDocArray(that.res.expenses, price, count);

        // Now determine if we have to add another item for the second guest in the room
        // For business reservations, and kur reservations we need a name of the second quest.
        // For personal reservations, we only expect one room and we go by the # of occupants
        // For tour group reservations, we can have multiple rooms but only one name is needed.
        // For standard reservation with package items, for two people don't add another, just modify the
        // count of the last item added
        if (item.per_person && room.guest_count === 2) {
          item.guest = room.guest2 ? room.guest2 : configService.loctxt.roommate;
          item.addThisToDocArray(that.res.expenses, price, count);

          /*if (that.oneBill && !that.isGroup && item.bill_code === configService.constants.bcPackageItem) {
            var rlen = that.res.expenses.length - 1;
            that.res.expenses[rlen].count = that.res.expenses[rlen].count * 2; //double count
          }
          else { //add item for second person
            item.guest = room.guest2 ? room.guest2 : room.guest + '-' + configService.loctxt.roommate;
            item.addThisToDocArray(that.res.expenses, price, count);
          }*/
        }

        //Now return the item or items just added
        for (i = expCnt; i < that.res.expenses.length; i++) {
          result.push(that.res.expenses[i]);
        }
        return result;
      }

      // Adds an expense item for extra days in the room. This method creates a new ExpenseItem object rather than
      // adding an existing one. It adds an item with the is_room flag set, it is displayed on the bill and the default
      // room price added is the current price of the main room (daily plan price).
      function _addExtraPackageDaysExpense(roomItem, price, days) {
        var room = that.getRoomInReservation(roomItem.room);

        if (days) { //safety check
          var exp = new Itemtype();
          exp.name = configService.loctxt.extra_days_item;
          exp.category = dbEnums.getItemTypeEnum()[0]; //plan
          exp.bill_code = configService.constants.bcExtraRoom;
          exp.is_room = false;
          exp.per_person = false;
          exp.no_delete = true;
          exp.no_display = false;
          exp.included_in_room = false;
          exp.day_count = true;
          exp.low_tax_rate = true;
          exp.display_order = 3;
          exp.display_string = configService.loctxt.addedExtraDaysDisplayString;
          exp.price = roomItem.price;
          exp.count = days;
          exp.taxable_price = roomItem.taxable_price;
          _addExpenseItem(room, exp, price, days);
        }
      }

      // Adds a bill number sub document to the Reservation.bill_numbers property. Updates if it exists.
      function _addBillNumberItem(room, guest, billNo) {
        var bn = {
              room_number: room,
              guest: guest,
              billNo: billNo
            }, // object that will have the same properties as the BillNumber schema
            bitem = null;

        that.res.bill_numbers.forEach(function (bit) {
          if (bit.room_number === room && bit.guest === guest) {
            bitem = bit;
          }
        });
        if (bitem) { // update
          bitem.billNo = bn.billNo;
        }
        else {
          that.res.bill_numbers.push(bn);
        }
      }

      // Adds a TaxItem sub document to the Reservation.taxes property. Calculates total for specified bill
      function _addTaxItem(room, guest) {
        var ti = {}, // object that will have the same properties as the TaxItem schema
            cr = that.calculateTotals([], room, guest),
            titem = null;
        ti.room_number = room;
        ti.guest = guest;
        ti.net7 = convert.roundp(cr.taxes.net7, 2);
        ti.tax7 = convert.roundp(cr.taxes.tax7, 2);
        ti.sum7 = convert.roundp(cr.taxes.sum7, 2);
        ti.net19 = convert.roundp(cr.taxes.net19, 2);
        ti.tax19 = convert.roundp(cr.taxes.tax19, 2);
        ti.sum19 = convert.roundp(cr.taxes.sum19, 2);
        ti.bill_total = convert.roundp(cr.sum, 2);
        ti.kurtax_total = convert.roundp(cr.taxes.kurtax, 2);
        // see if an item for the room/guest combo exists.
        that.res.taxes.forEach(function (tit) {
          if (tit.room_number === room && tit.guest === guest) {
            titem = tit;
          }
        });
        if (titem) { //update
          titem.net7 = ti.net7;
          titem.tax7 = ti.tax7;
          titem.sum7 = ti.sum7;
          titem.net19 = ti.net19;
          titem.tax19 = ti.tax19;
          titem.sum19 = ti.sum19;
          titem.bill_total = ti.bill_total;
          titem.kurtax_total = ti.kurtax_total;
        }
        else { //add new
          that.res.taxes.push(ti);
        }
      }

      // Updates the taxable_price property of the room expense item if its price has been changed by the user.
      // The taxable_price is simply the room item's price minus the sum of any items (such as breakfast) that
      // have their 'included_in_room' flag set.
      function _updateRoomTaxablePrice(item) {
        var includedInPrice = 0,
            room = that.getRoomInReservation(item.room),
            iprice;

        //Total any items (such as breakfast) that is included in room price. There should be individual items for
        // each person in the room for breakfast.
        that.res.expenses.forEach(function (exp) {
          if (exp.room === item.room && exp.included_in_room) {
            iprice = exp.taxable_price ? exp.taxable_price : exp.price; //Taxable price always has priority
            includedInPrice = includedInPrice + iprice;
          }
        });

        item.taxable_price = item.price - includedInPrice;
        if (item.taxable_price < 0) item.taxable_price = 0;

        // update the room price to reflect the change in the expense item
        room.price = item.price;
        room.update_date = new Date();
      }

      // If the number of nights change then update  count of the items that have their day_count flag set to true
      // NOTE: there is special logic required for room items. Need to check for a plan, If days differ from plan
      // duration, then we must update/add an extra days expense item. This logic assumes that there is only one
      // room associated with plan items
      function _updateDayCount() {
        var nights = that.res.nights,
            includedInRoom = 0,
            roomItem,
            duration,
            extraDaysItem,
            id,
            curPlan,
            diff;

        if (nights !== lastNights) {
          curPlan = that.getPlanInReservation();
          duration = curPlan.duration;

          that.res.expenses.forEach(function (item) {  //process all items
            if (item.included_in_room) {
              includedInRoom += (item.taxable_price ? item.taxable_price : item.price);
            }

            if (item.day_count) {
              if (item.is_room && curPlan.is_plan && item.name !== configService.loctxt.extra_days_item) { //plan, room item
                roomItem = item;
              }
              else if (curPlan.is_plan && item.name === configService.loctxt.extra_days_item) { // extra days
                extraDaysItem = item;
              }
              else if (item.is_room) { //non plan room, adjust the count
                item.count = nights;
              }
              else {
                item.count = nights;
              }
            }
          });

          //Processed all items, now lets see if we need to adjust or add an extra days item.
          if (curPlan.is_plan) {
            diff = nights - duration;
            if (diff !== 0) {
              if (extraDaysItem) {
                extraDaysItem.count = diff;
              }
              else { //need to add an extradays items
                _addExtraPackageDaysExpense(roomItem, diff);
              }
            }
            else if (diff === 0 && extraDaysItem) { //Remove item, days were adjusted to plan
              id = extraDaysItem._id;
              that.res.expenses.id(id).remove();
            }
          }
        }
      }

      //method to update the address information associated with the reservation and to check for name changes for the
      // guest. If the name has changed then we need to update the room and existing expenses with the new guest name.
      // We also need to retrieve specific firm information.
      function _updateNameFirmAddressReqItems() {
        var deferred = $q.defer(),
            updateFromFirm = that.showFirm,
            curGuestName = that.res.guest.name;

        if (updateFromFirm) {
          dashboard.getFirmByName(that.res.firm).then(function (firm) {
            if (firm) {
              that.res.address1 = firm.address1;
              that.res.address2 = firm.address2;
              that.res.city = firm.city;
              that.res.post_code = firm.post_code;
              that.res.country = firm.country;
              that.includesBusBreakfast = firm.includes_breakfast;
              //deferred.resolve();
            }
            else {
              deferred.reject('ERROR: Invalid or missing Firm: ' + that.res.firm);
            }
          }, function (err) {
            deferred.reject("Error retrieving firm: " + err);
          });
        }
        dashboard.getGuestById(that.res.guest.id).then(function (guest) {
          if (guest) {
            if (!updateFromFirm) {
              that.res.address1 = guest.address1;
              that.res.address2 = guest.address2;
              that.res.city = guest.city;
              that.res.post_code = guest.post_code;
              that.res.country = guest.country;
            }
            if (guest.name !== curGuestName) {  // name has changed for the id
              that.res.guest.name = guest.name;
              that.res.rooms.forEach(function (rm) {
                if (rm.guest === curGuestName) {
                  rm.guest = guest.name;
                }
              });
              var mdate = new Date();
              that.res.expenses.forEach(function (exp) {
                if (exp.guest === curGuestName) {
                  exp.guest = guest.name;
                  exp.last_updated = mdate;
                }
              });
            }
            deferred.resolve();
          }
          else {
            deferred.reject('ERROR: Invalid or missing Guest: ' + that.res.guest.name);
          }
        }, function (err) {
          deferred.reject("Error retrieving Guest: " + err);
        });

        return deferred.promise;
      }

      // General function that removes all embedded documents from the specified Model document array
      function _removeAllEmbeddedDocs(docArray) {
        var ids = [];
        docArray.forEach(function (doc) {  // Find the IDs of all embedded docs
          ids.push(doc._id);
        });
        ids.forEach(function (id) {
          docArray.id(id).remove();
        });
      }

      // Builds a hash from the reservation rooms array. Used to determine if the rooms and or occupants have changed
      function _buildRoomHash(rooms, occupants) {
        var hash = 0,
            ix = rooms.length + 2,
            strHash = function (s) {
              if (s) {
                return s.split("").reduce(function (a, b) {
                  a = ((a << 5) - a) + b.charCodeAt(0);
                  return a & a
                }, 0);
              }
              else {
                return 0;
              }
            };
        rooms.forEach(function (room) {
          var rp = room.price > 0 ? room.price : 66;
          hash = hash + (room.number * room.price * ix * occupants + strHash(room.guest) + strHash(room.guest2));
          ix--;
        });
        return hash;
      }

      // Builds a hash from the resources array. Used to determine if the resources have changed.
      function _buildResourceHash(resources) {
        var hash = 0;
        var ix = resources.length + 2;
        resources.forEach(function (resources) {
          var g = resources.guest ? resources.guest.length : 1;
          g = g + resources.name.length;
          hash = hash + (resources.room_number * resources.price * ix * g);
          ix--;
        });
        return hash;
      }

      // filters the room plan list based on the reservation type provided
      // if curPlanCode provided then it will also set the selectedPlan property
      // to the current plan. Else it will set it to default value. It will filter
      // out deleted plans
      function _filterRoomPlans(resType, curPlanCode) {
        var firstItem = {value: 0, name: that.roomPlanFirstText};
        var errorItem = {value: 0, name: '*** ERROR ***'};
        var defIndex = 0;
        var rPlans = []; //filtered list based on reservation type
        if (that.roomPlansAll && that.roomPlansAll.length > 0) {
          if (that.roomPlanFirstText.length) {
            rPlans.push(firstItem);
          }
          var selected = null;
          that.roomPlansAll.forEach(function (plan) {
            if (plan.resTypeFilter.indexOf(resType) !== -1) {
              var pobj = {value: plan._id, name: plan.name};
              if (!plan.deleted) rPlans.push(pobj);
              if (typeof(curPlanCode) === 'object' && pobj.value.toString() === curPlanCode.toString()) {
                selected = pobj;
              }
              if (plan.is_default) {
                defIndex = rPlans.length - 1;
              }
            }
          });

          //If only one entry then remove the first entry added  above
          if (rPlans.length === 2) {
            rPlans.splice(0, 1);
          }
        }
        else {
          rPlans.push(errorItem);
        }
        that.roomPlans = rPlans;
        that.selectedPlan = selected ? selected : that.roomPlans[defIndex];
        that.roomPlanChanged(); //update certain VM model properties based on plan.
      }

      // Returns the complete room plan object based on which plan was chosen. (selectedPlan)
      // The plan list displayed to the UI only contains the name and id of the actual plan object
      function _findSelectedPlan() {
        var selPlan = undefined;
        that.roomPlansAll.forEach(function (plan) {
          if (plan._id === that.selectedPlan.value) {
            selPlan = plan;
          }
        });
        return selPlan;
      }
    //#endregion

    //#region *** Constructor initialization ***
      // Now that everything is defined, initialize the VM based on the reservation model
      // perform model setup actions
      if (reservation) {
        lastPlanCode = reservation.plan_code ? reservation.plan_code : undefined;
        lastGuest = reservation.guest ? reservation.guest.name : '';
        lastGuest2 = reservation.guest2 ? reservation.guest2.name : '';
        lastFirm = reservation.firm ? reservation.firm : '';
        lastNights = reservation.nights;
        lastRoomHash = _buildRoomHash(reservation.rooms, reservation.occupants);
        lastResourceHash = _buildResourceHash(reservation.resources);
        lastInsurance1 = reservation.insurance; // ? reservation.insurance : '';
        lastInsurance2 = reservation.insurance2; // ? reservation.insurance2 : '';

        if (reservation.rooms.length) {
          reservation.rooms.forEach(function (room) {
            lastRoomInfo.push({
              number: room.number,
              guest: room.guest,
              guest2: room.guest2,
              price: room.price,
              type: room.room_type,
              count: room.guest_count
            });
          });
        }
        _filterRoomPlans(reservation.type, reservation.plan_code);
        this.nights = reservation.nights; //The reservation model's nights property is calculated and read only.
      }
    //#endregion
    }; //End of VM class

    //#region *** Start of ViewModel factory. Has methods to return the VM class with a new or existing VM.
    return { //exposes an object with the following methods to the application
      /**
       * Async function that creates a new Reservation model with a new reservation number, wraps the reservation
       * in a new ViewModel and returns the view model.
       * The method will also initialize the start_date, end_date, nights and occupants properties of the reservation
       * with default values. It will select the default reservation type of standard and a room plan of single room.
       * @param {date} startDate - reservation start date
       * @param {date} endDate - reservation end date.
       */
      newReservationVM: async function (startDate, endDate) {
        // Create the VM and get the required data from other collections to populate various static lists
        // in the VM.
        let rvm,
            start = datetime.isDate(startDate) ? datetime.dateOnly(startDate) : datetime.dateOnly(new Date()),
            end = datetime.isDate(endDate) ? datetime.dateOnly(endDate) : datetime.dateOnly(new Date(), 1);

        try { // get a unique reservation number and create the Reservation model with defaults
          let roomPlanList = await dashboard.getRoomPlanList(true);         
          let itemTypeList = await dashboard.getItemTypeList();
          let resNo = await  dashboard.getNewReservationNumber();
          let reservation = new Reservation();
          reservation.reservation_number = resNo;
          reservation.start_date = start;
          reservation.start_dse = datetime.daysSinceEpoch(start);
          reservation.end_date = end;
          reservation.end_dse = datetime.daysSinceEpoch(end);
          reservation.occupants = 1;
          rvm = new reservationVM(reservation, roomPlanList, itemTypeList);
          reservation.type = rvm.resTypeList[0]; //defaults to standard reservation
          reservation.status = rvm.statusList[0];
          reservation.source = rvm.sourceList[0];
          rvm.reservationTypeChanged(); //force an update since we added a default type to the new reservation.
          await rvm.updateAvailableRoomsAndResources();
          console.log("Reservation " + reservation.reservation_number + " created");
          return rvm;
        } catch (err) {
          throw new modalUtility.ErrObj(err);
        }
      },
      /**
       * Async function that retrieves the specified reservation and returns a view model containing the 
       * reservation model.
       * @param {num} resnum - the reservation number of the reservation to retrieve.
       * @param {bool} readOnly - if true then the reservation is retrieved but the available rooms list is not.
       */
      getReservationVM:  async function getReservationVM(resnum, readOnly) {
        try {
          let roomPlanList = await dashboard.getRoomPlanList();
          let itemTypeList = await dashboard.getItemTypeList();
          let reservation = await dashboard.getReservationByNumber(resnum);
          let rvm = new reservationVM(reservation, roomPlanList, itemTypeList, true);
          rvm.guest1rec = await dashboard.getGuestById(rvm.res.guest.id);
          if(rvm.res.guest2) {
            rvm.guest2rec = await dashboard.getGuestById(rvm.res.guest2.id);
          }
          
          if (!readOnly) {
            await rvm.updateAvailableRoomsAndResources();
          }
          console.log("Reservation " + reservation.reservation_number + " loaded");
          return rvm;
        } catch (err) {
          throw new modalUtility.ErrObj(err);
        }
      }
    }; //end of factory
    //#endregion
  });
});