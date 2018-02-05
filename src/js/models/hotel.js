/**
 * Defines the Mongoose data models for the hotel reservation application
 */
define(['./module'], function (model) {
  'use strict';

  // ** enums used to control fields in various schemas **
  // Salutaion enum for Guest
  var salutationEnum = ['', 'Herrn', 'Frau', 'Familie', 'Herrn Dr.', 'Dr.','Herr', 'Damen', 'Prof. Dr.', 'Herrn Pfarrer', 'Gräfin']; // provides display order
  var salutationSearchOrder = [6,7,0,1,2,3,4,5,8];// order to search for salutations (two word salutations first)
  // item type enum used in ExpenseItem and ItemType schema
  var itemTypeEnum =['Plan', 'Allgemein', 'Speisen', 'Getränke', 'Dienste', 'VDAK', 'AOK & Andere', 'Privat'];
  // enums used in Room and ReservedRoom schemas
  var roomTypeEnum = ['Einzelzimmer', 'Doppelzimmer', 'Suite'];
  var roomTypeAbbrEnum = ['EZ', 'DZ', 'SU', ''];
  var roomClassEnum = ['Economy', 'Standard', 'Komfort', 'Balkon', ''];
  var roomClassAbbrEnum=['Econ', 'Std', 'Komf', 'BK', ''];
  // enums used in Reservation Schema
  var resStatusEnum = ['Sicher', 'Vorreservation'];
  var resSourceEnum = ['Telefon', 'DIRS21','HRS Group', 'Booking.Com', 'Andere'];
  var resInsuranceEnum = ['','VDAK', 'AOK & Andere', 'Privat'];
  var resTypeEnum = ['Std.', 'Bus.', 'Kur', 'Gruppe'];
  // enum for Resource Schema
  var resourceTypeEnum = ['Parkplatz'];

  //service (model) that exposes methods to retrieve the various schema enums and some other utility methods
  model.factory('dbEnums', function(){
    return {
      getSalutationEnum: function (){return salutationEnum.slice(0);},
      getItemTypeEnum: function (){return itemTypeEnum.slice(0);},
      getRoomTypeEnum: function (){return roomTypeEnum.slice(0);},
      getRoomTypeAbbrEnum: function (){return roomTypeAbbrEnum.slice(0);},
      getRoomClassEnum: function (){return roomClassEnum.slice(0);},
      getRoomClassAbbrEnum: function (){return roomClassAbbrEnum.slice(0);},
      getReservationStatusEnum:  function (){return resStatusEnum.slice(0);},
      getReservationSourceEnum: function (){return resSourceEnum.slice(0);},
      getReservationInsuranceEnum: function (){return resInsuranceEnum.slice(0);},
      getReservationTypeEnum: function (){return resTypeEnum.slice(0);},
      getResourceTypeEnum: function (){return resourceTypeEnum.slice(0);},
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
      },
      stdResType: resTypeEnum[0],
      kurResType: resTypeEnum[2],
      //some specific plan types
      itemTypePlan: function() {return itemTypeEnum.slice(0)[0];},
      // extracts the salutation (title) from a name
      extractSalutation: function(name)  {
        var salutation = '',
            ix, olen, newName;
        if (name) {
          olen = name.length;
          for (ix = 0; ix < salutationEnum.length; ix++) {
            newName = name.replace(salutationEnum[salutationSearchOrder[ix]], '');
            if (newName.length != olen) {
              salutation = salutationEnum[ix];
              break;
            }
          }
        }
        return salutation;
      }
    }
  });

  // Model for constants collection. This collection contains constants that are used throughout the application but
  // the UI will expose the values so that the user can update the values. The UI should not let the user add or delete
  // constants. A constant can have either a numeric value or string value.
  model.factory('AppConstants', function(dbConfig) {
    console.log('Creating AppConstants model');
    var schema = new dbConfig.db.Schema({
      name: {type: String, required: true, unique: true },
      display_name: String,
      nvalue: Number,
      svalue: String,
      units: String
    });

    return dbConfig.db.model('AppConstants', schema);
  });

  // define a child schema for expense_items. Used in RoomPlan and Reservation models as embedded document properties.
  // The schema is also used in the ExpenseType model.
  // This schema is very similar to the ExpenseType's schema.
  model.factory('ExpenseItem', function (dbConfig, convert, configService, dbEnums){
    console.log('Creating ExpenseItem model');
    var expenseItem = new dbConfig.db.Schema({
      name: {type: String, required: true },  //Name of item type, often used to display on bill
      category: {type: String, enum: itemTypeEnum},  // the expense item type category
      bill_code: {type: Number, required: true }, // groups expense items into categories for display on bill. Each category has 10 bill_code values,
                         // assigned to it, e.g. Plan - 0 to 9, Getränke - 10 to 19 etc. See config.constants service for more info.
      guest: String, // The guest name the expense item is associated with.
      room: Number, // the room number the expense item is associated with.
      date_added: Date, // Date-time stamp for when this item was added to the room.
      last_updated: Date, //Date-time stamp for when this item was last modified.
      is_system: Boolean, // Set true if this item is a "system" required item and can't be modified by the UI
      is_room: Boolean, // True if this expense item represents an actual room expense for a reservation.
      included_in_room: Boolean, // True if the taxable price or price of this item is included in the room price associated with the reservation
      per_room: Boolean, // If true then this item should be duplicated for each room. Used by room plan items.
      per_person: Boolean, //If true then the item should be  duplicated for each person in a room room
      no_delete: Boolean, // If true then the item can not be deleted from a reservation or RoomPlan
      no_display: Boolean, // If true then the item is not displayed but is used as part of the bill calculation
      day_count: Boolean, // If true then the item count is controlled by the number of days of the reservation
      one_per: Boolean, // If true then only one item is allowed per person per reservation if the 'per_person' flag is
                        // set, or only one item per room if the 'per_room' flag is set. If no_display is true then this is ignored.
      edit_name: Boolean,  //If true then the item_name stored in the reservation for this type can be edited.
      edit_count: Boolean, // If true then the UI allows the count value to be edited.
      fix_price: Boolean, // If true then the UI will NOT allow the price value to be edited. Normal behavior is to have price editable.
      bus_pauschale: Boolean, // If true this expense item  can be rolled up along with others like it into one expense item on the bill "Business Pauschale"
      low_tax_rate: Boolean, // If true then tax calculations will use the low (room tax rate) vs the normal sales tax rate.
      //type_id: Number, // the id of the ItemTypes document that created this ExpenseItem document.
      display_string: String, //Formatting display string using custom format symbols
      display_order: Number, // used for display order of lists item names
      price_lookup: String, // If it contains a string value, the initial price will be looked up in the Constants
                            // object. The value in price_lookup is the name of the constant containing the price.
      double_price: Number, // Specific to package plan room items represents the daily room price for a double room
      taxable_price: Number, // If a non 0 value is provided, then this number is used to calculate the tax while the
                             // value of the price field will be used as a displayed value on the bill, otherwise the
                             // value of price is used in the tax calculation.
      single_price: Number, // ditto to double_price
      credit: Number, //If an item is credited e.g. plan item not available, the credited amount is stored here.
      price: {type: Number, default: 0}, //either single item/unit price or total price if one_count true.
      count: Number   //number of days or item count or the default count value in the case of the ExpenseType collection.
    });

    // ** Virtual readonly properties
    // Returns the total cost of the item, which is simply price * count.
    expenseItem.virtual('item_total').get(function(){
      var price = this.price !== undefined ?  this.price : 0,
          count = this.count !== undefined ? this.count : 0;

      return convert.roundp((price * count), 2);
    });

    // Returns the total cost of the item used for tax calculations. This may differ that the item_total.
    // It will use the value of the taxable_price field if defined in the total cost calculation. This is needed
    // for items such as a room which includes breakfast to break out the cost of the breakfast which may be
    // calculated at a different rate.
    expenseItem.virtual('item_tax_total').get(function(){
      var price = this.price !== undefined ? (this.taxable_price ? this.taxable_price : this.price) : 0,
          count = this.count !== undefined ? this.count : 0;

      return convert.roundp((price * count), 2);
    });

    // Returns the portion of the (taxable) total price that is the amount of the tax. (All prices include tax).
    expenseItem.virtual('item_tax').get(function(){
      var tax_rate = this.low_tax_rate ? configService.constants.roomTax : configService.constants.salesTax,
          taxconv;

      tax_rate = tax_rate > 1.0 ? tax_rate / 100.0 : tax_rate;
      taxconv = 1.0 - 1.0/(1 + tax_rate);
      return convert.roundp((this.item_tax_total * taxconv),2);

    });

    // Returns the net amount of the item, total (taxable) price - tax
    expenseItem.virtual('item_tax_net').get(function(){
      return this.item_tax_total - this.item_tax;
    });

    // pre save method to update the last_update field and the date_added field if it is not populated
    expenseItem.pre('save', function (next) {
      this.last_update = new Date();
      if (!this.date_added) {
        this.date_added = this.last_updated;
      }
      next();
    });


    // ** Instance method, copies the ExpenseItem embedded document
    //    to a new ExpenseItem DocumentArray in some other model.
    //    the _id property is not copied, rather the origin id value
    //    is placed in the 'code' field of the new document.
    //    if the price and or count parameters are provided then they will
    //    override the values in the original item.
    expenseItem.method('addThisToDocArray', function(docArray, price, count) {
      if (docArray) {
        var newDoc = {};
        var plist = [];
        var idval = 0;

        this.schema.eachPath(function (p) {
          plist.push(p);
        });
        plist.forEach(function (p){
          if (p !== '_id') { //don't copy id
            newDoc[p] = this[p];
            if (price && p === 'price') {
              newDoc[p] = price;
            }
            if (count && p === 'count'){
              newDoc[p] = count;
            }
          }
          else {
            idval = this[p].id;
          }
        },this);
        newDoc['code'] = idval;
        docArray.push(newDoc);
      }
    });
    // Builds a default properties object for the ExpenseItem schema that can be used by the UI
    // to populate a new ExpenseType item that represents simple expense types. If the category is not
    // one of the allowed categories then a null is returned.
    expenseItem.statics.simpleExpenseItemDefaults = function (category) {
      var configObj = null,
          catCodeMap = { // Names from itemTypesEnum, not all Names allowed
            'Speisen': 'bcFood',
            'Getränke': 'bcDrink',
            'Dienste': 'bcDienste',
            'VDAK': 'bcKur',
            'AOK & Andere': 'bcKur',
            'Privat': 'bcKur'
          };
         if (catCodeMap.hasOwnProperty(category)) {
           configObj = {
             category: category,
             bill_code: configService.constants.get(catCodeMap[category]),
             display_string: '%count% %name% à %price%',
             display_order: 1,
             edit_count: true
           };
         }

      return configObj;
    };

    // Builds a default properties object for the ExpenseItem schema that can be used by the UI
    // to populate a new ExpenseType item that represents package plan expense types.
   expenseItem.statics.planExpenseItemDefaults = function (planBillCode) {
      return {
        category: dbEnums.itemTypePlan(),
        bill_code: planBillCode,
        per_room: false,
        //per_person: true,
        no_delete: true,
        no_display: true,
        //day_count: false,
        one_per: false,
        per_person: true,
        edit_name: false,
        bus_pauschale: false,
        display_string: '%count% %name% à %price%',
        display_order: 2
      };
    };

    return expenseItem;  //return schema not the mongoose model
  });

  // Define a child schema for a reserved room. Used in Reservation schema
  model.factory('ReservedRoom', function (dbConfig){
    console.log('Creating ReservedRoom model');
    var schema = new dbConfig.db.Schema({
      number: Number, // the room number
      room_type: String, //the room type from the room table
      room_class: String, //the room class from the room table
      guest: String,  // the name of the primary guest associated with the room
      guest2: String, // name of secondary guest associated with a double room, used for room plans that require
                      // separate bills for each person in a room
      guest_count: Number, // the number of guests in the room. Needed of group plans that don't require a separate
                           // bill for each guest but have required expense items for each person.
      default_price: Number, // The default room price before user adjustments or firm prices. Used by logic to add
                             // extra days to a package plan. This is populated from the original room price field.
      price: Number,  // the room price
      isCheckedIn: Boolean, // true when the guest or guests in this room have checked in.
      isCheckedOut: Boolean, // true when the guest or guests in this room have checked out.
      billNumber: Number, // unique bill number for room.
      update_date: Date  // This is needed to take care of a Tingus bug that will not properly save a document
                         // collection if an existing member is not changed.
    });
    schema.virtual('display_type').get(function() {
      return this.room_class + (this.room_class === '' ? "" : "-") + this.room_type;
    });
    schema.virtual('max_occupants').get(function() {
      return this.room_type === roomTypeEnum[0] ? 1 : 2;
    });
    return schema;
  });

  // define a child schema for a reserved resource such as a parking spot. Used in Reservation schema
  model.factory('ReservedResource', function (dbConfig){
    console.log('Creating ReservedResource model');
    return new dbConfig.db.Schema({
      name: String, // the resource name (unique)
      resource_type: String, //the resource type from the resource table
      display_name: String,
      price: String,  // the resource price
      room_number: Number,
      guest: String
    });
  });

  // define a subdocument schema for the taxes associated with a reservation
  model.factory('TaxItem', function (dbConfig){
    console.log('Creating TaxItem model');
    return new dbConfig.db.Schema({
      room_number: Number,
      guest: String,
      net7: Number,
      tax7: Number,
      sum7: Number,
      net19: Number,
      tax19: Number,
      sum19: Number,
      kurtax_total: Number,
      bill_total: Number
    });
  });

  // defines a subdocument for bill numbering for each bill associated with a reservation
  model.factory('BillNumber', function (dbConfig) {
    console.log('Creating BillNumber model');
    return new dbConfig.db.Schema({
      room_number: Number,
      guest: String,
      billNo: Number
    });
  });

  // Guest Schema
  model.factory('Guest', function (dbConfig, dbEnums, $filter) {
    console.log('Creating Guest model');
    var schema = new dbConfig.db.Schema({
        first_name: { type: String, default: '' },
        last_name: { type: String, required: true, index: true },
        partner_name: String, // name of spouse or significant other. First name or full name if different last name
        salutation: { type: String, enum: salutationEnum, default: ''},
        birthday: Date,
        birthday_partner: Date,
        email: { type: String}  ,
        firm: { type: String, default: '', index: true }, //unique name from Firm schema
        address1: String,
        address2: String,
        city: { type: String, default: '' },
        post_code: String,
        country: String,
        telephone: String,
        comments: String,
        last_stay: Date,
        unique_name: {type: String, unique: true, index: true} //NOTE this field should not be exposed as an editable field on a UI form. It is generated on save.
    });
    // Virtual fields
    schema.virtual('name').get(function() {
      let n = `${this.salutation} ${this.first_name} ${this.last_name}`
      return n.replace(/\s\s+/g, ' ').trim();
    });
    schema.virtual('full_address').get(function() {
      let addr = `${(this.address1 || "--")} ${(this.address2 || "")} ${(this.post_code || "--")} ${(this.city || "--")} ${(this.country || "")}`
      return addr.replace(/\s\s+/g, ' ').trim();
    });
    // if partner then generate the partner name
    schema.virtual('partner').get(function () {
      var name = '',
          psal, parts;

      if (!this.partner_name) {
         name = '*******';
      }
      else {
        psal = dbEnums.extractSalutation(this.partner_name);
        parts = this.partner_name.trim().split(' ');
        if (psal) {
          parts.shift();
        }
        if (parts.length > 1) {
          name = this.partner_name;
        }
        else {
          name = this.partner_name + " " + this.last_name;
        }
      }
      return name;
    });
    // if partner then generate a combined name such as Bill and Nancy Smith
    schema.virtual('billing_name').get(function () {
      var name = '',
          psal, parts;

       if (!this.partner_name) {
         name = this.name;
       }
      else {
         psal = dbEnums.extractSalutation(this.partner_name);
         parts = this.partner_name.trim().split(' ');
         if (psal) {
           parts.shift();
         }
         if (parts.length > 1) {
            name = this.name + ' und ' + this.partner_name;
         }
         else {
           name = (this.salutation ? this.salutation + ' ' + this.first_name : this.first_name) + " und "  + this.partner_name + " " + this.last_name;
         }
       }
      return name;
    });
    // Note there is no equivalent function for update. Unique name does not get updated
    // when say the firm name is changed and the guests firm fields are updated with an update command.
    schema.pre('save', function(next) {
      let up = this.firm ? `[${this.firm}]` : this.city ? `(${this.city})` : `(${this.last_name})`;
      let un = `${this.salutation} ${this.first_name ? this.first_name : ''} ${this.last_name} ${up}`
      this.unique_name = un.replace(/\s\s+/g, ' ').trim();
      next();
    });

    // Model method to convert the model's schema properties to an object with German Property names suitable for
    // displaying in the UI. This object uses the name field instead of first_name and last_name. If withFirm is true
    // then it contains the firm name but not the address fields since they are contained in the firm collection.
    schema.methods.toDisplayObj = function (withFirm, resCount) {
      if (withFirm) {
        return {
          'Name': this.name, 'Firma': this.firm, 'Telefon': this.telephone, 'Email': this.email, 
          'Letzter Aufenthalt': $filter('date')( this.last_stay, 'shortDate'), 'Nr. Res.': resCount, 'Bemerkung': this.comments
        };
      }
      else {
        return {
          'Name': this.name, 'Partner': this.partner_name, 'Addresse': this.full_address,
          'Telefon': this.telephone, 'Email': this.email,
          'Letzter Aufenthalt': $filter('date')( this.last_stay, 'shortDate'), 
          'Nr. Res.': resCount, 'Bemerkung': this.comments
        };
      }
    };
    schema.statics.toDisplayObjHeader = function (withFirm) {
      if (withFirm) {
        return ['Name','Firma','Telefon','Email','Letzter Aufenthalt','Nr. Res.','Bemerkung'];
      }
      else {
        return ['Name','Partner', 'Addresse','Telefon','Email','Letzter Aufenthalt','Nr. Res.','Bemerkung'];
      }
    };

    // Instantiating the guest model instance
    return dbConfig.db.model('guest', schema);
  });

  // ItemTypes Model - Based on the ItemList schema that define expense item types
  // This collection will be populated with the allowed expense item types.
  model.factory('Itemtype', function (dbConfig, ExpenseItem) {
    console.log('Creating ItemType model');
    return dbConfig.db.model('itemtype', ExpenseItem);
  }) ;

  model.factory('RoomPlan', function (dbConfig, dbEnums, ExpenseItem) {
    console.log('Creating RoomPlan model');
    var schema = new dbConfig.db.Schema({
      name: {type: String, required: true, unique: true },
      resTypeFilter: [String], //A string array of allowed reservation types for this plan.
      is_default: Boolean, // True if plan is the default plan pre selected from the list of plans within same type
      is_plan: Boolean,  //True if this is a package plan. This is only plan type that can be edited, created or deleted.
      is_group: Boolean, // True if this is a group plan with multiple rooms allowed.
      one_bill: Boolean, // True if a group plan reservation requires one bill for all guests (e.g. Tour group).
      one_room: Boolean, // True if the plan limits the reservation to only one room.
      single_only: Boolean, // True if room plan only applies to single rooms
      double_only: Boolean, // True if room plan only applies to double rooms and suites.
      needs_firm: Boolean, //True if plan requires a firm name as part of the reservation.
      second_guest: Boolean, //True if plan requires a separate bill for a second guest in a double room
      needs_insurance: Boolean, //True if plan requires an insurance provider as part of the reservation.
      includes_breakfast: Boolean, //Applies to no-business res. True if the plan includes breakfast in the room or package price
      bus_breakfast: Boolean, // Applies to business res. If true then check firm if breakfast is included in price. If so then adjust room price and add breakfast
      requires_kurtax: Boolean, // True if plan requires the collection of Kurtax for each person.
      pp_price: Number, // Per person price based on Double Room used by package plans
      single_surcharge: Number, // Extra amount paid by single person, used by package plans
      single_room_price: Number, // For a package, the per person room price for a single room
      double_room_price: Number, // For a package, the per person room price for a double room
      duration: Number, //Number of days the plan covers
      display_string: String, //Formatted string that is displayed on the bill for the plan. (special formatting)
      required_items: [ExpenseItem], // A list of required expense items that are associated with a room plan.
      display_order: {type: Number, default: 1}, //Used to display values in a particular order
      deleted: {type: Boolean, default: false} //If true then plan will not be displayed in lists. Plans that are used in res. are not deleted permanently
    });

    // Builds a default properties object for the ExpenseItem schema that can be used by the UI
    // to populate a new ExpenseType item that represents package plan expense types.
    schema.statics.packagePlanDefaults = function (reservationType) {
      var rtype = reservationType ? reservationType : dbEnums.stdResType;
      return {
        resTypeFilter: [rtype],
        is_default: false,
        is_plan: true,
        is_group: false,
        one_bill: true,
        one_room: true,
        single_only: false,
        double_only: false,
        second_guest: false,
        needs_firm: false,
        requires_kurtax: true,
        needs_insurance:  reservationType === dbEnums.kurResType,
        includes_breakfast: true,
        display_string: '%duration% Tag|Tage %name% %perPerson%',
      };
    };

    return dbConfig.db.model('roomplan', schema);
  });

  // Reservation schema
  model.factory('Reservation', function (dbConfig, ExpenseItem, TaxItem, BillNumber, ReservedRoom, ReservedResource, datetime){
    console.log('Creating Reservation model');
    var schema = new dbConfig.db.Schema({
      reservation_number: {type: Number, required: true, unique: true, index: true},   //generated by app contains the year as part of the number e.g.1400001
      type: {type: String, enum: resTypeEnum},  // determines if business, standard, group etc.
      guest: {name: {type: String}, id: {type: dbConfig.db.Schema.Types.ObjectId, index: true}}, //primary guest or contact from Address collection list
      guest2: {name: {type: String}, id: {type: dbConfig.db.Schema.Types.ObjectId, index: true}}, //optional second guest in a double room from Address
                                                            // collection list, used for non-group plans that require separate bills
                                                            // for each guest in a double room. For Kur reservation, This
                                                            // will contain the partner name field for the main guest
      firm: { type: String, index: true},
      start_date: { type: Date, required: true},
      end_date: { type: Date, required: true},
      checked_in: Date, // set when all rooms in this reservation have been checked in.
      checked_out: Date, // set when all rooms in this reservation have been checked out.
      occupants: Number,
      rooms: [ReservedRoom],
      resources: [ReservedResource],  //such as parking spots
      status: {type: String, enum: resStatusEnum},
      plan: String,  //Name of selected plan
      plan_code: dbConfig.db.Schema.Types.ObjectId,   //id of selected plan
      insurance: {type: String, enum: resInsuranceEnum} ,
      insurance2: {type: String, enum: resInsuranceEnum} ,
      prescription_charges: Boolean, // set based on insurance plan. Some plans require copay - only Private does not.
      prescription_charges2: Boolean, // set based on insurance plan. Some plans require copay - only Private does not.
      copay: Boolean, // set in reservation- per person???
      copay2: Boolean, // set in reservation- per person???
      source: {type: String, enum: resSourceEnum},
      comments: String,
      billing_name: String, // name displayed on bill before address.
      custom_name: Boolean, // set to true if the billing_name is entered manually and not generated
      address1: String,  //address fields to be printed on the bill, come from guest or firm collections
      address2: String,
      city: String,
      post_code: String,
      country: String,
      individualBill: Boolean, // true if is a multi-room reservation but requires an individual bill for each room
      expenses: [ExpenseItem],
      last_update: Date,
      taxes: [TaxItem],   //keeps the final tax results and bill total for all bills associated with a reservation
      bill_numbers: [BillNumber] // keeps the bill numbers generated for all bills associated with a reservation
    });

    // pre save method to update the last_update field
    schema.pre('save', function (next) {
      this.last_update = new Date();
      next();
    });
    // virtual field to return the reservation title.
    schema.virtual('title').get(function(){
      if (this.firm) {
        return this.firm + ' (' + this.guest.name + ')';
      }
      else {
        return this.guest.name
            + (this.guest2 && this.guest2.name ? ' / ' + this.guest2.name : '');
      }
    });
    // virtual field to return the number of nights stayed
    schema.virtual('nights').get(function() {
       return datetime.getNightsStayed(this.start_date, this.end_date);
    });
    // virtual field is true if the current date >= start_date and res. has not yet been checked in.
    schema.virtual('canCheckIn').get(function() {
      return (!this.checked_in && (datetime.dateOnly(this.start_date).getTime() <= datetime.dateOnly(new Date()).getTime()));
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

    return dbConfig.db.model('reservation', schema);
  });

  // Schema for a business firm
  model.factory('Firm', function (dbConfig) {
    console.log('Creating Firm model');
    var schema = new dbConfig.db.Schema({
      firm_name: {type: String, required: true, unique: true},
      address1: String,
      address2: String,
      post_code: String,
      city: String,
      country: String,
      room_price: Number,
      includes_breakfast: Boolean,
      contact_name: String,
      contact_phone: String,
      contact_email: String,
      comments: String
    });

    schema.virtual('full_address').get(function() {
      let addr = `${(this.address1 || "--")} ${(this.address2 || "")} ${(this.post_code || "--")} ${(this.city || "--")} ${(this.country || "")}`
      return addr.trim().replace("  ", " ");
    });

    /**
     * Model method to convert the model's schema properties to an object with German Property 
     * names suitable for displaying in the UI.
     */
    schema.methods.toDisplayObj = function (guestCount, resCount) {
        return {
          'Firma': this.firm_name, 'Zimmer Preis': this.room_price, 'Addresse': this.full_address,
          'Kontakt Name': this.contact_name, 'Nr. Gäste': guestCount, 'Nr. Res.': resCount, 'Kontakt E-Mail': this.contact_email,
          'Bemerkung': this.comments
        };
    };

    schema.statics.toDisplayObjHeader = function () {
      return ['Firma', 'Zimmer Preis', 'Addresse', 'Kontakt Name',
              'Nr. Gäste','Nr. Res.','Kontakt E-Mail','Bemerkung'];
    };

    return dbConfig.db.model('firm', schema);
  });

  //Schema for room resource
  model.factory('Room', function (dbConfig) {
    console.log('Creating Room model');
    var schema = new dbConfig.db.Schema({
      number: {type: Number, required: true, unique: true},
      room_type: {type: String, enum: roomTypeEnum, required: true},
      room_class: {type: String, enum: roomClassEnum, required: true},
      display_order: Number, //to allow sorting by room_type
      price: { type: Number, required: true}
    });

    // virtual method that generates a display name which concatenates the type with the class. Used for UI
    // display objects. If the room number is 0 then it generates a display_name of <Zimmer auswählen>
    schema.virtual('display_name').get(function() {
      if (this.number) {
        //return this.number + " (" + this.room_class + (this.room_class === '' ? "" : "-") + this.room_type + ")";
        return this.number + " (" + this.display_abbr + ")";
      }
      else {
        return "<Zimmer auswählen>";
      }
    });

    // virtual method that returns the maximum number of occupants for the room. Currently doubles and suites can
    // only have 2 occupants, singles 1.
    schema.virtual('max_occupants').get(function() {
      return this.room_type === roomTypeEnum[0] ? 1 : 2;
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

    // pre save method to set the display order. Business logic dictates that
    // singles appear before doubles before suites
    schema.pre('save', function (next) {
      this.display_order = roomTypeEnum.indexOf(this.room_type) + 1;
      next();
    });
    return dbConfig.db.model('room', schema);
  });

  //Schema for other reservable resources (parking, conference room etc)
  model.factory('Resource', function (dbConfig) {
    console.log('Creating Resource model');
    var schema = new dbConfig.db.Schema({
      name: {type: String, required: true, unique: true},
      resource_type: {type: String, enum: resourceTypeEnum, required: true},
      display_order: Number, // to allow specific sorting (e.g. by type)
      display_name: {type: String, required: true}, // Abreviated name that displays on the Zimmer plan.
      price: {type: Number, default: 0}
    });

    return dbConfig.db.model('resource', schema);
  });

  //Schema for Events Calendar
  model.factory('Event', function (dbConfig, datetime) {
    console.log('Creating Event model');
    var schema = new dbConfig.db.Schema({
      title: {type: String, required: true},
      start_date: {type: Date, required: true},
      end_date:  {type: Date, required: true},
      comments: String
    });

    // virtual field to return the number of days duration of the event
    schema.virtual('duration').get(function() {
      return datetime.getNightsStayed(this.start_date, this.end_date) + 1;
    });

    return dbConfig.db.model('event', schema);
  });

  //Schema for counters (unique numbers such as bill number
  model.factory('Counters', function (dbConfig, datetime) {
    console.log('Creating Counters model');
    var schema = new dbConfig.db.Schema({
      counter: {type: String, required: true, unique: true},
      seq: Number
    });

    return dbConfig.db.model('counters', schema);
  });

}); //module end