/**
 * Defines the Mongoose data models for the hotel reservation application
 */

define(['./module'], function (model) {
  'use strict';
  // ** enums used to control fields in various schemas **
  // Salutaion enum for Guest
  var salutationEnum = ['Dr.', 'Frau', 'Familie', 'Herr', 'Herrn'];
  // item type enum used in ExpenseItem and ItemType schema
  var itemTypeEnum =['Plan','Allgemein', 'Speisen', 'Getränke', 'VDAK', 'AOK & Andere', 'Privat'];
  // enums used in Room and ReservedRoom schemas
  var roomTypeEnum = ['Einzelzimmer', 'Doppelzimmer', 'Suite'];
  var roomTypeAbbrEnum = ['EZ', 'DZ', 'SU', '']
  var roomClassEnum = ['Economy', 'Komfort', 'Balkon', ''];
  var roomClassAbbrEnum=['Econ', 'Komf', 'BK', ''];
  // enums used in Reservation Schema
  var resStatusEnum = ['Sicher', 'Vorreservation'];
  var resSourceEnum = ['Phone', 'Booking.Com'];
  var resInsuranceEnum = ['','VDAK', 'AOK & Andere', 'Privat'];
  var resTypeEnum = ['Std.', 'Bus.', 'Kur', 'Group'];
  // enum for Resource Schema
  var resourceTypeEnum = ['Parkplatz','Konferenzraum'];

  //service (model) that exposes methods to retrieve the various schema enums and some other utility methods
  model.factory('dbEnums', function(){
    return {
      getSalutationEnum: function (){return salutationEnum.slice(0)},
      getItemTypeEnum: function (){return itemTypeEnum.slice(0)},
      getRoomTypeEnum: function (){return roomTypeEnum.slice(0)},
      getRoomTypeAbbrEnum: function (){return roomTypeAbbrEnum.slice(0)},
      getRoomClassEnum: function (){return roomClassEnum.slice(0)},
      getRoomClassAbbrEnum: function (){return roomClassAbbrEnum.slice(0)},
      getReservationStatusEnum:  function (){return resStatusEnum.slice(0)},
      getReservationSourceEnum: function (){return resSourceEnum.slice(0)},
      getReservationInsuranceEnum: function (){return resInsuranceEnum.slice(0)},
      getReservationTypeEnum: function (){return resTypeEnum.slice(0)},
      getResourceTypeEnum: function (){return resourceTypeEnum.slice(0)},
      getRoomDisplayAbbr: function(rmobj){
        if (rmobj && 'room_type' in rmobj && 'room_class' in rmobj) {
          var tix = roomTypeEnum.indexOf(rmobj.room_type);
          var cls = roomClassEnum.indexOf(rmobj.room_class);
          tix = tix === -1 ? 3 : tix;
          cls = cls === -1 ? 3 : cls;
          return roomTypeAbbrEnum[tix] + (roomClassAbbrEnum[cls] === '' ? "" : "-") + roomClassAbbrEnum[cls];
        }
        else {
          return '***';
        }
      }
    }
  });

  // define a child schema for expense_items. Used in RoomPlan and Reservation schema
  model.factory('ExpenseItem', function (db){
    var expenseItem = new db.Schema({
      name: {type: String, required: true },  //comes from ItemTypes schema collection
      category: {type: String, enum: itemTypeEnum},  // the expense item type category
      code: Number, // comes from ItemTypes definition
      no_delete: Boolean, // If true then the item can not be deleted from a reservation or RoomPlan
      day_count: Boolean, // If true then the count value will equal the number of days of the reservation. If false then count is an item count.
      edit_name: Boolean,  //If true then the item_name stored in the reservation for this type can be edited.
      per_person: Boolean, //If true then the item is multiplied by the number of people.
      type_id: Number, // the id of the ItemTypes document that created this ExpenseItem document.
      display_string: String, //Formatting display string using custom format symbols (to be worked out) comes from ItemTypes
      display_order: Number, // used for display order of lists item names
      taxable_rate: Number,  // percent taxed e.g 7 or 19 (%)
      price: Number, //either single item price or total price if isPlanPrice true.
      count: Number   //number of days or item count
    });
    expenseItem.virtual('item_total').get(function(){
      if (this.count && (this.unit_price || this.plan_price)) {
        if (this.plan_price) {
          return this.plan_price;
        }
        else {
          return (this.unit_price * this.count);
        }
      }
      else {
        return 0;
      }
    });
    expenseItem.virtual('item_tax').get(function(){
      if (this.taxable_rate) {
        var taxconv = 1.0 - 1.0/(1 + (this.taxable_rate/100.0));  // expects tax_rate to be in % (e.g. 19 for 19%)
        return this.plan_price ? this.plan_price * taxconv : this.unit_price ? this.unit_price * count * taxconv : 0;
      }
      else {
        return 0;
      }
    });

    return expenseItem;  //return schema not the mongoose model
  });

  // Define a child schema for a reserved room. Used in Reservation schema
  model.factory('ReservedRoom', function (db){
    var schema = new db.Schema({
      number: Number, // the room number
      room_type: String, //the room type from the room table
      room_class: String, //the room class from the room table
      guest: String,  // the guest associated with the room
      price: String,  // the room price
      isCheckedIn: Boolean, // true when the guest in this room has checked in.
      isCheckedOut: Boolean, // true when the guest in this room has been checked out.
      isBilled: Boolean // true when the bill for this room is created and guest checked out.
    });
    schema.virtual('display_type').get(function() {
      return this.room_class + (this.room_class === '' ? "" : "-") + this.room_type;
    });
    return schema;
  });

  // define a child schema for a reserved resource such as a parking spot. Used in Reservation schema
  model.factory('ReservedResource', function (db){
    var schema = new db.Schema({
      name: String, // the resource name (unique)
      resource_type: String, //the resource type from the resource table
      price: String  // the resource price
    });

    return schema;
  });

  // Guest Schema
  model.factory('Guest', function(db) {

    var schema = new db.Schema({
        first_name: { type: String},
        last_name: { type: String, required: true, index: true },
        salutation: { type: String, enum: salutationEnum},
        first_name2: String,
        last_name2: String,
        birthday: Date,
        birthday2: Date,
        email: { type: String}  ,
        firm: String, //unique name from Firm schema
        address1: String,
        address2: String,
        city: String,
        post_code: Number,
        country: String,
        telephone: String,
        comments: String,
        unique_name: {type: String, unique: true} //NOTE this field should not be exposed as an editable field on a UI form. It is generated on save.
    });
    // Virtual fields
    schema.virtual('name').get(function() {
      if (this.salutation) {
        return this.salutation + " " + this.first_name + " " + this.last_name;
      } else {
        return this.first_name + " " + this.last_name;
      }
    });

      schema.pre('save', function(next) {
        var nam = this.salutation ? this.salutation : '';
        nam = this.first_name ? nam.length > 0 ? nam + ' ' + this.first_name : this.first_name : nam;
        nam = nam.length > 0 ? nam + ' ' + this.last_name : this.last_name; //last name always there
        nam = this.city ? nam + ' ('  + this.city + ')' : this.firm ? nam + ' [' + this.firm + ']' : nam;
        this.unique_name = nam;
        next();
      });

    // Instantiating the guest model instance
    return db.model('guest', schema);
  });

  // ItemTypes Schema - schema that define expense item types
  // This collection will be populated with the allowed expense item types.
  model.factory('Itemtype', function(db) {
    var schema = new db.Schema({
      name: {type: String, required: true },  //comes from ItemTypes schema collection
      category: {type: String, enum: itemTypeEnum},  // the expense item type category
      code: Number, // comes from ItemTypes definition
      no_delete: Boolean, // If true then the item can not be deleted from a reservation or RoomPlan
      day_count: Boolean, // If true then the count value will equal the number of days of the reservation. If false then count is an item count.
      edit_name: Boolean,  //If true then the item_name stored in the reservation for this type can be edited.
      per_person: Boolean, //If true then the item is multiplied by the number of people.
      display_string: String, //Formatting display string using custom format symbols (to be worked out) comes from ItemTypes
      display_order: Number, // used for display order of lists item names
      taxable_rate: Number,  // percent taxed e.g 7 or 19 (%)
      default_unit_price: Number
    });

    return db.model('itemtype', schema);
  }) ;

  model.factory('RoomPlan', function (db, ExpenseItem){
    var schema = new db.Schema({
      name: {type: String, required: true, unique: true },
      resTypeFilter: [String], //A string array of allowed reservation types for this plan.
      is_default: Boolean, // True if plan is the default plan pre selected from the list of plans within same type
      is_plan: Boolean,  //True if this is a package plan
      is_group: Boolean, // True if this is a group plan with multiple rooms allowed.
      one_bill: Boolean, // True if a group plan reservation requires one bill for all guests (e.g. Tour group).
      one_room: Boolean, // True if the plan limits the reservation to only one room.
      single_only: Boolean, // True if room plan only applies to single rooms
      double_only: Boolean, // True if room plan only applies to double rooms and suites.
      needs_firm: Boolean, //True if plan requires a firm name as part of the reservation.
      needs_insurance: Boolean, //True if plan requires an insurance provider as part of the reservation.
      pp_price: Number, // Per person price based on Double Room
      single_surcharge: Number, // Extra amount paid by single person
      duration: Number, //Number of days the plan covers
      display_string: String,
      required_items: [ExpenseItem] // A list of required expense items that are associated with a room plan.
    });

    return db.model('roomplan', schema);
  });

  // Reservation schema
  model.factory('Reservation', function(db, ExpenseItem, ReservedRoom, ReservedResource, datetime){
    var schema = new db.Schema({
      reservation_number: {type: Number, required: true, unique: true, index: true},   //generated by app contains the year as part of the number e.g.1400001
      type: {type: String, enum: resTypeEnum},  // determines if business, standard, group etc.
      title: { type: String, required: true}, //name of reservation - individual or firm
      guest: {name: String, id: db.Schema.Types.ObjectId}, //primary guest or contact from Guests list
      firm: String,
      start_date: { type: Date, required: true},
      end_date: { type: Date, required: true},
      checked_in: Date, // set when all rooms in this reservation have been checked in.
      checked_out: Date, // set when all rooms in this reservation have been checked out.
      occupants: Number,
      rooms: [ReservedRoom],
      resources: [ReservedResource],  //such as parking spots
      status: {type: String, enum: resStatusEnum},
      plan: String,  //Name of selected plan
      plan_code: Number,   //id of selected plan
      insurance: {type: String, enum: resInsuranceEnum} ,
      insurance_code: Number,
      source: {type: String, enum: resSourceEnum},
      comments: String,
      address1: String,  //address fields to be printed on the bill, come from guest or firm collections
      address2: String,
      city: String,
      post_code: Number,
      country: String,
      individualBill: Boolean, // true if is a multi-room reservation but requires an individual bill for each room
      expenses: [ExpenseItem]
    });

    // virtual field to return the number of nights stayed
    schema.virtual('nights').get(function() {
       return datetime.getNightsStayed(this.start_date, this.end_date);
    });
    // virtual field is true if the current date = start_date and res. has not yet been checked in.
    schema.virtual('canCheckIn').get(function() {
      return (!this.checked_in && (datetime.dateOnly(this.start_date).getTime() === datetime.dateOnly(new Date()).getTime()));
    });
    // virtual field is true if reservation is checked in but not checked out
    schema.virtual('canCheckOut').get(function() {
      return (this.checked_in && !this.checked_out);
    });
    // virtual field that returns the total amount of the bill for this reservation.
    schema.virtual('totalBill').get(function(){
      // todo-loop through all expenses and total amounts (try an reference calc fields on child schema.
      return 0;
    });
    // virtual field that returns an array of the taxes on the bill grouped by tax rate. Array of objects returned.
    schema.virtual('taxTotals').get(function(){
      //todo-get all taxable amounts and group by tax rate and sum
      return [{rate: 0, total: 0}];
    });

    return db.model('reservation', schema);
  });

  // Schema for a business firm
  model.factory('Firm', function(db) {
    var schema = new db.Schema({
      firm_name: {type: String, required: true, unique: true},
      address1: String,
      address2: String,
      city: String,
      post_code: Number,
      country: String,
      contact: {name: String, phone: String, email: String},
      room_price: Number,
      comments: String
    });

    return db.model('firm', schema);
  });

  //Schema for room resource
  model.factory('Room', function(db) {

    var schema = new db.Schema({
      number: {type: Number, required: true, unique: true},
      room_type: {type: String, enum: roomTypeEnum},
      room_class: {type: String, enum: roomClassEnum},
      display_order: Number, //to allow sorting by room_type
      price: Number
    });

    // virtual method that generates a display name which concatenates the type with the class. Used for UI
    // display objects. If the room number is 0 then it generates a display_name of <Zimmer auswählen>
    schema.virtual('display_name').get(function() {
      if (this.number) {
        return this.number + " (" + this.room_class + (this.room_class === '' ? "" : "-") + this.room_type + ")";
      }
      else {
        return "<Zimmer auswählen>";
      }
    });
    // virtual method that generates an abbreviated display name which concatenates the type with the class. Used for UI
    // display objects.
    schema.virtual('display_abbr').get(function() {
      var tix = roomTypeEnum.indexOf(this.room_type);
      var cls = roomClassEnum.indexOf(this.room_class);
      tix = tix === -1 ? 3 : tix;
      cls = cls === -1 ? 3 : cls;
      return roomTypeAbbrEnum[tix] + (roomClassAbbrEnum[cls] === '' ? "" : "-") + roomClassAbbrEnum[cls];
    });

    return db.model('room', schema);
  });

  //Schema for other reservable resources (parking, conference room etc)
  model.factory('Resource', function(db) {
    var schema = new db.Schema({
      name: {type: String, required: true, unique: true},
      resource_type: {type: String, enum: resourceTypeEnum},
      display_order: Number, // to allow specific sorting (e.g. by type)
      multiple_allowed: Boolean,  // if true then multiple entries of this type are allowed, else only one allowed per res.
      price: Number
    });

    return db.model('resource', schema);
  });

  // still need schema for diverses, kur&Heilmittel and Andere Preis Liste (may want to handle differently)
}); //module end