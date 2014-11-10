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
  model.factory('ReservationVM', function ($q, Reservation, dbEnums, dashboard, datetime, configService) {
    console.log("Invoking ReservationVM");

    // ******* Define the View Model object
    // ******* ViewModel definition  ********
    var reservationVM = function (reservation, roomPlanList) {
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
    this.showFirm = false; // viewmodel property that is true if the reservation requires a firm name.
    this.showInsurance = false; // viewmodel property that is true if the reservation requires insurance.
    this.single_only = false; // viewmodel property that is true if the selected room plan is a single room only plan.
    this.double_only = false; // viewmodel property that is true if the selected room plan is a double room only plan.
    this.isGroup = false; //viewmodel property that is true if the selected plan is a group plan with multiple rooms.
    this.oneBill = false; // viewmodel property that is true if the selected plan is a group plan and requires a single bill.
    this.oneRoom = true; // viewmodel property that is true if the selected plan has the
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
     this.resTypeOptions  = rOpts;
     this.occupantOptions = [
       {value: 1, text: '1'},
       {value: 2, text: '2'},
     ];

      // *** Public methods assigned to VM ***

    // Utility method to return a room type abbreviation from a reservedRoom item
    this.generateRoomAbbrv = function (rrObj) {
      return dbEnums.getRoomDisplayAbbr(rrObj);
    }

    // Respond to change of reservation type from UI. This requires room plan filtering
    this.reservationTypeChanged = function () {
      console.log("Reservation type changed to " + this.res.type);
      _filterRoomPlans(this.res.type,undefined);
      //if there is a pre-selected plan, not the default, then execute the roomPlanChanged method
      //if (this.selectedPlan.value) {
        this.roomPlanChanged();
      //}
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
        this.guestLookup = (this.isGroup && ! this.oneBill);
        // now implement logic that removes content from hidden Model properties
        if (!this.showFirm) {
          this.res.firm = '';
        }
        if (!this.showInsurance){
          this.res.insurance = '';
        }

        // Implement logic to change occupants if the plan is single_only or double_only and the occupant numbers
        // don't match.
        if (this.double_only && this.res.occupants === 1){
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

    // Updates the nights property of the VM based on the start and end dates provided
    this.calculateNights = function (start, end) {
      start = datetime.dateOnly(new Date(start));
      end = datetime.dateOnly(new Date(end));
      this.nights = datetime.getNightsStayed(new Date(start), new Date(end));
      return {  //returned the clean dates
        start: start,
        end: end
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

    this.updateAvailableRoomsAndResources = function (datesObj, noSingles, roomOnly) {
      var resource = 'Parkplatz'; //currently the only bookable resource type.
      var deferred = $q.defer();
      if (!datesObj.start || !datesObj.end){
        this.availableRooms = [];
        this.availableResources = [];
        deferred.resolve(0);
      }
      else {
        dashboard.findAvailableRooms(datesObj.start, datesObj.end, noSingles, true).then(function (rooms) {
          console.log('%d available rooms found', rooms.length);
          that.availableRooms = rooms;
          if (!roomOnly) {
            dashboard.findAvailableResources(datesObj.start, datesObj.end, 'Parkplatz', true).then(function (resources) {
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

    //Retrieve available rooms based on the supplied dates
    this.getAvailableRooms = function (datesObj, dbl) {
      var deferred = $q.defer();
      if (!(datesObj.start && datesObj.end)) {
        deferred.resolve([]);
      }
      else {
        dashboard.findAvailableRooms(datesObj.start, datesObj.end, dbl, true).then(function (rooms) {
          console.log('%d available rooms found', rooms.length);
          deferred.resolve(rooms);
        });
      }

      return deferred;
    };

    //Retrieve available resources based on the supplied dates
    this.getAvailableResources = function (datesObj) {
      var deferred = $q.defer();
      if (!(datesObj.start && datesObj.end)) {
        deferred.resolve(0);
      }
      else {
        dashboard.findAvailableResources(datesObj.start, datesObj.end, 'Parkplatz', true).then(function (resources) {
          console.log('%d available rooms found', resources.length);
          if (resources.length > 0) {
            this.availableResources = resources;
          }
          else {
            this.availableResources = [];
          }
          deferred.resolve(resources.length);
        });
      }

      return deferred;
    };

      // *** private methods ***

      // filters the room plan list based on the reservation type provided
      // if curPlanCode provided then it will also set the selectedPlan property
      // to the current plan. Else it will set it to default value
      function _filterRoomPlans (resType, curPlanCode) {
        var firstItem = {value: 0, name: that.roomPlanFirstText};
        var errorItem = {value: 0, name: '*** ERROR ***'};
        var defIndex = 0;
        var rPlans = []; //filtered list based on reservation type
        if (that.roomPlansAll && that.roomPlansAll.length > 0) {
          if (that.roomPlanFirstText.length) {
            rPlans.push(firstItem);
          }
          var selected = undefined;
          angular.forEach(that.roomPlansAll, function (plan) {
            if (plan.resTypeFilter.indexOf(resType) !== -1) {
              var pobj = {value: plan._id.id, name: plan.name};
              rPlans.push(pobj);
              if (curPlanCode && pobj.value === curPlanCode) {
                selected = pobj;
              }
              if (plan.is_default) {
                defIndex = rPlans.length -1;
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
        //todo - may need to add business logic that prevents zimmer plan change for an existing res
      };

      // Returns the complete room plan object based on which plan was chosen. (selectedPlan)
      // The plan list displayed to the UI only contains the name and id of the actual plan object
      function _findSelectedPlan () {
        var selPlan = undefined;
        angular.forEach(that.roomPlansAll, function (plan) {
          if (plan._id.id === that.selectedPlan.value) {
            selPlan = plan;
          }
        });
        return selPlan;
      };

      // Now that everything is defined, initialize the VM based on the reservation model
      // perform model setup actions
      if (this.res) {
        _filterRoomPlans(this.res.type, this.res.plan_code);
        this.nights = this.res.nights; //The reservation model nights property is calcuated and read only.
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
          dashboard.getNewReservationNumber().then(function (val) {
            var reservation = new Reservation();
            reservation.reservation_number = val;
            reservation.start_date = datetime.dateOnly(new Date());
            reservation.end_date = datetime.dateOnly(new Date(), 1);
            reservation.occupants = 1;
            rvm  = new reservationVM(reservation, roomPlanList);
            reservation.type = rvm.resTypeList[0]; //defaults to standard reservation
            reservation.status = rvm.statusList[0];
            reservation.source = rvm.sourceList[0];
            rvm.reservationTypeChanged(); //force an update since we added a default type to the new reservation.
            var resdates = rvm.cleanResDates();
            rvm.updateAvailableRoomsAndResources(resdates, reservation.occupants === 2).then(function () {
              console.log("Reservation " + reservation.reservation_number + " created");
              return deferred.resolve(rvm);
            }, function(err){
              return deferred.reject(err); //pass error up the chain.
            });
          });
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
          dashboard.getReservationByNumber(resnum).then(function (reservation) {
            console.log("Reservation " + reservation.reservation_number + " retrieved");
            var rvm = new reservationVM(reservation, roomPlanList);
            if (readOnly){
              return deferred.resolve(rvm);
            }
            var resdates = rvm.cleanResDates();
            rvm.updateAvailableRoomsAndResources(resdates, reservation.occupants === 2).then(function () {
              return deferred.resolve(rvm);
            }, function(err){
              return deferred.reject(err); //pass error up the chain.
            });
          }, function(err){
            return deferred.reject(err); //pass error up the chain.
          });
        });

        return deferred.promise;
      }
    }; //end of factory
  });
});