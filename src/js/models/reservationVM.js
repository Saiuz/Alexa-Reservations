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
 * todo - Logic: (IMPORTANT)
 *    When firm is selected, the guest field must be cleared if there is a guest selected.
 *    Also when firm is hidden same thing must be done.
 * todo - pre save logic for new reservation should add a room expense and optionally a parkplatz and conf. room.
 */
define(['./module'], function (model) {
  'use strict';
  model.factory('ReservationVM', function ($q, Reservation, Itemtype, dbEnums, dashboard, datetime, configService, utility) {
    console.log("Invoking ReservationVM");

    // ******* Define the View Model object
    // ******* ViewModel definition  ********
    var reservationVM = function (reservation, roomPlanList, itemTypeList) {
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
      this.statusList = dbEnums.getReservationStatusEnum();
      this.sourceList = dbEnums.getReservationSourceEnum();
      this.resTypeList = dbEnums.getReservationTypeEnum(); //holds a list of the reservation types e.g. standard, business, cure
      this.insuranceList = dbEnums.getReservationInsuranceEnum();
      var rOpts = [];
      angular.forEach(this.resTypeList, function (item) {
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
            this.planPrice = this.res.occupants === 1 ? plan.pp_price + plan.single_surcharge : plan.pp_price;
          }

          var rdates = this.cleanResDates();
          var doubleOnly = this.double_only || (this.res.occupants === 2 && this.oneRoom);
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
          // don't match.
          if (this.double_only && this.res.occupants === 1) {
            this.res.occupants = 2;
          }
          else if (this.single_only && this.res.occupants > 1) {
            this.res.occupants = 1;
          }

          // If selected room plan has a plan price then set the property. If the # of occupants is 1 then add any
          // single surcharge. Also if the plan has a set duration, set the nights property accordingly.
          if (plan.is_plan) {
            this.planPrice = plan.pp_price;
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

      // Utility method that retrieves the room expense item in the reservation for the specified room number and guest
      this.getRoomExpenseInReservation = function (roomNum, guest) {
         var roomExp = null;
        for(var i = 0; i < this.res.expenses.length; i++) {
          if (this.res.expenses[i].room === roomNum && this.res.expenses[i].guest === guest) {
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

      this.getPlanInReservation =  function () {
        var curPlan = null;
        angular.forEach(that.roomPlansAll, function (plan) {
          if (plan._id.id === that.selectedPlan.value) {
            curPlan = plan;
          }
        });

        return curPlan;
      }
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

      // method to add an expense item and save the reservation - called by the expense item directive
      this.addExpenseItemSave = function(item, room, guest) {
        var deferred = $q.defer();
        if (!item || !room || !guest){
          deferred.reject(configService.loctxl.expenseItemErr1)
        }
        else {
          item.room = room;
          item.guest = guest;
          item.date_added = new Date();
          var count = item.day_count ? that.res.nights : item.count;
          item.addThisToDocArray(that.res.expenses, null, count);
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

      // method to remove an existing expense item and save the reservation if it was successfully removed.
      this.removeExpenseItemSave = function(itemID) {
        var deferred = $q.defer();
        var ecnt = that.res.expenses.length;
        var doc = that.res.expenses.id(itemID).remove();
        if (that.res.expenses.length === ecnt) {
          deferred.reject(configService.loctxl.expenseItemErr2);
        }
        else {
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


      // *** private methods  and constructor initialization***

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

        return vObj;
      }

      // method to update the required expense items if the room plan has changed. Or if the number of rooms or occupants
      // have changed. Also if guest names have changed then we need to also update the names in the expenses
      // It will first remove any expenseItems of type 'Plan' then replace these items
      // with the items from the new plan.
      // todo- add logic to modify the room expense, need to create one room expense item for each room
      // todo- and add the room number and price to it. for items whose counts = days add the correct day count
      // todo- need to also update if rooms or room prices change
      function _updateRequiredExpenses() {
        var deferred = $q.defer();
        var category = dbEnums.getItemTypeEnum()[0]; // Retrieve first item category which is the plan items category
        var guestid = that.res.guest ? that.res.guest.id : 0;
        var guestid2 = that.res.guest2 ? that.res.guest2.id : 0;
        var newRoomHash = _buildRoomHash(that.res.rooms, that.res.occupants);
        var roomsChanged = lastRoomHash !== newRoomHash;
        // If plan changed, or room hash changed the easiest thing to do is to replace all  so then we replace all plan expense items
        if (lastPlanCode !== that.res.plan_code || roomsChanged) {

          // Remove the current required items, retrieve the new required Items and add them to the current reservation
          // (copy and initialize based on business logic) TODO-- Need to refine all this logic based on Billing Logic doc.
          var curPlan = that.getPlanInReservation();
          var requiredItems = curPlan ? curPlan.required_items : [];

          _removeExistingRequiredExpenseItems(category);

          dashboard.getItemTypesInList(requiredItems).then(function (items) {
            if (items.length > 0) {
              _addRequiredExpenses(items, curPlan);
              _updateResourceExpenses();
              _updateNonPlanExpenses(category, roomsChanged);
              deferred.resolve(true);
            }
            else {
              deferred.reject('ERROR: Invalid or missing plan code: ' + that.res.plan_code);
            }
          }, function (err) {
            deferred.reject("Error retrieving plan: " + err);
          });
        }
        else {
          deferred.resolve(false); //no changes
        }

        return deferred.promise;
      }

      // removes and replaces the resource releated expenses if needed.
      function _updateResourceExpenses () {
        var curResHash = _buildResourceHash(that.res.resources);
        if (lastResourceHash !== curResHash) {
          _removeExistingResourceExpenseItems();
          _addResourceExpenses();
        }
      }

      // Add expense items for the booked resources
      function _addResourceExpenses() {
        that.res.resources.forEach(function(res) {
          var exp = new Itemtype();
          exp.name = res.resource_type;
          exp.category = dbEnums.getItemTypeEnum()[0];
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

      // Removes the existing "Plan" based expense items
      function _removeExistingRequiredExpenseItems(category){
        // first find all of the plan expense item ids
        var planExp = [];
        that.res.expenses.forEach(function(exp){
          if (exp.category === category) {
            planExp.push(exp._id);
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
        angular.forEach(docArray, function (doc) {  // Find the IDs of all embedded docs
          ids.push(doc._id);
        });
        angular.forEach(ids, function(id) {
          docArray.id(id).remove();
        });
      }

      // Logic to replace all required items with new ones
      function _addRequiredExpenses(items, curPlan) {
        // Process each required item
        // First find if breakfast is part of the room plan. We need to get the price being charged.
        // The logic is extended for any other item that are "baked in" to the room price.
        var includedInPrice = 0;
        var single = dbEnums.getRoomTypeEnum()[0];

        // first  get the price of any item other than breakfast that is included in room price but has a different
        // tax rate than the room. (Currently only breakfast but able to handle other custom items)
        angular.forEach(items, function(item) {
          if (item.included_in_room) {
            includedInPrice = includedInPrice + item.price;
          }
        });
        // Now add breakfast price if the plan includes it.
        if (curPlan.includes_breakfast) {
          includedInPrice = includedInPrice + configService.constants.breakfast;
        }

        // now add the items to the reservation and implement the room logic.
        angular.forEach(items, function (item) {
          // Implement item for each room as needed
            angular.forEach(that.res.rooms, function (room){
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

        var price;
        var count;
        var extraDays = 0;
        var isSingleRoom = (room.room_type === dbEnums.getRoomTypeEnum()[0]);

        // is the plan a "package plan"?
        if (curPlan.is_plan){
          // We must adjust the price if the per person plan price associated with the room is different
          // than the default plan price.
          var roomDiff = (that.planPrice - room.price) / curPlan.duration;

          price = isSingleRoom ? (item.single_price - roomDiff) : (item.double_price - roomDiff);
          count = curPlan.duration;
          extraDays = that.res.nights - curPlan.duration; // do we need to add or subtract extra days?

          // Included component is typically breakfast. We need to add an expense item for it (can be genaric)
          // If there is an included item, it is probable at a differnt tax rate so remove it for the  price.
          if (includedInPrice) {
            item.taxable_price = (price - (includedInPrice * room.guest_count));
          }

          // Now add room item for the main guest and duplicate if necessary
          _addExpenseItem(room, item, price, count);

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
          _addExtraPackageDaysExpense(item, extraDays, guest, includedInPrice);//add an extra days item using current room item for information //TODO-build this method
        }
      }

      // Creates and adds expense items for included expenses (breakfast) and kurtaxe
      function _addBreakfastKurtax(room, includedInPrice) {
        if (includedInPrice) {
          var exp = new Itemtype();
          exp.name = configService.loctxt.breakfastInc;
          exp.category = dbEnums.getItemTypeEnum()[0];
          exp.per_person = true;
          exp.no_delete = true;
          exp.no_display = true;
          exp.day_count = true;
          exp.display_order = 2;
          exp.taxable_price = includedInPrice;
          exp.price = 0;
          _addExpenseItem(room, exp);
        }
        //now add city tax
        exp = new Itemtype();
        exp.name = configService.loctxt.cityTax;
        exp.category = dbEnums.getItemTypeEnum()[0];
        exp.per_person = true;
        exp.day_count = true;
        exp.no_delete = true;
        exp.one_per = true;
        exp.display_string = '%count% Tage à € %price%';
        exp.display_order = 2;
        _addExpenseItem(room, exp, configService.constants.cityTax);
      }
      //Simple method to add an expense item, It will duplicate item if needed based on the item flags and room guest
      // count
      function _addExpenseItem(room,  item, price, count, guest) {
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
      }

      // Adds an expense item for extra days in the room. This method creates a new ExpenseItem object rather than
      // adding an existing one. It adds an item with the is_room flag set, it is displayed on the bill and the default
      // room price added is the standard price for the room.
      function _addExtraPackageDaysExpense(room, days, guest, includedInPrice) {
        if (days) { //safety check
          var item = new ExpenseItem();
          item.name = days === 1 ? configService.loctxt.extra_day : configService.loctxt.extra_days;
          item.guest = guest;
          item.room = room.number;
          item.is_room = true;

        }
      }
      //todo-figure out logic if room number changes, or guest name changes then we can just update names and
      //todo- numbers and prices. If the number of rooms changes then we need to add or subtract room expense items.
      function _updateNonPlanExpenses(category, roomsChanged) {

       }

       // If the number of nights change then update the nights change then update the count of the items that
      // have their day_count flag set to true
      function _updateDayCount() {
        var nights = that.res.nights;
        if (nights !== lastNights) {
          angular.forEach(that.res.expenses, function(item) {
            if (item.day_count) {
              item.count = nights;
            }
          });
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
          angular.forEach(that.roomPlansAll, function (plan) {
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
        angular.forEach(that.roomPlansAll, function (plan) {
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
        lastGuest = reservation.guest ? reservation.guest.id : 0;
        lastGuest2 = reservation.guest2 ? reservation.guest2.id : 0;
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
               type: room.room_type
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
              var rvm = new reservationVM(reservation, roomPlanList, itemTypeList);
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