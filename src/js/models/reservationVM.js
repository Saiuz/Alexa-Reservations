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
 */
define(['./module'], function (model) {
  'use strict';
  model.factory('ReservationVM', function ($q, Reservation, Itemtype, dbEnums, dashboard, datetime, configService, utility, convert) {
    console.log("Invoking ReservationVM");

    // ******* Define the View Model object
    // ******* ViewModel definition  ********
    var reservationVM = function (reservation, roomPlanList, itemTypeList, loadExisting) {
      var that = this; // for internal function reference

      // *** public properties assigned to VM and initialization code
      this.res = reservation; // The Reservation (Mongoose model) that this ViewModel works with.
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
      this.oneBill = false; // viewmodel property that is true if the selected plan is a group plan and requires a single bill.
      this.oneRoom = true; // viewmodel property that is true if the selected plan has the one_room flag set
      this.secondGuest = false; // VM property that is true if selected plan has the second_guest flag set
      this.showSecondGuest = false; // VM property that is true if selected plan has the second_guest flag set and the
                                    // reservation has 2 guests and  and the plan has the one_room flag set
      this.includesBreakfast = false; // True if selected plan includes breakfast.
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
      var rOpts = [];
      this.resTypeList.forEach(function (item) {
        rOpts.push({value: item, text: item});
      });
      this.resTypeOptions = rOpts;
      this.occupantOptions = [
        {value: 1, text: '1'},
        {value: 2, text: '2'},
      ];

      // used by pre-save function. Set to the initial value of the plan property of the reservation
      var lastPlanCode;
      var lastGuest;
      var lastGuest2;
      var lastFirm;
      var lastNights;
      var lastRoomHash;
      var lastRoomInfo = [];
      var lastResourceHash;

      // *** Public methods assigned to VM ***

      // Utility method to return a room type abbreviation from a reservedRoom item
      this.generateRoomAbbrv = function (rrObj) {
        return dbEnums.getRoomDisplayAbbr(rrObj);
      }

      // Respond to change of reservation type from UI.
      // If a reservation type is changed, then we will remove any rooms currently attached, remove any expenses
      // attached to the current reservation. This is needed because billing logic may be totally different for
      // different types and much of the billing logic is based on the expense items associated with the reservation.
      this.reservationTypeChanged = function () {
        console.log("Reservation type changed to " + this.res.type);
        _removeAllEmbeddedDocs(that.res.rooms);
        _removeAllEmbeddedDocs(that.res.expenses);
        _filterRoomPlans(this.res.type, undefined);
        //if there is a pre-selected plan, not the default, then execute the roomPlanChanged method
        //if (this.selectedPlan.value) {
        this.roomPlanChanged();
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
            that.res.rooms[0].guest2 = that.res.occupants === 1 ? '' : that.res.rooms[0].guest2
          }

          var rdates = that.cleanResDates();
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
          // Update reservation fields with plan information
          this.res.plan = plan.name;
          this.res.plan_code = plan._id.id;
          this.res.individualBill = (plan.is_group && !plan.one_bill);
          // Set public boolean properties based on plan
          this.showFirm = plan.needs_firm;
          this.showInsurance = plan.needs_insurance;
          this.single_only = plan.single_only;
          this.double_only = plan.double_only;
          this.isGroup = plan.is_group;
          this.oneBill = plan.one_bill;
          this.oneRoom = plan.one_room;
          this.secondGuest = plan.second_guest;
          this.includesBreakfast = plan.includes_breakfast;
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
            if (this.double_only && this.res.occupants === 1) {
              this.res.occupants = 2;
            }
            else if (this.single_only && this.res.occupants > 1) {
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
          this.res.plan_code = 0;
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
        var rdates = that.cleanResDates();
        this.nights = datetime.getNightsStayed(new Date(rdates.start), new Date(rdates.end));
        return {  //returned the clean dates
          start: rdates.start,
          end: rdates.end
        };
      };

      // Utility routine that will clean the reservation start and end dates, remove the time portion.
      // Returns a simple object with the cleaned dates in the start and an end properties.
      this.cleanResDates = function () {
        if (this.res) {
          return {
            start: datetime.dateOnly(new Date(this.res.start_date)),
            end: datetime.dateOnly(new Date(this.res.end_date))
          };
        }
        else {
          return {start: null, end: null};
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
        var rdates = that.cleanResDates(); //retrieve reservation dates and clean of time portion
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

      // guest changed, perform logic to update guest name in room if needed.
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

      // Utility method that retrieves the room expense item in the reservation for the specified room number and guest
      this.getRoomExpenseInReservation = function (roomNum, guest) {
         var roomExp = null;
        for(var i = 0; i < this.res.expenses.length; i++) {
          if (this.res.expenses[i].room === roomNum
              && this.res.expenses[i].guest === guest
              && this.res.expenses[i].is_room) {
            roomExp = this.res.expenses[i];
            break;
          }
        }
        return roomExp;
      }

      // Utility to retrieve the specified reservedRoom object from the reservation's rooms property
      this.getRoomInReservation = function (roomNum) {
         var room = null;
        for(var i = 0; i < this.res.rooms.length; i++) {
          if (this.res.rooms[i].number === roomNum) {
            room = this.res.rooms[i];
            break;
          }
        }
        return room;
      }

      // method retrieves the plan object that is associated with the reservation, or if
      // the 'planID' parameter is specified  then it retrieves that plan object.
      this.getPlanInReservation =  function (planID) {
        var curPlan = null,
            pid = planID ? planID : that.selectedPlan.value;

        that.roomPlansAll.forEach(function (plan) {
          if (plan._id.id === pid) {
            curPlan = plan;
          }
        });

        return curPlan;
      }

      // method to generate the plan / room display string for the reservation. It returns an object with the following
      // properties:
      //    roomGuest1 - name of the main guest in a room
      //    roomGuest2 - name of the second guest in a room
      //    groupRooms - an array of objects containing the room number and main guest name for each room in a group
      //                 reservation. Can be used by the UI.
      //    displayText - a formatted string containing the plan description with unit price.
      //
      this.generatePlanRoomString = function (room, guest) {
        var rmExp = that.getRoomExpenseInReservation(room, guest),
            plan = that.getPlanInReservation(),
            extras = {},
            rmObj = that.getRoomInReservation(room),
            result = {roomGuest1: undefined, roomGuest2: undefined, groupRooms: [], displayText: '****'};

        if (rmExp) {
          rmObj = that.getRoomInReservation(room);
          result.roomGuest1 = rmObj.guest;
          result.roomGuest2 = rmObj.guest2;
          if (that.isGroup && !that.oneBill) { //group business reservation
            extras = {nights: that.res.nights, roomType: rmObj.room_type, roomPrice: rmObj.price};
           result.displayText = convert.formatDisplayString(plan,extras);
          }
          else if (that.isGroup && that.oneBill) { //group tour reservation.
            extras = {nights: that.res.nights, occupants: that.res.occupants, roomCnt: that.res.rooms.length};
            result.displayText = convert.formatDisplayString(plan,extras);

            // for this case the UI needs to create buttons for each room
            that.res.rooms.forEach(function(rm) {
              result.groupRooms.push({room: rm.number, guest: rm.guest});
            })
          }
          else if (that.oneRoom && that.oneBill) { //should cover standard reservations
            extras = {nights: that.res.nights, roomprice: rmExp.price};
            if (plan.is_plan) {
              extras.perPerson = that.res.occupants === 2 ? configService.loctxt.forTwoPeople : '';
            }
            result.displayText = convert.formatDisplayString(plan,extras);
          }
          else if (that.oneRoom && !that.oneBill) { // covers business and kur plans
            extras = {nights: that.res.nights, roomprice: rmExp.price};
            if (plan.is_plan) {
              extras.perPerson = that.res.occupants === 2 ? configService.loctxt.forTwoPeople : '';
            }
            result.displayText = convert.formatDisplayString(plan,extras);
          }
        }

        return result;
      };

      // This method is called prior to saving the reservation. It performs the following functions:
      //    Validates various reservation properties
      //    Generates the reservation title.
      //    Copies the required expense items from the room plan to the reservation if the plan has changed.
      //    Copies the address details from the guest or firm if the guest or firm properties have changed.
      this.beforeSave = function () {
        var deferred = $q.defer();

        // first validate the reservation, if it fails validation reject the promise.
        var vobj = _validate();
        if (vobj.hasErrors()) {
          deferred.reject(vobj);
        }
        else {
          // perform stuff that doesn't require a promise
          // generate title (required field) if not present
          if (this.res.firm) {
            this.res.title = this.res.firm + ' (' + this.res.guest.name + ')';
          }
          else {
            this.res.title = this.res.guest.name;
          }

          // if a new reservation Copy required items from the plan, if the plan or room info changed then
          // remove the existing items and replace with new plan, if resources changed then replace related
          // resource expense items.
          _updateRequiredExpenses().then(function (changes) {
            // required expenses update then resource expenses where also updated, if no change then we still want
            // to check for any resource changes.
            if (!changes ) {
              _updateResourceExpenses();
            }

            // update the day count and the address information if needed.
            _updateDayCount();
            _updateAddress().then(function () {
              deferred.resolve();
            }, function (err) {
              deferred.reject(new utility.errObj(err));
            });
          }, function (err) {
            deferred.reject(new utility.errObj(err));
          });
        }

        return deferred.promise;
      };

      // Public convenience method to return a new error object similar to that returned by errors generated
      // by the beforeSave method
      this.getErrorObj = function(firstErr) {
        return new utility.errObj(firstErr);
      };

      // method to add an expense item and saves the reservation - called by the expense item directive
      // Business Logic: If plan has one_bill true and the room has two guests then add this item for both
      // guests if the item is of type per_person. For example, adding a "Full Pension" item, the assumption is that
      // both guests in the room would want full pension.
      this.addExpenseItemSave = function(item, room, guest) {
        var deferred = $q.defer();
        if (!item || !room || !guest){
          deferred.reject(configService.loctxt.expenseItemErr1)
        }
        else {
          item.room = room;
          item.guest = guest;
          item.date_added = new Date();
          if (item.price_lookup) {
            item.price = configService.constants.get(item.price_lookup);
          }
          var count = item.day_count ? that.res.nights : item.count;
          item.addThisToDocArray(that.res.expenses, null, count);
          // now check to see if we need to add a copy
          if (item.per_person && that.oneBill && !that.isGroup && that.res.rooms[0].guest_count === 2) {
            item.guest = item.guest + '-' + configService.loctxt.roommate;
            item.addThisToDocArray(that.res.expenses, null, count);
          }

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
      this.removeExpenseItemSave = function(itemID) {
        var deferred = $q.defer();
        var ecnt = that.res.expenses.length;
        var doc = that.res.expenses.id(itemID).remove();
        console.log('Removing doc: ' + doc);
        if (that.res.expenses.length === ecnt) {
          deferred.reject(configService.loctxl.expenseItemErr2);
        }
        else {
          that.res.expenses[0].date_added = new Date();  //test for bug work around  TODO-This works but is not ideal
          that.res.save(function (err, res, numEffected) {
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

      // method to save reservation after an expense item is edited. The only business logic implemented is
      // if the edited expense item is a room expense item and the price is modified. We must recalculate
      // the taxable amount if the room includes breakfast.
      this.updateExpenseItemSave = function(itemID) {
        var deferred = $q.defer(),
            item = that.res.expenses.id(itemID);

        if (item && item.is_room) {
          _updateRoomTaxablePrice(item);
        }

        that.res.save(function (err, res, numEffected) {
          if (err) {
            deferred.reject(err);
          }
          else {
            deferred.resolve();
          }
        });
        return deferred.promise;
      };

      // ******* private methods  and constructor initialization *******

      // This method checks critical reservation properties for validity.
      //  It returns an object with an isValid property (true if valid) and a valErrors array of error
      // messages if the reservation is not valid.
      function _validate() {
        var res = that.res;
        var vObj = new utility.errObj();

        // first check that a valid plan is specified (plan_code defined and greater than 0), we do not
        // check if the plan code is valid.
        if (!res.plan_code) {
          vObj.push(configService.loctxt.val_invalidPlan);
        }
        // check that we have a guest defined we do not check if guest exists in guest list.
        if (!res.guest || !res.guest.id) {
          vObj.push(configService.loctxt.val_invalidGuest);
        }
        // check that we have a firm if needed.
        if (that.showFirm && !res.firm) {
          vObj.push(configService.loctxt.val_invalidFirm);
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

        return vObj;
      }

      // method to update the required expense items if the room plan has changed. Or if the number of rooms or occupants
      // have changed. Also if guest names have changed then we need to also update the names in the expenses
      // It will try and update existing expenses with the changes made to the reservation. Some changes, such as
      // changing the plan will require replacing the required expenses associated with the plan.
        function _updateRequiredExpenses() {
          var deferred = $q.defer(),
              category = dbEnums.getItemTypeEnum()[0], // Retrieve first item category which is the plan items category
              guest = that.res.guest ? that.res.guest.name : '',
              guest2 = that.res.guest2 ? that.res.guest2.name : '',
              roomsChanged = (lastRoomHash !== _buildRoomHash(that.res.rooms, that.res.occupants)),
              changesMade = false,
              replaceAll = false,
              extraDaysItem;

        // Perform checks that don't require async operations
        //Update the count property of items based on the number of nights of the reservation
        // also, check to see if this reservation is a plan with a fixed duration, if so make sure
        // we add or adjust extra nights.
        if (lastNights !== that.res.nights) {
          changesMade = true;
          // first update current expense items
          that.res.expenses.forEach(function (exp) {
            if (exp.day_count) {
              exp.count = that.res.nights;
            }
          });
        }

        // Update the names associated with the expense items if the names of the guests change.
        if (lastGuest !== guest || lastGuest2 !== guest2) {
          var roommate = lastGuest + '-' + configService.loctxt.roommate;
          that.res.expenses.forEach(function (exp) {
            switch (exp.guest) {
              case lastGuest:
                exp.guest = that.res.guest.name;
                break;
              case roommate:
                exp.guest = that.res.guest.name + '-' + configService.loctxt.roommate;
                break;
              case lastGuest2:
                exp.guest = that.res.guest2.name;
                break;
            }
          });
          changesMade = true;
        }

        // If room hash has changed, see if we can handle changes without replacing the required expenses
        if (roomsChanged) {
          replaceAll = _updateExpenseRooms(lastRoomInfo, that.res.rooms);
        }

          // If plan changed, or room hash changed the easiest thing to do is to replace all required expense items
        // and replace them. We then have to clean up any non required expense items. If the plan changes,  we
        // need to change the required expenses and all plan expenses r
        if (lastPlanCode !== that.res.plan_code || replaceAll) {
          // First see if we can
          // Remove the current required items, retrieve the new required Items and add them to the current reservation
          // (copy and initialize based on business logic) TODO-- Need to refine all this logic based on Billing Logic doc.
          var curPlan = that.getPlanInReservation(),
              lstPlan = lastPlanCode ? that.getPlanInReservation(lastPlanCode) : null,
              lastRequiredItems = lstPlan ? lstPlan.required_items.slice(0) : [], // Must make copies because curPlan &
              requiredItems = curPlan ? curPlan.required_items.slice(0) : []; // lstPlan can point to same object

          lastRequiredItems.push(configService.loctxt.breakfastInc);
          lastRequiredItems.push(configService.loctxt.cityTax);
          _removeExistingExpenseItemsByCategory(category, lastRequiredItems);

          dashboard.getItemTypesInList(requiredItems).then(function (items) {
            if (items.length > 0) {
              _addRequiredExpenses(items, curPlan);
              _updateResourceExpenses(); // updated any resource expenses if needed
              deferred.resolve(true);
            }
            else {
              deferred.reject('ERROR: Invalid or missing plan code: ' + that.res.plan_code);
            }
          }, function (err) {
            deferred.reject("Error retrieving plan: " + err);
          });
        }
        else  {
          changesMade = _updateResourceExpenses(); // updated any resource expenses if needed
          deferred.resolve(changesMade); //no changes
        }

        return deferred.promise;
      }

      // Tries to update expenses for multiple rooms. If too much has changed then the method returns
      // true which tells the caller we need to replace all required expenses
      function _updateExpenseRooms(oldInfo, rooms) {
         var i,
             cantDoIt = false;
        // number of rooms haven't changed or rooms have been added
        if (oldInfo.length === rooms.length || oldInfo.length < rooms.length ) {

          for (i=0; i < oldInfo.length; i++){
           if (_updateExpenseRoomInfo(oldInfo[i], rooms[i])) {
             cantDoIt = true;
           } // assume that the order hasn't changed
          }
          return cantDoIt ? true : ( oldInfo.length < rooms.length); // If we added a room, we still need to update required expenses
        }

        return false;
      }

      // updates existing expenses based on the changes to the specified room
      // If the return value is true then the update needs to be handled by replacing the
      // required expenses.
      function _updateExpenseRoomInfo(oldInfo, curRoom) {
        var numChng = oldInfo.number !== curRoom.number,
            gChng = oldInfo.guest !== curRoom.guest,
            g2Chng = oldInfo.guest2 !== curRoom.guest2,
            prChng = oldInfo.price !== curRoom.price,
            cntInc = oldInfo.count <  curRoom.guest_count,
            cntDec = oldInfo.count >  curRoom.guest_count,
            guestDec = oldInfo.guest2 ? oldInfo.guest2 : oldInfo.guest + '-' + configService.loctxt.roommate;

        // update expenses with changes
        if (numChng) {
          _updateExpenseProperty('room', oldInfo.number, curRoom.number)
        }
        if (gChng) {
          _updateExpenseProperty('guest', oldInfo.guest, curRoom.guest)
        }
        if (prChng || cntInc) { // best way to handle price or occupancy increase is to replace the required expenses
          return true;
        }
        if (cntDec) {  // We need to remove expenses associated with guest 2 we will remove them all

          _removeExpenseFromProperty('guest', guestDec);
        }
        if (g2Chng) {
          _updateExpenseProperty('guest', oldInfo.guest2, curRoom.guest2)
        }

        return false;
      }

      // method to update the specified property of all expenses items that have the value
      // specified by 'oldval' with the value in the 'newval' parameter
      function _updateExpenseProperty (prop, oldval, newval) {
        that.res.expenses.forEach(function (exp) {
          if (exp[prop] === oldval) {
            exp[prop] = newval;
          }
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

      // removes and replaces the resource related expenses such as parking if needed.
      function _updateResourceExpenses () {
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
        that.res.resources.forEach(function(res) {
          var exp = new Itemtype();
          exp.name = res.resource_type;
          exp.category = dbEnums.getItemTypeEnum()[0];
          exp.bill_code = configService.constants.bcPlanDiverses,
          exp.room = res.room_number;
          exp.guest = res.guest;
          exp.per_person = false;
          exp.no_delete = true; // To remove, we must remove by editing reservation.
          exp.no_display = false;
          exp.day_count = true;
          exp.display_order = 2;
          exp.taxable_price = 0;
          exp.addThisToDocArray(that.res.expenses, res.price, that.res.nights);
        });
      }

      // Removes expenses by category. If the specificItems parameter is specified (array)
      // Then only the specific items in the array (in the specified category) will be removed.
      function _removeExistingExpenseItemsByCategory(category, specificItems){
        // first find all of the plan expense item ids
        var planExp = [];

        that.res.expenses.forEach(function(exp){
          if (exp.category === category) {
            if (specificItems && specificItems.length) {
              if (specificItems.indexOf(exp.name) !== -1) {
                planExp.push(exp._id);
              }
              else {
                planExp.push(exp._id); //specific items not specified, remove all category items
              }
            }
          }
        });

        // now remove these items from the reservation
        planExp.forEach(function(id){
          that.res.expenses.id(id).remove();
        });
      }

      // Removes the existing expenses related to any booked resources (such as parking)
      function _removeExistingResourceExpenseItems() {
        var resExp = [];
        var resources = dbEnums.getResourceTypeEnum();

        // find all of the resource related expenses
        that.res.expenses.forEach(function(exp) {
            resources.forEach(function(res) {
               if (exp.name === res) {
                 resExp.push(exp._id);
               }
            });
        });

        // now remove these items from the reservation
        resExp.forEach(function(id) {
          that.res.expenses.id(id).remove();
        });
      }


      // General function that removes all embedded documents from the specified Model document array
      function _removeAllEmbeddedDocs(docArray){
        var ids = [];
        docArray.forEach(function (doc) {  // Find the IDs of all embedded docs
          ids.push(doc._id);
        });
        ids.forEach(function(id) {
          docArray.id(id).remove();
        });
      }

      // Adds all of the required expense items to a reservation as defined by the 'required_items' property of the
      // reservation's selected plan. Business logic:
      // Items are added for each room in the reservation
      // If an item has the 'per_person' property set true then the item is added for each person in a room
      // The plan must have one required item that represents the room expense ('is_room' property true)
      // Breakfast is added automatically if the plan specifies ('includes_breakfast' property true)
      // Kurtaxe is added automatically to each person in each room.
      // The taxable_rate property is calculated for the room expense item since components such as breakfast that may
      //  be included in the room price are taxed at a different rate.
      function _addRequiredExpenses(items, curPlan) {
        // Process each required item
        // First find if breakfast is part of the room plan. We need to get the price being charged.
        // The logic is extended for any other item that are "baked in" to the room price.
        var includedInPrice = 0;
        var single = dbEnums.getRoomTypeEnum()[0];

        // first  get the price of any item other than breakfast that is included in room price but has a different
        // tax rate than the room. (Currently only breakfast but able to handle other custom items)
        items.forEach(function(item) {
          if (item.included_in_room) {
            includedInPrice = includedInPrice + item.price;
          }
        });
        // Now add breakfast price if the plan includes it.
        if (curPlan.includes_breakfast) {
          includedInPrice = includedInPrice + configService.constants.breakfast;
        }

        // now add the items to the reservation and implement the room logic.
        items.forEach(function (item) {
          // Implement item for each room as needed
            that.res.rooms.forEach(function (room){
              // Each plan should have one room ExpenseItem associated with it. It is added to the expense list
              // at least once and then kurtax and breakfast items are also added for each person in the room if
              // needed.
              if (item.is_room) {
                _addRoomTaxBreakfast(room, curPlan, includedInPrice, item);
              }
              else {
                // add item or items if item needs to be duplicated.
                _addExpenseItem(room, item);
              }
             });
        });
      }

      // Implements the complex business logic around adding the room component to the total bill. Also
      // adds breakfast (if needed) and kurtax entries for each person in the room. May break out a room component for
      // each person in a double room if needed. Can also add an extra days item if the # of nights of the reservation
      // exceed the duration of a plan.
      function _addRoomTaxBreakfast (room, curPlan, includedInPrice, item) {

        var price,
            count,
            extraDays = 0,
            isSingleRoom = (room.room_type === dbEnums.getRoomTypeEnum()[0]),
            roomDiff,
            roomItems;

        // is the plan a "package plan"?
        if (curPlan.is_plan){
          // We must adjust the price if the per person plan price associated with the room is different
          // than the default plan price.
          roomDiff = (that.planPrice - room.price) / curPlan.duration;

          price = isSingleRoom ? (item.single_price - roomDiff) : (item.double_price - roomDiff);
          count = curPlan.duration;
          extraDays = that.res.nights - curPlan.duration; // do we need to add or subtract extra days?

          // Included component is typically breakfast. We need to add an expense item for it (can be genaric)
          // If there is an included item, it is probable at a differnt tax rate so remove it for the  price.
          if (includedInPrice) {
            item.taxable_price = (price - (includedInPrice * room.guest_count));
          }

          // Now add room item for the main guest and duplicate if necessary
          roomItems = _addExpenseItem(room, item, price, count);

          //Now create the included cost items (breakfast) and Kurtax items
          _addBreakfastKurtax(room, includedInPrice);

        }
        else { // Get the room price from the reservation reservedRoom object and if breakfast is
          // part of the room plan then remove the breakfast part and set it to the taxable rate.
          // If there is two people in the room then we need to subtract twice the breakfast cost.
          price = room.price;
          count = that.res.nights;
          if (includedInPrice) {
            item.taxable_price = (price - (includedInPrice * room.guest_count));
          }
          _addExpenseItem(room, item, price, count);
          _addBreakfastKurtax(room, includedInPrice);
        }

        if (extraDays) {
          _addExtraPackageDaysExpense(roomItems[0], extraDays);
        }
      }

      // Creates and adds expense items for included expenses (breakfast) and kurtaxe
      function _addBreakfastKurtax(room, includedInPrice) {
        if (includedInPrice) {
          var exp = new Itemtype();
          exp.name = configService.loctxt.breakfastInc;
          exp.category = dbEnums.getItemTypeEnum()[0];
          exp.bill_code = configService.constants.bcPackageItem,
          exp.per_person = true;
          exp.no_delete = true;
          exp.no_display = true;
          exp.included_in_room = true;
          exp.day_count = true;
          exp.low_tax_rate = false;
          exp.display_order = 2;
          exp.taxable_price = includedInPrice;
          exp.price = 0;
          _addExpenseItem(room, exp);
        }
        //now add city tax
        exp = new Itemtype();
        exp.name = configService.loctxt.cityTax;
        exp.category = dbEnums.getItemTypeEnum()[0];
        exp.bill_code = configService.constants.bcKurTax,
        exp.per_person = true;
        exp.day_count = true;
        exp.no_delete = true;
        exp.one_per = true;
        exp.low_tax_rate = true;
        exp.display_string = '%count% Tag|Tage Kurtaxe à € %price%';
        exp.display_order = 2;
        _addExpenseItem(room, exp, configService.constants.cityTax);
      }
      //Simple method to add an expense item, It will duplicate item if needed based on the item flags and room guest
      // count
      function _addExpenseItem(room,  item, price, count, guest) {
        var expCnt = that.res.expenses.length === 0 ? 0 : that.res.expenses.length -1,
            i,
            result = [];

        item.room = room.number;
        item.guest = guest ? guest : room.guest;
        item.date_added = new Date();
        count =  count ? count : (item.day_count ? that.res.nights : null);
        item.addThisToDocArray(that.res.expenses, price, count);

        // Now determine if we have to add another item for the second guest in the room
        // For business reservations, and kur reservations we need a name of the second quest.
        // For personal reservations, we only expect one room and we go by the # of occupants
        // For tour group reservations, we can have multiple rooms but only one name is needed.
        if (item.per_person && room.guest_count === 2) {
          item.guest = room.guest2 ? room.guest2 : room.guest + '-' + configService.loctxt.roommate;
          item.addThisToDocArray(that.res.expenses, price, count);
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
      function _addExtraPackageDaysExpense(roomItem, days) {
        var room = that.getRoomInReservation(roomItem.room);

        if (days) { //safety check
          var exp = new Itemtype();
          exp.name = configService.loctxt.extra_days_item;
          exp.category = dbEnums.getItemTypeEnum()[0]; //plan
          exp.bill_code = configService.constants.bcExtraRoom,
          exp.is_room = true;
          exp.per_person = false;
          exp.no_delete = true;
          exp.no_display = false;
          exp.included_in_room = false;
          exp.day_count = true;
          exp.low_tax_rate = true;
          exp.display_order = 3;
          exp.display_string = '%count% ' + days !== 1 ? configService.loctxt.extra_days : configService.loctxt.extra_day;
          exp.price = roomItem.price;
          exp.count = days;
          exp.taxable_price = roomItem.taxable_price;
          _addExpenseItem(room, exp, null, days);
        }
      }

      // Updates the taxable_price property of the room expense item if its price has been changed by the user.
      // The taxable_price is simply the room item's price minus the some of any items (such as breakfast) that
      // have their 'included_in_room' flag set.
      function _updateRoomTaxablePrice(item) {
        var includedInPrice = 0,
            room = that.getRoomInReservation(item.room),
            iprice;

        //Total any items (such as breakfast that is included in room price
        that.res.expenses.forEach(function (exp) {
          if (exp.included_in_room) {
            iprice = exp.taxable_price ? exp.taxable_price : exp.price; //Taxable price always has priority
            iprice = exp.per_person ? (iprice * room.guest_count) : iprice;
            includedInPrice = includedInPrice + iprice;
          }
        });

        item.taxable_price = item.price - includedInPrice;
      }

      // If the number of nights change then update  count of the items that have their day_count flag set to true
      // NOTE: there is special logic required for room items. Need to check for a plan, If days differ from plan
      // duration, then we must update/add an extra days expense item. This logic assumes that there is only one
      // room associated with plan items
      function _updateDayCount() {
        var nights = that.res.nights,
            includedInRoom = 0,
            roomItem,
            guest,
            duration,
            extraDaysItem,
            id,
            curPlan,
            diff;

        if (nights !== lastNights) {
          curPlan = that.getPlanInReservation();
          duration = curPlan.duration;

          that.res.expenses.forEach(function(item) {  //process all items
            if (item.included_in_room) {
              includedInRoom += (item.taxable_price ? item.taxable_price : item.price);
            }

            if (item.day_count) {
              if (item.is_room && curPlan.is_plan && item.name !== configService.loctxt.extra_days_item) { //plan, room item
                roomItem = item;
              }
              else if (item.is_room && curPlan.is_plan && item.name === configService.loctxt.extra_days_item) { // extra days
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
                extraDaysItem.display_string = '%count% ' + diff !== 1 ? configService.loctxt.extra_days : configService.loctxt.extra_day;
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

      //method to update the address information associated with the reservation.
      function _updateAddress() {
        var deferred = $q.defer();
        // first determine if we need to update.
        var updateFromFirm = that.showFirm && (that.res.firm !== lastFirm);
        var updateFromGuest = !that.showFirm && (that.res.guest.id !== lastGuest);
        if (updateFromFirm){
          dashboard.getFirmByName(that.res.firm).then(function (firm){
            if (firm) {
              that.res.address1 = firm.address1;
              that.res.address2 = firm.address2;
              that.res.city = firm.city;
              that.res.post_code = firm.post_code;
              that.res.country = firm.country;
              deferred.resolve();
            }
            else {
              deferred.reject('ERROR: Invalid or missing Firm: ' + that.res.firm);
            }
          }, function (err) {
            deferred.reject("Error retrieving firm: " + err);
          });
        }
        else if (updateFromGuest){
          dashboard.getGuestById(that.res.guest.id).then(function (guest){
            if (guest) {
              that.res.address1 = guest.address1;
              that.res.address2 = guest.address2;
              that.res.city = guest.city;
              that.res.post_code = guest.post_code;
              that.res.country = guest.country;
              deferred.resolve();
            }
            else {
              deferred.reject('ERROR: Invalid or missing Guest: ' + that.res.guest.name);
            }
          }, function (err) {
            deferred.reject("Error retrieving Guest: " + err);
          });
        }
        else { //no change
          deferred.resolve();
        }
        return deferred.promise;
      }

      // Builds a hash from the reservation rooms array. Used to determine if the rooms and or occupants have changed
      function _buildRoomHash(rooms, occupants) {
        var hash = 0;
        var ix = rooms.length + 2;
        rooms.forEach(function(room) {
          hash = hash + (room.number * room.price * ix * occupants);
          ix--;
        })
        return hash;
      }

      // Builds a hash from the resources array. Used to determine if the resources have changed.
      function _buildResourceHash(resources) {
        var hash = 0;
        var ix = resources.length + 2;
        resources.forEach(function(resources) {
          var g = resources.guest ? resources.guest.length : 1;
          g = g + resources.name.length;
          hash = hash + (resources.room_number * resources.price * ix * g);
          ix--;
        });
        return hash;
      }

      // filters the room plan list based on the reservation type provided
      // if curPlanCode provided then it will also set the selectedPlan property
      // to the current plan. Else it will set it to default value
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
              var pobj = {value: plan._id.id, name: plan.name};
              rPlans.push(pobj);
              if (curPlanCode && pobj.value === curPlanCode) {
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
      };

      // Returns the complete room plan object based on which plan was chosen. (selectedPlan)
      // The plan list displayed to the UI only contains the name and id of the actual plan object
      function _findSelectedPlan() {
        var selPlan = undefined;
        that.roomPlansAll.forEach(function (plan) {
          if (plan._id.id === that.selectedPlan.value) {
            selPlan = plan;
          }
        });
        return selPlan;
      };

      // *** Constructor initialization ***
      // Now that everything is defined, initialize the VM based on the reservation model
      // perform model setup actions
      if (reservation) {
        lastPlanCode = reservation.plan_code;
        lastGuest = reservation.guest ? reservation.guest.name : '';
        lastGuest2 = reservation.guest2 ? reservation.guest2.name : '';
        lastFirm = reservation.firm ? reservation.firm : '';
        lastNights = reservation.nights;
        lastRoomHash = _buildRoomHash(reservation.rooms, reservation.occupants);
        lastResourceHash = _buildResourceHash(reservation.resources);
        if (reservation.rooms.length) {
          reservation.rooms.forEach(function(room){
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

    }; //End of VM class

    // *** Start of ViewModel factory. Has methods to return the VM class with a new or existing VM.
    return {
      // Creates a new Reservation model and gets the new reservation number, Returns a view model containing the new
      // Reservation model.
      // The method will also initialize the start_date, end_date, nights and occupants properties of the reservation
      // with default values. It will select the default reservation type of standard and a room plan of single room,
      //
      // NOTE: this method does not reserve the reservation number so it only works in a single user environment.
      newReservationVM: function () {
        var deferred = $q.defer();
        var resource = 'Parkplatz'; //currently the only bookable resource type.
        // Create the VM and get the required data from other collections to populate various static lists
        // in the VM.
        var rvm;
        dashboard.getRoomPlanList().then(function (roomPlanList) {
          // get a unique reservation number and create the Reservation model
          dashboard.getItemTypeList().then(function (itemTypeList) {
            dashboard.getNewReservationNumber().then(function (val) {
              var reservation = new Reservation();
              reservation.reservation_number = val;
              reservation.start_date = datetime.dateOnly(new Date());
              reservation.end_date = datetime.dateOnly(new Date(), 1);
              reservation.occupants = 1;
              rvm = new reservationVM(reservation, roomPlanList, itemTypeList);
              reservation.type = rvm.resTypeList[0]; //defaults to standard reservation
              reservation.status = rvm.statusList[0];
              reservation.source = rvm.sourceList[0];
              rvm.reservationTypeChanged(); //force an update since we added a default type to the new reservation.
              rvm.updateAvailableRoomsAndResources().then(function () {
                console.log("Reservation " + reservation.reservation_number + " created");
                return deferred.resolve(rvm);
              }, function (err) {
                return deferred.reject(new utility.errObj(err)); //pass error up the chain.
              });
            }, function (err) {
              return deferred.reject(new utility.errObj(err)); //pass error up the chain.
            });
          }, function (err) {
            return deferred.reject(new utility.errObj(err)); //pass error up the chain.
          });
        }, function (err) {
          return deferred.reject(new utility.errObj(err)); //pass error up the chain.
        });

        return deferred.promise;
      },

      // Retrieves the specified reservation and returns a view model containing the reservation model.
      // Parameter resnum is the reservation number of the reservation to retrieve.
      // Parameter readOnly, if true then the reservation is retrieved but the available rooms list is not
      // retrieved.
      getReservationVM: function (resnum, readOnly) {
        var deferred = $q.defer();
        // Get the required data from other collections for the VM, retrieve the specified Reservation and
        // create and return the VM with the reservation.
        dashboard.getRoomPlanList().then(function (roomPlanList) {
          dashboard.getItemTypeList().then(function (itemTypeList) {
            dashboard.getReservationByNumber(resnum).then(function (reservation) {
              console.log("Reservation " + reservation.reservation_number + " retrieved");
              var rvm = new reservationVM(reservation, roomPlanList, itemTypeList, true);
              if (readOnly) {
                return deferred.resolve(rvm);
              }
              rvm.updateAvailableRoomsAndResources().then(function () {
                return deferred.resolve(rvm);
              }, function (err) {
                return deferred.reject(new utility.errObj(err)); //pass error up the chain.
              });
            }, function (err) {
              return deferred.reject(new utility.errObj(err)); //pass error up the chain.
            });
          }, function (err) {
            return deferred.reject(new utility.errObj(err)); //pass error up the chain.
          });
        }, function (err) {
          return deferred.reject(new utility.errObj(err)); //pass error up the chain.
        });

        return deferred.promise;
      }
    }; //end of factory
  });
});