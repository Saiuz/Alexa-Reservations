define(['./module'], function (services) {
  'use strict';
  /**
   * Database configuration service. Provides a connection to the MongoDB
   * and methods for disconnecting and reconnecting.
   */
  services.service('dbConfig', ['appConstants',(appConstants) => {
    console.log("Connecting to DB...");
    const conOpts = {
      useMongoClient: true,
      reconnectTries: Number.MAX_VALUE,
      reconnectInterval:1000
    };
    //Establish the initial connection
    mongoose.Promise = global.Promise;
    mongoose.connect(appConstants.dbConnStr, conOpts, (err) => {
      if (err) {
        console.log("DB connection error");
        throw err;
      }
    }); 
    return { //return Mongoose object and utility functions
      db: mongoose,
      disconnectDB: () => {
        console.log("Disconnecting from database");
        return mongoose.disconnect();
      },
      reconnectDB: () => {
        console.log("Reconnecting to database")
        return mongoose.connect(appConstants.dbConnStr, conOpts);
      }     
    }
  }]);

  /**
   * Database Initialization service. Will pre-populate required records
   * in key collections if the collections are empty. These records are 
   * required for the app to function properly
   */
  services.service('dbInit', [
    'AppConstants',
    'Room',
    'Resource',
    'RoomPlan',
    'Itemtype',
    (AppConstants, Room, Resource, RoomPlan, Itemtype) => {
      return {
        InitModels: async () => {
          try {
          return await _InitIfEmpty(AppConstants, Room, Resource, RoomPlan, Itemtype);
          } catch (err) {
            throw err;
          }
        }
      }
    }]);

  async function _InitIfEmpty(AppConstants, Room, Resource, RoomPlan, ItemType) {
    try {
      console.log("Initializing base collections in DB...");
      if (await AppConstants.count() === 0) await _loadAppConstants();
      if (await Room.count() === 0) await _loadRooms();
      if (await Resource.count() === 0) await _loadResources();
      if (await RoomPlan.count() === 0) await _loadPlans();
      if (await ItemType.count() === 0) await _loadItemTypes();
    } catch (err) {
      throw err;
    }
  }

  /**
   * Load editable App Constants with initial values
   */
  async function _loadAppConstants() {
    try {
      console.log("CREATING AppConstants...");
      return await AppConstants.create({
        name: 'cityTax',
        display_name: 'Kurtaxe Preis',
        nvalue: 2.70,
        units: '€'
      }, {
        name: 'parking',
        display_name: 'Parkplatz Preis',
        nvalue: 3.00,
        units: '€'
      }, {
        name: 'breakfast',
        display_name: 'Frühstück Preis',
        nvalue: 4.80,
        units: '€'
      }, {
        name: 'telephone',
        display_name: 'Tel Einheiten Preis',
        nvalue: 0.20,
        units: '€'
      }, {
        name: 'salesTax',
        display_name: 'Mehrwertsteuer',
        nvalue: 19.0,
        units: '%'
      }, {
        name: 'roomTax',
        display_name: 'Zimmer Ust',
        nvalue: 7.0,
        units: '%'
      }, {
        name: 'prescriptionCharges',
        display_name: 'Rezept Gebühr',
        nvalue: 10,
        units: '€'
      }, {
        name: 'ownContribution',
        display_name: 'Eigenanteil Prozent',
        nvalue: 10.0,
        units: '%'
      }, {
        name: 'cityTaxDiscount',
        display_name: 'Kurtax Ermäßigung',
        nvalue: 50,
        units: '%'
      }, {
        name: 'halfpension',
        display_name: 'Halbpension',
        nvalue: 19,
        units: '€'
      }, {
        name: 'fullpension',
        display_name: 'Vollpension',
        nvalue: 29,
        units: '€'
      });
    } catch (err) {
      throw err;
    }
  }

  async function _loadRooms() {
    try {
      console.log("CREATING Rooms...");
      return await Room.create({
        number: 2,
        room_type: 'Einzelzimmer',
        room_class: 'Standart',
        price: 69
      }, {
        number: 3,
        room_type: 'Einzelzimmer',
        room_class: 'Komfort',
        price: 73
      });
    } catch (err) {
      throw err;
    }
  }

  async function _loadResources() {
    try {
      console.log("CREATING Resources...");
      return await Resource.create({
        name: 'Res. Platz',
        resource_type: 'Parkplatz',
        display_order: 1,
        display_name: 'Res. Pl.',
        price: 3
      }, {
        name: 'Parkplatz 2',
        resource_type: 'Parkplatz',
        display_order: 2,
        display_name: 'Pl. 2',
        price: 3
      }, {
        name: 'Parkplatz 3',
        resource_type: 'Parkplatz',
        display_order: 3,
        display_name: 'Pl. 3',
        price: 3
      }, {
        name: 'Parkplatz 4',
        resource_type: 'Parkplatz',
        display_order: 4,
        display_name: 'Pl. 4',
        price: 3
      }, {
        name: 'Parkplatz 5',
        resource_type: 'Parkplatz',
        display_order: 5,
        display_name: 'Pl. 5',
        price: 3
      }, {
        name: 'Parkplatz 6',
        resource_type: 'Parkplatz',
        display_order: 6,
        display_name: 'Pl. 6',
        price: 3
      }, {
        name: 'Parkplatz 7',
        resource_type: 'Parkplatz',
        display_order: 7,
        display_name: 'Pl. 7',
        price: 3
      });
    } catch (err) {
      throw err;
    }
  }

  /**
   * Load the required system room plans
   */
  async function _loadRoomPlans() {
    try {
      console.log("CREATING RoomPlans...");
      return await RoomPlan.create({
        "name": "Unterkunft mit Frühstück im Einzelzimmer",
        "is_default": true,
        "is_plan": false,
        "is_group": false,
        "one_bill": true,
        "one_room": true,
        "single_only": true,
        "double_only": false,
        "second_guest": false,
        "needs_firm": false,
        "needs_insurance": false,
        "includes_breakfast": true,
        "requires_kurtax": true,
        "display_string": "%nights% Tag|Tage %name% à %roomprice%",
        "display_order": -2,
        "required_items": [],
        "resTypeFilter": [
          "Std."
        ],
        "old_id": "5a14d6ddff6d720ed2fc0aeb"
      },
      {
        "name": "Unterkunft mit Frühstück im Doppelzimmer",
        "is_plan": false,
        "is_group": false,
        "one_bill": true,
        "one_room": true,
        "single_only": false,
        "double_only": true,
        "second_guest": false,
        "needs_firm": false,
        "needs_insurance": false,
        "includes_breakfast": true,
        "requires_kurtax": true,
        "display_string": "%nights% Tag|Tage %name% à %roomprice%",
        "display_order": -1,
        "required_items": [],
        "resTypeFilter": [
          "Std."
        ],
        "old_id": "5a14d6ddff6d720ed2fc0aed"
      },
      {
        "name": "Übernachtung im Einzelzimmer",
        "is_default": true,
        "is_plan": false,
        "is_group": false,
        "one_bill": false,
        "one_room": true,
        "single_only": true,
        "double_only": false,
        "second_guest": false,
        "needs_firm": true,
        "needs_insurance": false,
        "bus_breakfast": true,
        "requires_kurtax": false,
        "display_string": "%nights% Tag|Tage %name% à %roomprice%",
        "display_order": -2,
        "required_items": [],
        "resTypeFilter": [
          "Bus."
        ],
        "old_id": "5a14d6ddff6d720ed2fc0aef"
      },
      {
        "name": "Übernachtung im Dopplezimmer",
        "is_plan": false,
        "is_group": false,
        "one_bill": false,
        "one_room": true,
        "single_only": false,
        "double_only": true,
        "second_guest": true,
        "needs_firm": true,
        "needs_insurance": false,
        "bus_breakfast": true,
        "requires_kurtax": false,
        "display_string": "%nights% Tag|Tage %name% à %roomprice%",
        "display_order": 1,
        "required_items": [],
        "resTypeFilter": [
          "Bus."
        ],
        "old_id": "5a14d6ddff6d720ed2fc0af1"
      },
      {
        "name": "Unterkunft mit Frühstück im Einzelzimmer ",
        "is_default": true,
        "is_plan": false,
        "is_group": false,
        "one_bill": false,
        "one_room": true,
        "single_only": true,
        "double_only": false,
        "second_guest": false,
        "needs_firm": false,
        "needs_insurance": true,
        "includes_breakfast": true,
        "requires_kurtax": true,
        "display_string": "%nights% Tag|Tage %name% à %roomprice%",
        "display_order": -2,
        "required_items": [],
        "resTypeFilter": [
          "Kur"
        ],
        "old_id": "5a14d6ddff6d720ed2fc0af4"
      },
      {
        "name": "Private Gruppe",
        "is_plan": false,
        "is_group": true,
        "one_bill": true,
        "one_room": false,
        "single_only": false,
        "double_only": false,
        "second_guest": false,
        "needs_firm": false,
        "needs_insurance": false,
        "includes_breakfast": true,
        "requires_kurtax": true,
        "display_string": "%nights% Tag|Tage Unterkunft mit Frühstück  (%occupants% Person|Personen - %roomCnt% Zimmer)",
        "display_order": 1,
        "required_items": [],
        "resTypeFilter": [
          "Gruppe"
        ],
        "old_id": "5a14d6ddff6d720ed2fc0af5"
      },
      {
        "name": "Unterkunft mit Frühstück im Doppelzimmer ",
        "is_plan": false,
        "is_group": false,
        "one_bill": false,
        "one_room": true,
        "single_only": false,
        "double_only": true,
        "second_guest": true,
        "needs_firm": false,
        "needs_insurance": true,
        "includes_breakfast": true,
        "requires_kurtax": true,
        "display_string": "%nights% Tag|Tage %name% à %roomprice%",
        "display_order": -1,
        "required_items": [],
        "resTypeFilter": [
          "Kur"
        ],
        "old_id": "5a14d6ddff6d720ed2fc0afd"
      },
      {
        "name": "Geschäftsgruppe",
        "is_default": true,
        "is_plan": false,
        "is_group": true,
        "one_bill": true,
        "one_room": false,
        "single_only": false,
        "double_only": false,
        "second_guest": true,
        "needs_firm": true,
        "needs_insurance": false,
        "bus_breakfast": true,
        "requires_kurtax": false,
        "display_string": "%nights% Tag|Tage Übernachtung  (%occupants% Person|Personen - %roomCnt% Zimmer)",
        "display_order": 1,
        "required_items": [],
        "resTypeFilter": [
          "Gruppe"
        ],
        "old_id": "5a14d6ddff6d720ed2fc0b00"
      },
      {
        "name": "Reisegruppe",
        "is_plan": false,
        "is_group": true,
        "one_bill": true,
        "one_room": false,
        "single_only": false,
        "double_only": false,
        "second_guest": false,
        "needs_firm": true,
        "needs_insurance": false,
        "includes_breakfast": true,
        "requires_kurtax": true,
        "display_string": "%nights% Tag|Tage Unterkunft mit Frühstück  (%occupants% Person|Personen - %roomCnt% Zimmer)",
        "display_order": 1,
        "required_items": [],
        "resTypeFilter": [
          "Gruppe"
        ],
        "old_id": "5a14d6ddff6d720ed2fc0b07"
      });
    } catch (err) {
      throw err;
    }
  }

  async function _loadItemTypes() {
    try {
      console.log("CREATING ItemTypes...");
      return await Itemtype.create(  {
        "category": "Plan",
        "name": "HalbpensionInc",
        "bill_code": 1,
        "guest": "",
        "room": 0,
        "is_system": true,
        "per_room": false,
        "per_person": true,
        "no_delete": true,
        "no_display": true,
        "day_count": true,
        "one_per": true,
        "edit_name": false,
        "bus_pauschale": false,
        "display_string": "%count% %name% à %price%",
        "display_order": 2,
        "price_lookup": "halfpension",
        "price": 0,
        "count": 1,
        "old_id": "5a14d6daff6d720ed2fbeffd"
      },
      {
        "category": "Plan",
        "name": "VollpensionInc",
        "bill_code": 1,
        "guest": "",
        "room": 0,
        "is_system": true,
        "per_room": false,
        "per_person": true,
        "no_delete": true,
        "no_display": true,
        "day_count": true,
        "one_per": true,
        "edit_name": false,
        "bus_pauschale": false,
        "display_string": "%count% %name% à %price%",
        "display_order": 2,
        "price_lookup": "fullpension",
        "price": 0,
        "count": 1,
        "old_id": "5a14d6daff6d720ed2fbeffe"
      },
      {
        "category": "Plan",
        "name": "Pauschale à 19%",
        "bill_code": 6,
        "guest": "",
        "room": 0,
        "is_system": true,
        "per_room": false,
        "per_person": false,
        "no_delete": false,
        "no_display": false,
        "day_count": false,
        "one_per": false,
        "edit_name": true,
        "low_tax_rate": false,
        "display_string": "%name%",
        "display_order": 6,
        "price": 0,
        "count": 1,
        "old_id": "5a14d6daff6d720ed2fbf000"
      },
      {
        "category": "Plan",
        "name": "Frühstück",
        "bill_code": 3,
        "guest": "",
        "room": 0,
        "is_system": true,
        "per_room": true,
        "per_person": true,
        "no_delete": false,
        "no_display": false,
        "day_count": true,
        "one_per": true,
        "edit_name": false,
        "edit_count": true,
        "bus_pauschale": true,
        "display_string": "%count% %name% à %price%",
        "display_order": 2,
        "price_lookup": "breakfast",
        "price": 0,
        "count": 1,
        "old_id": "5a14d6daff6d720ed2fbf01d"
      },
      {
        "category": "Plan",
        "name": "Halbpension",
        "bill_code": 3,
        "guest": "",
        "room": 0,
        "is_system": true,
        "per_room": false,
        "per_person": true,
        "no_delete": false,
        "no_display": false,
        "day_count": true,
        "one_per": true,
        "edit_name": false,
        "edit_count": true,
        "display_string": "%count% Tag|Tage %name% à %price%",
        "display_order": 4,
        "price_lookup": "halfpension",
        "price": 0,
        "count": 1,
        "old_id": "5a14d6daff6d720ed2fbf01e"
      },
      {
        "category": "Plan",
        "name": "Telephone",
        "bill_code": 6,
        "guest": "",
        "room": 0,
        "is_system": true,
        "per_room": true,
        "per_person": false,
        "no_delete": false,
        "no_display": false,
        "day_count": false,
        "one_per": false,
        "edit_count": true,
        "edit_name": false,
        "bus_pauschale": true,
        "display_string": "Telefon: %count% Einheiten à %price%",
        "display_order": 3,
        "price_lookup": "telephone",
        "price": 0,
        "count": 1,
        "old_id": "5a14d6daff6d720ed2fbf021"
      },
      {
        "category": "Plan",
        "name": "Pauschale à 7%",
        "bill_code": 6,
        "guest": "",
        "room": 0,
        "is_system": true,
        "per_room": false,
        "per_person": false,
        "no_delete": false,
        "no_display": false,
        "day_count": false,
        "one_per": false,
        "edit_name": true,
        "low_tax_rate": true,
        "display_string": "%name%",
        "display_order": 7,
        "price": 0,
        "count": 1,
        "old_id": "5a14d6daff6d720ed2fbf022"
      },
      {
        "category": "Plan",
        "name": "Vollpension",
        "bill_code": 3,
        "guest": "",
        "room": 0,
        "is_system": true,
        "per_room": false,
        "per_person": true,
        "no_delete": false,
        "no_display": false,
        "day_count": true,
        "one_per": true,
        "edit_name": false,
        "edit_count": true,
        "display_string": "%count% Tag|Tage %name% à %price%",
        "display_order": 5,
        "price_lookup": "fullpension",
        "price": 29,
        "count": 1,
        "old_id": "5a14d6daff6d720ed2fbf03b"
      });
    } catch (err) {
      throw err;
    }
  }
});//end module
