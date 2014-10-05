define(['./module'], function (controllers) {
  'use strict';

  controllers.controller('AppCtrl',
      ['$scope',
        'securityService',
        'db',
        'Firm',
        'Guest',
        'Reservation',
        'Resource',
        'Room',
        'Itemtype',
        'datetime',
        '$state',
        function ($scope, securityService, db, Firm, Guest, Reservation, Resource, Room, Itemtype, datetime, $state) {
          console.log("App controller fired");

          //build expense types collection
          Itemtype.count(function(err, count) {
            if (count === 0){
              Itemtype.create({
                item_name: 'Übernachtung im Einzelzimmer',
                item_category: 'Zimmer Plan',
                item_code: 1,
                display_string: '',
                display_order: 1,
                taxable_rate: 19,
                default_unit_price: 0,
                default_plan_price: 0,
                types_allowed: ['Std.', 'Bus.'],
                edit_name: false,
                required_types: [],
                excluded_types: ['Kur']
              },function(err, count){if (err)console.log(err)});
              Itemtype.create({
                item_name: 'Übernachtung im Doppelzimmer',
                item_category: 'Zimmer Plan',
                item_code: 1,
                display_string: '',
                display_order: 2,
                taxable_rate: 19,
                default_unit_price: 0,
                default_plan_price: 0,
                types_allowed: ['Std.', 'Bus.'],
                edit_name: false,
                required_types: [],
                excluded_types: ['Kur']
              },function(err, count){if (err)console.log(err)});
              Itemtype.create({
                item_name: 'Körner Kur',
                item_category: 'Zimmer Plan',
                item_code: 2,
                display_string: '',
                display_order: 3,
                taxable_rate: 19,
                default_unit_price: 0,
                default_plan_price: 300,
                types_allowed: ['Kur'],
                edit_name: false,
                required_types: [],
                excluded_types: []
              },function(err, count){if (err)console.log(err)});
              Itemtype.create({
                item_name: 'Urlaub in der Kurstadt',
                item_category: 'Zimmer Plan',
                item_code: 2,
                display_string: '',
                display_order: 5,
                taxable_rate: 19,
                default_unit_price: 0,
                default_plan_price: 450,
                types_allowed: ['Std.'],
                edit_name: false,
                required_types: [],
                excluded_types: []
              },function(err, count){if (err)console.log(err)});
              Itemtype.create({
                item_name: 'Kur-Klassiker',
                item_category: 'Zimmer Plan',
                item_code: 2,
                display_string: '',
                display_order: 6,
                taxable_rate: 19,
                default_unit_price: 0,
                default_plan_price: 200,
                types_allowed: ['Kur'],
                edit_name: false,
                required_types: [],
                excluded_types: []
              },function(err, count){if (err)console.log(err)});
              Itemtype.create({
                item_name: 'Vollverpflegung',
                item_category: 'Zimmer Plan',
                item_code: 2,
                display_string: '',
                display_order: 6,
                taxable_rate: 19,
                default_unit_price: 0,
                default_plan_price: 300,
                types_allowed: ['Kur'],
                edit_name: false,
                required_types: [],
                excluded_types: []
              },function(err, count){if (err)console.log(err)});
              Itemtype.create({
                item_name: 'Schnupperangebot',
                item_category: 'Zimmer Plan',
                item_code: 1,
                display_string: '',
                display_order: 7,
                taxable_rate: 19,
                types_allowed: ['Std.'],
                default_unit_price: 0,
                default_plan_price: 320,
                edit_name: false,
                required_types: [],
                excluded_types: []
              },function(err, count){if (err)console.log(err)});
              Itemtype.create({
                item_name: 'Halbpension',
                item_category: 'Zimmer Plan',
                item_code: 3,
                display_string: '',
                display_order: 4,
                taxable_rate: 19,
                types_allowed: ['Std.'],
                default_unit_price: 0,
                default_plan_price: 0,
                edit_name: false,
                required_types: [],
                excluded_types: []
              },function(err, count){if (err)console.log(err)});
              Itemtype.create({
                item_name: 'Frühstück',
                item_category: 'Allgemein',
                display_string: '',
                taxable_rate: 19,
                default_unit_price: 4.80,
                default_plan_price: 0,
                business_allowed: true,
                edit_name: false,
                required_types: [],
                excluded_types: []
              },function(err, count){if (err)console.log(err)});
              Itemtype.create({
                item_name: 'Kurtaxe',
                item_category: 'Allgemein',
                display_string: '',
                taxable_rate: 7,
                default_unit_price: 3,
                default_plan_price: 0,
                business_allowed: true,
                edit_name: false,
                required_types: [],
                excluded_types: []
              },function(err, count){if (err)console.log(err)});
              Itemtype.create({
                item_name: 'Parkplatz',
                item_category: 'Allgemein',
                display_string: '',
                taxable_rate: 7,
                default_unit_price: 3,
                default_plan_price: 0,
                business_allowed: true,
                edit_name: false,
                required_types: [],
                excluded_types: []
              },function(err, count){if (err)console.log(err)});
              Itemtype.create({
                item_name: 'Telephone',
                item_category: 'Allgemein',
                display_string: '',
                taxable_rate: 7,
                default_unit_price: 3,
                default_plan_price: 0,
                business_allowed: true,
                edit_name: false,
                required_types: [],
                excluded_types: []
              },function(err, count){if (err)console.log(err)});
              Itemtype.create({
                item_name: 'Pauschale',
                item_category: 'Allgemein',
                display_string: '',
                taxable_rate: 7,
                default_unit_price: 0,
                default_plan_price: 0,
                business_allowed: true,
                edit_name: true,
                required_types: [],
                excluded_types: []
              },function(err, count){if (err)console.log(err)});

              Itemtype.create({
                item_name: 'Classic Mineralwasser 0,2l',
                item_category: 'Getränke',
                display_string: '',
                taxable_rate: 19,
                default_unit_price: 1.5,
                default_plan_price: 0,
                business_allowed: true,
                edit_name: false,
                required_types: [],
                excluded_types: []
              },function(err, count){if (err)console.log(err)});
              Itemtype.create({
                item_name: 'Distelhäuser Landbier dunkel 0,5l',
                item_category: 'Getränke',
                display_string: '',
                taxable_rate: 19,
                default_unit_price: 2.1,
                default_plan_price: 0,
                business_allowed: true,
                multiple_allowed: true,
                edit_name: false,
                required_types: [],
                excluded_types: []
              },function(err, count){if (err)console.log(err)});
              Itemtype.create({
                item_name: 'Kuchen',
                item_category: 'Speisen',
                display_string: '',
                taxable_rate: 19,
                default_unit_price: 2,
                default_plan_price: 0,
                business_allowed: true,
                edit_name: false,
                required_types: [],
                excluded_types: []
              },function(err, count){if (err)console.log(err)});
              Itemtype.create({
                item_name: 'Erdnüsse',
                item_category: 'Speisen',
                display_string: '',
                taxable_rate: 19,
                default_unit_price: 1,
                default_plan_price: 0,
                business_allowed: true,
                edit_name: false,
                required_types: [],
                excluded_types: []
              },function(err, count){if (err)console.log(err)});
              Itemtype.create({
                item_name: 'Halbpension',
                item_category: 'Speisen',
                display_string: '',
                taxable_rate: 19,
                default_unit_price: 15.5,
                default_plan_price: 0,
                business_allowed: true,
                edit_name: false,
                required_types: [],
                excluded_types: []
              },function(err, count){if (err)console.log(err)});
              Itemtype.create({
                item_name: 'Vollpension',
                item_category: 'Speisen',
                display_string: '',
                taxable_rate: 19,
                default_unit_price: 26.5,
                default_plan_price: 0,
                business_allowed: true,
                edit_name: false,
                required_types: [],
                excluded_types: []
              },function(err, count){if (err)console.log(err)});
              Itemtype.create({
                item_name: 'X1501 Fangopackungen',
                item_category: 'VDAK',
                display_string: '',
                taxable_rate: 19,
                default_unit_price: 8.19,
                default_plan_price: 0,
                business_allowed: false,
                edit_name: false,
                required_types: [],
                excluded_types: []
              },function(err, count){if (err)console.log(err)});
              Itemtype.create({
                item_name: 'X1712 Gashaltiges Bad mit Zusatz',
                item_category: 'VDAK',
                display_string: '',
                taxable_rate: 19,
                default_unit_price: 8.19,
                default_plan_price: 0,
                business_allowed: false,
                edit_name: false,
                required_types: [],
                excluded_types: []
              },function(err, count){if (err)console.log(err)});
              Itemtype.create({
                item_name: 'X0106 Klassische Massage',
                item_category: 'VDAK',
                display_string: '',
                taxable_rate: 19,
                default_unit_price: 14.06,
                default_plan_price: 0,
                business_allowed: false,
                edit_name: false,
                required_types: [],
                excluded_types: []
              },function(err, count){if (err)console.log(err)});
/*
              Itemtype.create({
                item_name: '',
                item_category: '',
                display_string: '',
                taxable_rate: 19,
                default_unit_price: 0,
                default_plan_price: 0,
                business_allowed: true,
                edit_name: false,
                required_types: [],
                excluded_types: []
              },function(err, count){if (err)console.log(err)});
*/

            }
            else {
              console.log("Itemtype collection contains %d records", count);
            }
          });

          Guest.count(function (err, count) {
            if (count === 0) {
              console.log("Creating guest collection");
              Guest.create({
                first_name: 'Johnny',
                last_name: 'Guest',
                salutation: 'Familie',
                first_name2: 'Sally',
                last_name2: 'Guest',
                birthday: new Date(1965, 1, 23),
                birthday2: new Date(1964, 9, 23),
                email: 'guest@nomail.org',
                //firm: '',
                address1: '123 Nowhere Ave',
                address2: 'Apt 234',
                city: 'Anywhere',
                post_code: 321456,
                telephone: '123456789',
                comments: 'Hi there'
              }, function (err, count) {
                if (err)
                  console.log(err);
              });
              Guest.create({
                first_name: 'Susie',
                last_name: 'Longstay',
                salutation: 'Dr.',
                //first_name2: 'Sally',
                //last_name2: 'Shortstay',
                birthday: new Date(1963, 1, 23),
                //birthday2: new Date(1965, 9, 23),
                email: 'longstay@nomail.org',
                firm: 'The Grand Central',
                //address1: '',
                //address2: '',
                //city: '',
                //post_code: ,
                //telephone: '',
                comments: 'Testing'
              }, function (err, count) { if (err) console.log(err); });
              Guest.create({
                first_name: 'Monika',
                last_name: 'Adams',
                salutation: 'Frau',
                //first_name2: 'Sally',
                //last_name2: 'Shortstay',
                birthday: new Date(1945, 9, 6),
                //birthday2: new Date(1965, 9, 23),
                //email: 'longstay@nomail.org',
                //firm: 'The Grand Central',
                address1: 'Siegburger Straße 105',
                address2: '',
                city: 'Köln',
                post_code: 50679,
                telephone: '',
                comments: 'Testing'
              }, function (err, count){  if (err) console.log(err); });
            }
            else
              console.log("Guest collection contains %d records", count);
          });

          Resource.count(function (err, count) {
            if (count === 0) {
              console.log("Creating Resource collection");
              Resource.create({
                name: 'Konf. 28',
                resource_type: 'Konferenzraum',
                display_order: 1,
                multiple_allowed: false,
                price: 0
              },function(err, count){if (err)console.log(err)});
              Resource.create({
                name: 'Parkplatz 1',
                resource_type: 'Parkplatz',
                display_order: 1,
                multiple_allowed: false,
                price: 3
              },function(err, count){if (err)console.log(err)});
              Resource.create({
                name: 'Parkplatz 2',
                resource_type: 'Parkplatz',
                display_order: 2,
                multiple_allowed: false,
                price: 3
              },function(err, count){if (err)console.log(err)});
              Resource.create({
                name: 'Parkplatz 3',
                resource_type: 'Parkplatz',
                display_order: 3,
                multiple_allowed: false,
                price: 3
              },function(err, count){if (err)console.log(err)});
              Resource.create({
                name: 'Parkplatz 4',
                resource_type: 'Parkplatz',
                display_order: 4,
                multiple_allowed: false,
                price: 3
              },function(err, count){if (err)console.log(err)});
              Resource.create({
                name: 'Parkplatz 5',
                resource_type: 'Parkplatz',
                display_order: 5,
                multiple_allowed: false,
                price: 3
              },function(err, count){if (err)console.log(err)});
              Resource.create({
                name: 'Parkplatz 6',
                resource_type: 'Parkplatz',
                display_order: 6,
                multiple_allowed: false,
                price: 3
              },function(err, count){if (err)console.log(err)});
              Resource.create({
                name: 'Parkplatz 7',
                resource_type: 'Parkplatz',
                display_order: 7,
                multiple_allowed: false,
                price: 3
              },function(err, count){if (err)console.log(err)});
            }
            else {
              console.log("Resource collection contains %d records", count);
            }
          });

          Room.count(function (err, count) {
            if (count === 0) {
              console.log("Creating Room collection");
              Room.create({
                number: 2,
                room_type: 'Einzelzimmer',
                display_order: 1,
                price: {base_rate: 59, full_pension1: 75.5, full_pension2: 0, breakfast_plan: 51.5, half_pension: 65.5}
              },function(err, count){if (err)console.log(err)});
              Room.create({
                number: 3,
                room_type: 'Einzelzimmer',
                display_order: 1,
                price: {base_rate: 59, full_pension1: 75.5, full_pension2: 0, breakfast_plan: 51.5, half_pension: 65.5}
              },function(err, count){if (err)console.log(err)});
              Room.create({
                number: 4,
                room_type: 'Einzelzimmer',
                display_order: 1,
                price: {base_rate: 59, full_pension1: 75.5, full_pension2: 0, breakfast_plan: 51.5, half_pension: 65.5}
              },function(err, count){if (err)console.log(err)});
              Room.create({
                number: 5,
                room_type: 'Einzelzimmer',
                display_order: 1,
                price: {base_rate: 59, full_pension1: 75.5, full_pension2: 0, breakfast_plan: 51.5, half_pension: 65.5}
              },function(err, count){if (err)console.log(err)});
              Room.create({
                number: 6,
                room_type: 'Einzelzimmer',
                display_order: 1,
                price: {base_rate: 59, full_pension1: 75.5, full_pension2: 0, breakfast_plan: 51.5, half_pension: 65.5}
              },function(err, count){if (err)console.log(err)});
              Room.create({
                number: 7,
                room_type: 'Einzelzimmer',
                display_order: 1,
                price: {base_rate: 59, full_pension1: 75.5, full_pension2: 0, breakfast_plan: 51.5, half_pension: 65.5}
              },function(err, count){if (err)console.log(err)});
              Room.create({
                number: 9,
                room_type: 'Doppelzimmer',
                display_order: 2,
                price: {base_rate: 65, full_pension1: 75.5, full_pension2: 130, breakfast_plan: 51.5, half_pension: 65.5}
              },function(err, count){if (err)console.log(err)});
              Room.create({
                number: 10,
                room_type: 'Einzelzimmer',
                display_order: 1,
                price: {base_rate: 59, full_pension1: 75.5, full_pension2: 0, breakfast_plan: 51.5, half_pension: 65.5}
              },function(err, count){if (err)console.log(err)});
              Room.create({
                number: 12,
                room_type: 'Einzelzimmer',
                display_order: 1,
                price: {base_rate: 59, full_pension1: 75.5, full_pension2: 0, breakfast_plan: 51.5, half_pension: 65.5}
              },function(err, count){if (err)console.log(err)});
              Room.create({
                number: 15,
                room_type: 'Einzelzimmer',
                display_order: 1,
                price: {base_rate: 59, full_pension1: 75.5, full_pension2: 0, breakfast_plan: 51.5, half_pension: 65.5}
              },function(err, count){if (err)console.log(err)});
              Room.create({
                number: 18,
                room_type: 'Doppelzimmer',
                display_order: 2,
                price: {base_rate: 56, full_pension1: 63, full_pension2: 126, breakfast_plan: 39, half_pension: 65.5}
              },function(err, count){if (err)console.log(err)});
              Room.create({
                number: 23,
                room_type: 'Suite',
                display_order: 3,
                price: {base_rate: 86, full_pension1: 63, full_pension2: 126, breakfast_plan: 39, half_pension: 65.5}
              },function(err, count){if (err)console.log(err)});

            }
            else {
              console.log("Room collection contains %d records", count);
            }
          });

          Firm.count(function (err, count) {
            if (count === 0) {
              console.log("Creating Firm collection");
              Firm.create({
                firm_name: 'Landessaatzuchtanstalt',
                address1: 'Waldhof 2',
                address2: '',
                city: 'Eckartsweiler',
                post_code: 77737,
                room_price: 58
              }, function (err, count) {
                if (err) console.log(err);
              });
              Firm.create({
                firm_name: 'ELB-SCHLIFF Werkzeugmaschinen GmbH/aba Grinding Technologies GmbH',
                address1: 'Bollenwaldstraße 116',
                address2: '',
                city: 'Aschaffenburg',
                post_code: 63743,
                room_price: 57
              }, function (err, count) {
                if (err) console.log(err);
              });
              Firm.create({
                firm_name: 'The Grand Central',
                address1: 'Ovelgönne  4B',
                address2: 'Suite 1',
                city: 'Hamburg',
                post_code: 22665,
                room_price: 58,
                contact: {name: 'Andreas Hanitsch', phone: '0154283451', email: 'hanitscha@elbschliff.de'}
              }, function (err, count) {
                if (err) console.log(err);
              });
              Firm.create({
                firm_name: 'Federal-Mogul Systems Protection',
                address1: 'Bürgermeister-Schmidt-Straße 17',
                address2: '',
                city: 'Bruscheid',
                post_code: 51399,
                room_price: 55
              }, function (err, count) {
                if (err) console.log(err);
              });
            }
            else {
              console.log("Firm collection contains %d records", count);
            }
          });

          Reservation.count(function (err, count) {
            if (count === 0) {
              console.log("Creating Reservation collection");
              //Create some dummy reservations and
              // link them to Guests. We create the records in the callbacks
              // that retrieve the names and ids to associated with the res.
              // the .findOne method returns a promise.
              var guest1, guest2, guest3, id1, id2, id3;
              Guest.findOne({'last_name': 'Longstay'}, function (err, guest) {
                if (err || !guest.name) {
                  guest1 = 'unknown1';
                  id1 = -1;
                  console.log('Guest query failed. Err: ' + err);
                }
                else {
                  guest1 = guest.name;
                  id1 = guest._id;
                }
                Reservation.create({
                  reservation_number: 1400101,
                  type: 'Std.',
                  title: 'The Grand Central (LongStay)',
                  guest: {name: guest1, id: id1},
                  firm: 'The Grand Central',
                  start_date: datetime.dateOnly(new Date()),
                  end_date: datetime.dateOnly(new Date(), 10),
                  occupants: 1,
                  room: 2,
                  room_price: 54,
                  park_place: 'Parkplatz 1',
                  park_price: 3,
                  conf_room: 'Konf. 28',
                  conf_price: 0,
                  status: 'Sicher',
                  plan: 'Übernachtung im Einzelzimmer',
                  source: 'Phone',
                  comments: 'Group stay training'
                }, function (err, reservation) {
                  if (err)  console.log(err);
                });
              });
              Guest.findOne({'last_name': 'Guest'}, function (err, guest) {
                if (err || !guest.name) {
                  guest2 = 'unknown1';
                  id2 = -1;
                  console.log('Guest query failed. Err: ' + err);
                }
                else {
                  guest2 = guest.name;
                  id2 = guest._id;
                  console.log('Guest: ' + guest2 + ' ' + id2);
                }
                Reservation.create({
                  reservation_number: 1400102,
                  type: 'Bus.',
                  title: guest2,
                  guest: {name: guest2, id: id2},
                  firm: '',
                  start_date: datetime.dateOnly(new Date(), -10),
                  end_date: datetime.dateOnly(new Date()),
                  checked_in: datetime.dateOnly(new Date(), -10),
                  occupants: 2,
                  room: 9,
                  room_price: 60,
                  park_place: 'Parkplatz 2',
                  park_price: 3,
                  status: 'Sicher',
                  plan: 'Übernachtung im Doppelzimmer',
                  source: 'Booking.Com',
                  comments: ''
                }, function (err, reservation) {
                  if (err) console.log(err);
                });
              });
              Guest.findOne({'last_name': 'Adams'}, function (err, guest) {
                if (err || !guest.name) {
                  guest3 = 'unknown1';
                  id3 = -1;
                  console.log('Guest query failed. Err: ' + err);
                }
                else {
                  guest3 = guest.name;
                  id3 = guest._id;
                  console.log('Guest: ' + guest2 + ' ' + id3);
                }
                Reservation.create({
                  reservation_number: 1400103,
                  type: 'Kur',
                  title: guest3,
                  guest: {name: guest2, id: id2},
                  firm: '',
                  start_date: datetime.dateOnly(new Date(), -1),
                  end_date: datetime.dateOnly(new Date(), 15),
                  checked_in: datetime.dateOnly(new Date(), -1),
                  occupants: 1,
                  room: 6,
                  room_price: 60,
                  park_place: 'Parkplatz 3',
                  park_price: 3,
                  status: 'Sicher',
                  plan: 'Körner Kur',
                  insurance: 'VDAK',
                  source: 'Booking.Com',
                  comments: ''
                }, function (err, reservation) {
                  if (err) console.log(err);
                });
              });
            }
            else
              console.log("Reservation collection contains %d records", count);
          });

          $scope.$on('new-file', function (e, menu, item) {
            $state.go('file_new');
          });

          $scope.$on('open-file', function (e, menu, item) {
            $state.go('file_open');
          });

        }]);
});
