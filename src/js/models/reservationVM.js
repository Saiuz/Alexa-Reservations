/**
 * Reservation view-model. Incorporates the business logic for creating and managing reservations. Is the glue between
 * the view and the database Reservation model.
 * Note this factory creates a singleton which is problematic if multiple controllers need to persist the underlying
 * version of the database Reservation model.
 * todo- Logic:
 *    When a plan is selected that has a plan_price, need to change the Zimmer Pries label to Plan Pries
 *    and update the price with the plan price. This will also negate the auto update of the price based on the
 *    room selection.
 * todo - Logic: (IMPORTANT)
 *    When firm is selected, the guest field must be cleared if there is a guest selected.
 *    Also when firm is hidden same thing must be done.
 * todo - logic
 *    need better logic for displaying fields past room e.g. if business and firm is not selected should not see rooms
 *    because it will throw an error when it tries to update room price.
 * todo - pre save logic for new reservation should add a room expense and optionally a parkplatz and conf. room.
 */
define(['./module'], function (model) {
  'use strict';
  model.factory('ReservationVM', function ($q, Reservation, dbEnums, dashboard, datetime) {
   console.log("Invoking ReservationVM");

    // *** private variables and methods ***

    // clean the db reservation model start and end dates. Converts them to javaScript date objects and
    // removes any time values.
    var _cleanResDates = function () {
      return {
        start: datetime.dateOnly(new Date(_this.reservation.start_date)),
        end: datetime.dateOnly(new Date(_this.reservation.end_date))
      };
    };

    // populates arrays of room plans value/text objects that can be used by the UI
    // also populates room plan prices for plans that are whole packages.
    var _getRoomPlans = function () {
      return dashboard.getRoomPlanList().then(function (list) {

       //var firstItem =  {value: 0, name: _this.roomPlanFirstText, price: 0, code: 0};
       // var errorItem = [{value: 0, name: '*** ERROR ***', price: 0, code: 0}];

        _this.roomPlans = list;  //all plans from db
//        _this.roomPlans = []; //filtered list based on reservation type
//        if (_this.roomPlanFirstText.length) {
//          _this.roomPlans.push(firstItem);
//        }
//
//        if (list.length > 0) {
//          angular.forEach(list, function (item) {
//            if (item.resTypeFilter.indexOf(_this.reservation.type) >= 0) {
//              _this.roomPlans.push(item);
//            }
//          });
//          //_findSingleRoomPlan();
//        }
//        else {  //no rooms plans found
//          if (_this.roomPlansAll.length === 0) {
//            _this.roomPlansAll = [errorItem];
//          }
//        }
        _this.selectedPlan = _this.roomPlans[0]; //todo-only for new case. Need to add logic to update selected plan if res has an existing plan. Also may need to add
        //todo - business logic that prevents zimmer plan change for an existing res
      });
    };

    //initialize the static properties of the VM
    // NOTE: room plan logic currently assumes that the standard and business res. types share the
    // same plans. Need to verify if this is true. May need to split into three separate plan groups.
    var _initializeVM = function () {
      var deferred = $q.defer();
      _getRoomPlans().then(function () {
        deferred.resolve();
      });
      return deferred.promise;
    };

    // This method is called when an existing reservation is brought into the model
    // It will set the view model properties accordingly
    var _setModel = function () {
      //need to refactor from old
    };
    // ******* ViewModel definition  ********
    var ReservationVM = function () {
    };
    var _this = ReservationVM; //shortcut

    // *** public properties assigned to VM
    _this.reservation = {}; // The reservation object
    _this.roomPlans = []; // The list of available room plans for the reservation. This list is filtered based on
                          // reservation type.
    _this.selectedPlan = {}; // The currently selected room plan object
    _this.isStandard = false; // viewmodel property that is true if the reservation is a standard reservation
    _this.isBusiness = false; // viewmodel property that is true if the reservation is a business reservation
    _this.isCure = false; // viewmodel property that is true if the reservation is a cure reservation
    _this.isGroup = false; // viewmodel property that is true if the reservation is a group reservation
    _this.nights = 0; //property of the viewmodel since the Reservation schema property is calculated.
    _this.statusList = dbEnums.getReservationStatusEnum();
    _this.sourceList = dbEnums.getReservationSourceEnum();
    _this.resTypeList = dbEnums.getReservationTypeEnum(); //holds a list of the reservation types e.g. standard, business, cure
    _this.insuranceList = dbEnums.getReservationInsuranceEnum();

    // *** Public methods assigned to VM ***

    //creates a new reservation and gets the new reservation number.
    // The method will also initialize the start_date, end_date, nights and occupants properties of the reservation
    // with default values. It will select the default reservation type of standard and a room plan of single room,
    //
    // NOTE: this method does not reserve the reservation number so it only works in a single user environment.
    _this.newReservation = function () {
      var deferred = $q.defer();
      dashboard.getNewReservationNumber().then(function (val) {
        _this.reservation = new Reservation();
        _this.reservation.reservation_number = val;
        _this.reservation.type = _this.resTypeList[0]; //defaults to standard reservation
        _this.reservation.start_date = datetime.dateOnly(new Date());
        _this.reservation.end_date = datetime.dateOnly(new Date(), 1);
        _this.nights = 1;
        _this.reservation.occupants = 1;
        _this.reservation.status = _this.statusList[0];
        _this.reservation.source = _this.sourceList[0];
        _initializeVM().then(function () {
          _this.selectedPlan = _this.roomPlans[0];  // todo-may need different logic to default to single room
          //_this.resTypeChanged(); // set room plans based on res type default
          console.log("New reservation created");
          return deferred.resolve(_this.reservation);
        });
      });

      return deferred.promise;
    };

    // Retrieves the specified reservation and updates view model
    _this.getReservation = function (resnum) {
      var deferred = $q.defer();
      dashboard.getReservationByNumber(resnum).then(function (res) {
        _this.reservation = res;
        _initializeVM().then(function () {
          _setModel();
          return deferred.resolve(_this.reservation);
        });
      });    //todo - get room plans and set appropriate properties such as isBusiness and nights

      return deferred.promise;
    };

    // *** End of ViewModel factory, return the VM class.
    return _this;
  });

  // Guest Schema
  model.factory('ReservationVM_old', function ($q, Reservation, dbEnums, dashboard, datetime) {
    // private variables
    var _singleRoomDefault = 2, //database id of basic single room plan
        _doubleRoomDefault = 3, //database id of basic double room plan
        _singleRoomIndexBus, // location in room plan array of bus. single plan
        _doubleRoomIndexBus, // location in room plan array of bus. double plan
        _singleRoomIndexStd, // location in room plan array of bus. single plan
        _doubleRoomIndexStd; // location in room plan array of bus. double plan

    console.log("Invoking ReservationVM");

    // define the model
    var ReservationVM = function () {
    };
             //todo - extend logic to handle the four reservation types (normal and business similar plans)
    var _this = ReservationVM;  // and a shortcut
    // ** Configuration properties ** todo-move these into a configuration object
    _this.roomListFirstText = ''; //consumer provides text that is placed as the first item before the room list
    _this.roomListEmptyText = ''; //consumer provides text that becomes the sole entry for an empty room list.
    _this.roomPlanFirstText = '<Select a room plan>'; //consumer provides text that is placed as the first item before the room plan list
    _this.resourceListFirstText = '-- Not Required --'; //consumer provides text that is placed as the first item before the parking or conf rm list
    _this.resourceListEmptyText = '** Not Available **'; //consumer provides text that becomes the sole entry for an empty parking or conf rm list.

    // ** model properties  **
    _this.reservation = {}; // The reservation object
    _this.roomPlansAll = []; // provides list of all room plans available
    _this.roomPlans = []; // this list changes depending on the value of the reservation type - this property
                          // should be used by the UI, the above four are made available just in case.
    _this.selectedPlan = {}; // The currently selected room plan object
    _this.isStandard = false; // viewmodel property that is true if the reservation is a standard reservation
    _this.isBusiness = false; // viewmodel property that is true if the reservation is a business reservation
    _this.isCure = false; // viewmodel property that is true if the reservation is a cure reservation
    _this.nights = 0; //property of the viewmodel since the Reservation schema property is calculated.
    _this.availableRooms = []; // list of available rooms for the date range of the db reservation model
    _this.selectedRoom = {}; // selected room from the availableRooms
    _this.availableParking = [];
    _this.selectedParking = {};
    _this.availableConfRm = [];
    _this.selectedConfRm = {};
    _this.selectedGuest = {};
    _this.selectedFirm = {};
    _this.statusList = dbEnums.getReservationStatusEnum();
    _this.sourceList = dbEnums.getReservationSourceEnum();
    _this.resTypeList = dbEnums.getReservationTypeEnum(); //holds a list of the reservation types e.g. standard, business, cure
    _this.insuranceList = dbEnums.getReservationInsuranceEnum();

    //** model methods **
    //
    //creates a new reservation and gets the new reservation number.
    // The method will also initialize the start_date, end_date, nights and occupants properties of the reservation
    // with default values. It will select the default reservation type of standard and a room plan of single room,
    //
    // NOTE: this method does not reserve the reservation number so it only works in a single user environment.
    _this.newReservation = function () {
      var deferred = $q.defer();
      dashboard.getNewReservationNumber().then(function (val) {
        _this.reservation = new Reservation();
        _this.reservation.reservation_number = val;
        _this.reservation.type = _this.resTypeList[0]; //defaults to standard reservation
        _this.reservation.start_date = datetime.dateOnly(new Date());
        _this.reservation.end_date = datetime.dateOnly(new Date(), 1);
        _this.nights = 1;
        _this.reservation.occupants = 1;
        _this.reservation.status = _this.statusList[0];
        _this.reservation.source = _this.sourceList[0];
        _initializeVM().then(function () {
          _this.selectedPlan = _this.roomPlans[_singleRoomIndexStd];  // Default to Single room
          _this.resTypeChanged(); // set room plans based on res type default
          console.log("New reservation created");
          return deferred.resolve(_this.reservation);
        });
      });

      return deferred.promise;
    };

    // Retrieves the specified reservation and updates view model
    _this.getReservation = function (resnum) {
      var deferred = $q.defer();
      dashboard.getReservationByNumber(resnum).then(function (res) {
        _this.reservation = res;
        _initializeVM().then(function () {
          _setModel();
          return deferred.resolve(_this.reservation);
        });
      });    //todo - get room plans and set appropriate properties such as isBusiness and nights

      return deferred.promise;
    };

    // finds available rooms for the current reservation object.
    _this.getAvailableRooms = function () {
      var deferred = $q.defer();
      if (!(_this.reservation.start_date && _this.reservation.end_date)) {
        deferred.resolve(0);
      }
      else {
        _this.reservation.rooms = [];
        var dbl = (_this.reservation.occupants > 1);
        _this.availableRooms = _this.roomListFirstText.length ? [
          {
            value: 0,
            text: _this.roomListFirstText,
            prices: {}
            //todo-add price data from room model here. that way we can update price for non business reservations
            // withouth doing another query to the db.
          }
        ] : [];
        var d = _cleanResDates();
        dashboard.findAvailableRooms(d.start, d.end, dbl).then(function (rooms) {
          console.log('%d available rooms found', rooms.length);
          if (rooms.length > 0) {
            angular.forEach(rooms, function (item) {
              _this.availableRooms.push(
                  {
                    value:  item.number,
                    text:   item.number + ' (' + item.room_type + ')',
                    prices: item.price
                  });
            });
          }
          else {
            _this.availableRooms = _this.roomListEmptyText.length ? [
              {value: 0, text: _this.roomListEmptyText}
            ] : [];
          }
          _this.selectedRoom = _this.availableRooms.length ? _this.availableRooms[0] : {};
          deferred.resolve(rooms.length);
        });
      }

      return deferred.promise;
    };

    // method to update room price from selected room or selected plan
    // the plan code determines how to find the price. Prices are built into the selected room items and
    // the selected plan items. todo - need to work out all the pricing logic, currently very simple
    _this.updateRoom = function () {
      if (_isNotEmpty(_this.selectedRoom)) {
        _this.reservation.room = _this.selectedRoom.value;
        if (_this.selectedPlan && _this.selectedPlan.code === 1) { // get price from room base or firm if business
          _this.reservation.room_price = _this.isBusiness ? _this.selectedFirm.price : _this.selectedRoom.prices.base_rate;
        }
        else if (this.selectedPlan && this.selectedPlan.code === 2) { // use the fixed price from the plan
          _this.reservation.room_price = _this.selectedPlan.price;
        }
      }
    };

    // find available parking spaces for the current reservation dates
    // logic is slightly different in that the default value is always "not required"
    // todo- factor the next two methods into one
    _this.getAvailableParking = function () {
      var deferred = $q.defer();
      if (!(_this.reservation.start_date && _this.reservation.end_date)) {
        deferred.resolve(0);
      }
      else {
        _this.reservation.park_place = undefined;
        _this.reservation.park_price = undefined;
        _this.availableParking = [
          {
            value: 0,
            text: _this.resourceListFirstText,
            price: 0
          }
        ];
        var d = _cleanResDates();
        dashboard.findAvailableResources(d.start, d.end, 'Parkplatz').then(function (places) {
          console.log('%d available parking found', places.length);
          if (places.length > 0) {
            angular.forEach(places, function (item) {
              _this.availableParking.push({value: item._id.id, text: item.name, price: item.price});
            });
          }
          else {  //add a default value if none found  todo-may need to tweak the logic since parking is optional
            _this.availableParking = [
              {
                value: 0,
                text: _this.resourceListEmptyText,
                price: 0
              }
            ];
          }
          _this.selectedParking = _this.availableParking[0];
          deferred.resolve(places.length);
        });
      }

      return deferred.promise;
    };

    // method to be attached to the click method of a UI control that selects a parking place
    _this.updateParking = function () {
      if (_this.selectedParking.value === 0) {
        _this.reservation.park_place = undefined;
        _this.reservation.park_price = undefined;
      }
      else {
        _this.reservation.park_place = _this.selectedParking.text;
        _this.reservation.park_price = _this.selectedParking.price;
      }
    };

    // find available conference rooms for the current reservation dates
    // logic is slightly different in that the default value is always "not required"
    _this.getAvailableConfRm = function () {
      var deferred = $q.defer();
      if (!(_this.reservation.start_date && _this.reservation.end_date)) {
        deferred.resolve(0);
      }
      else {
        _this.reservation.conf_room = undefined;
        _this.reservation.conf_price = undefined;
        _this.availableConfRm = [
          {
            value: 0,
            text: _this.resourceListFirstText, // Same message as for parking
            price: 0
          }
        ];
        var d = _cleanResDates();
        dashboard.findAvailableResources(d.start, d.end, 'Konferenzraum').then(function (res) {
          console.log('%d available conference room found ', res.length);
          if (res.length > 0) {
            angular.forEach(res, function (item) {
              _this.availableConfRm.push({value: item._id.id, text: item.name, price: item.price});
            });
          }
          else {  //add a default value if none found  todo-may need to tweak the logic since parking is optional
            _this.availableConfRm = [
              {
                value: 0,
                text: _this.resourceListEmptyText,
                price: 0
              }
            ];
          }
          _this.selectedConfRm = _this.availableConfRm[0];
          deferred.resolve(res.length);
        });
      }

      return deferred.promise;
    };

    // method to be attached to the click method of a UI control that selects a conference room
    _this.updateConfRm = function () {
      if (_this.selectedConfRm.value === 0) {
        _this.reservation.conf_room = undefined;
        _this.reservation.conf_price = undefined;
      }
      else {
        _this.reservation.conf_room = _this.selectedConfRm.text;
        _this.reservation.conf_price = _this.selectedConfRm.price;
      }
    };

    // update the Guest name when a guest is selected in the vm
    _this.guestChanged = function ($item, $model, $label) {
      _this.reservation.guest = {name: $item.name, id: $item.id};
      _this.selectedGuest = $item;
      _updateTitle();
    };

    // update firm info when a firm is selected in the vm
    _this.firmChanged = function ($item, $model, $label) {
      _this.reservation.firm = $item.name;
      _this.selectedFirm = $item;
      _updateTitle();
    };

    // update end date when start date changes then update available rooms.
    // end date = start date plus nights
    _this.startDateChanged = function () {
      var d = _cleanResDates();
      _this.reservation.end_date = datetime.dateOnly(d.start, _this.nights);
      _this.getAvailableRooms();
      _this.getAvailableParking();
      _this.getAvailableConfRm();
    };

    // update nights because end date changed, then update available rooms.
    _this.endDateChanged = function () {
      var d = _cleanResDates();
      _this.nights = datetime.getNightsStayed(d.start, d.end);
      _this.getAvailableRooms();
      _this.getAvailableParking();
      _this.getAvailableConfRm();
    };

    // update end date because nights changed
    _this.nightsChanged = function () {
      var d = _cleanResDates();
      _this.reservation.end_date = datetime.dateOnly(d.start, _this.nights);
      _this.getAvailableRooms();
      _this.getAvailableParking();
      _this.getAvailableConfRm();
    };

    // update business plan and available rooms because occupant number has changed
    _this.occupantsChanged = function () {
      _this.resTypeChanged();
      _this.getAvailableRooms();
      _this.getAvailableParking();
      _this.getAvailableConfRm();
    };

    // Callback for any UI element that changes the reservation type. This will select the correct room plan
    // list and perform other initialization.
    // Note this logic currently assumes that the standard and business res. types share the same plans.
    _this.resTypeChanged = function () {
      if (!_this.selectedPlan) {   //todo-figure out why this was needed
        _this.selectedPlan = _this.roomPlans[0];
      };
      var ix = _this.resTypeList.indexOf(_this.reservation.type);
      this.isStandard = false;
      this.isBusiness = false;
      this.isCure = false;

      switch (ix) {
        case 0:
          _this.isStandard = true;
          break;
        case 1:
          this.isBusiness = true;
          break;
        case 2:
          this.isCure = true;
          break;
        default:
          console.log("ReservationVM, invalid reservation type: " + _this.reservation.type)
      }

      if (_this.isBusiness) {
        _this.roomPlans = _this.roomPlansBus;
        _this.reservation.plan = _this.roomPlans[_singleRoomIndexBus + (_this.reservation.occupants - 1)].name;
        _this.reservation.plan_code = _this.roomPlans[_singleRoomIndexBus + (_this.reservation.occupants - 1)].code;
        _this.selectedPlan = _this.roomPlans[_singleRoomIndexBus + (_this.reservation.occupants - 1)];
      }
      else if (_this.isStandard) {
        _this.roomPlans = _this.roomPlansStd;
        if (_this.selectedPlan.value === _singleRoomDefault || _this.selectedPlan.value === _doubleRoomDefault) {
          _this.reservation.plan = _this.roomPlans[_singleRoomIndexStd + (_this.reservation.occupants - 1)].name;
          _this.reservation.plan_code = _this.roomPlans[_singleRoomIndexStd + (_this.reservation.occupants - 1)].code;
          _this.selectedPlan = _this.roomPlans[_singleRoomIndexStd + (_this.reservation.occupants - 1)];
        }
        else {
          _this.reservation.plan = '';
          _this.reservation.plan_code = 0;
          _this.selectedPlan = _this.roomPlans[0];
          _this.reservation.room = 0;
          _this.reservation.room_price = 0;
        }
      } else {   // cure
        _this.roomPlans = _this.roomPlansKur;
        _this.reservation.plan = '';
        _this.reservation.plan_code = 0;
        _this.selectedPlan = _this.roomPlans[0];
        _this.reservation.room = 0;
        _this.reservation.room_price = 0;
      }
      _this.updateRoom();
    };

    // Callback that needs to be called when the room plan changes.
    // Updates the reservation room_plan and also the occupants if the room plan is either
    // 'Übernachtung im Einzelzimmer' or 'Übernachtung im Doppelzimmer'
    _this.roomPlanChanged = function () {
      console.log("Room plan changed: " + _this.selectedPlan.name);
      switch (_this.selectedPlan.value) {
        case _singleRoomDefault:
          _this.reservation.occupants = 1;
          break;

        case _doubleRoomDefault:
          _this.reservation.occupants = 2;
          break;
        default :

      }
      _this.reservation.plan = _this.selectedPlan.name;
      _this.reservation.plan_code = this.selectedPlan.code;
      if (_this.reservation.room) _this.updateRoom();
    };

    // ****  private methods used for promise chaining etc.****

    //initialize the static properties of the VM
    // NOTE: room plan logic currently assumes that the standard and business res. types share the
    // same plans. Need to verify if this is true. May need to split into three separate plan groups.
    var _initializeVM = function () {
      var deferred = $q.defer();
      _getRoomPlans().then(function () {
        deferred.resolve();
      });
      return deferred.promise;
    };

    // This method is called when an existing reservation is brought into the model
    // It will set the view model properties accordingly
    // todo- need to also set the selectedxxx properties for parking, conf rm, guest and firm
    var _setModel = function() {
      if (!_this.reservation) return;
      var ix = _this.resTypeList.indexOf(_this.reservation.type);
      _this.isStandard = false;
      _this.isBusiness = false;
      _this.isCure = false;

      switch (ix) {
        case 0:
          _this.isStandard = true;
          _this.roomPlans = _this.roomPlansStd;
          var ix = _findRoomPlanIndex(_this.roomPlansStd, _this.reservation.plan);
          _this.selectedPlan =  _this.roomPlansStd[ix];
          break;
        case 1:
          _this.isBusiness = true;
          _this.roomPlans = _this.roomPlansBus;
          var ix = _findRoomPlanIndex(_this.roomPlansBus, _this.reservation.plan);
          _this.selectedPlan =  _this.roomPlansBus[ix];
          break;
        case 2:
          _this.isCure = true;
          _this.roomPlans = _this.roomPlansKur;
          var ix = _findRoomPlanIndex(_this.roomPlansKur, _this.reservation.plan);
          _this.selectedPlan =  _this.roomPlansKur[ix];
          break;
        default:
          console.log("ReservationVM, invalid reservation type: " + _this.reservation.type)
      }

    } ;

    //BL: expect first element to be 'Übernachtung im Einzelzimmer' and the second element to be
    //    'Übernachtung im Doppelzimmer'  (or equivalent). Only two types available for bus res.
    var _findSingleRoomPlan = function () {
      var ix = 0;
      while (_this.roomPlansBus[ix].value !== _singleRoomDefault) {
        ix++;
      }
      _singleRoomIndexBus = ix;

      ix = 0;
      while (_this.roomPlansBus[ix].value !== _doubleRoomDefault) {
        ix++;
      }
      _doubleRoomIndexBus = ix;

      ix=0;
      while (_this.roomPlansStd[ix].value !== _singleRoomDefault) {
        ix++;
      }
      _singleRoomIndexStd = ix;

      ix = 0;
      while (_this.roomPlansStd[ix].value !== _doubleRoomDefault) {
        ix++;
      }
      _doubleRoomIndexStd = ix;
    };

    // find the index within the plan array containing the specified plan name
    var _findRoomPlanIndex = function(planList, name){
       var ix = -1;
      for (var i = 0; i < planList.length; i++){
        if (planList[i].name === name) {
          ix = i;
          break;
        }
      }
      return ix;
    } ;

    // populates arrays of room plans value/text objects that can be used by the UI
    // also populates room plan prices for plans that are whole packages.
    var _getRoomPlans = function () {
      return dashboard.getRoomPlanList().then(function (list) {

        var firstItem =  {value: 0, name: _this.roomPlanFirstText, price: 0, code: 0};
        var errorItem = [{value: 0, name: '*** ERROR ***', price: 0, code: 0}];

        _this.roomPlansAll = list;  //all plans from db
        _this.roomPlans = []; //filtered list based on reservation type
        if (_this.roomPlanFirstText.length) {
          _this.roomPlans.push(firstItem);
        }

        if (list.length > 0) {       //todo- factor into a sub
          angular.forEach(list, function (item) {
            if (item.resTypeFilter.indexOf(_this.reservation.type) >= 0) {
              _this.roomPlans.push(item);
            }
          });
         //_findSingleRoomPlan();
        }
        else {  //no rooms plans found
          if (_this.roomPlansAll.length === 0) {
            _this.roomPlansAll = [errorItem];
          }
        }
        _this.selectedPlan = _this.roomPlans[0]; //todo-only for new case. Need to add logic to update selected plan if res has an existing plan. Also may need to add
        //todo - business logic that prevents zimmer plan change for an existing res
      });
    };

    // clean the db reservation model start and end dates. Converts them to javaScript date objects and
    // removes any time values.
    var _cleanResDates = function () {
      return {
        start: datetime.dateOnly(new Date(_this.reservation.start_date)),
        end: datetime.dateOnly(new Date(_this.reservation.end_date))
      };
    };

    // updates the title based on name or firm if buisiness
    var _updateTitle = function () {
       if (_this.isBusiness) {
         _this.reservation.title = _this.reservation.firm + (_this.reservation.guest ? " (" + _this.reservation.guest.name + ")" : "");
       }
      else {
         _this.reservation.title = _this.reservation.guest ? _this.reservation.guest.name  : "";
       }
    }

    // Tests if an object is not empty, e.g. {} , has it's own properties
    var _isNotEmpty = function(obj) {
      return Object.keys(obj).length !== 0;
    } ;

    // End of viewmodel factory, return the view model.
    return _this;
  });
});