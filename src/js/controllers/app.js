define(['./module'], function (controllers) {
  'use strict';

  controllers.controller('AppCtrl',
      ['$scope',
        'db',
        'Firm',
        'Guest',
        'Reservation',
        'Resource',
        'Room',
        'Itemtype',
        'RoomPlan',
        'datetime',
        '$state',
        function ($scope, db, Firm, Guest, Reservation, Resource, Room, Itemtype, RoomPlan, datetime, $state) {
          console.log("App controller fired");

          //build expense types collection
          Itemtype.count(function(err, count) {
            if (count === 0){
              Itemtype.create({
                name: 'Frühstück',
                category: 'Allgemein',
                code: 0,
                no_delete: false,
                day_count: true,
                edit_name: false,
                display_string: '%count% %name% à € %unitprice%',
                display_order: 1,
                taxable_rate: 19,
                default_unit_price: 4.80
              },function(err, count){if (err)console.log(err)});
              Itemtype.create({
                name: 'Kurtaxe',
                category: 'Plan',
                code: 0,
                no_delete: false,
                day_count: true,
                edit_name: false,
                display_string: '%count% %name% à € %unitprice%',
                display_order: 1,
                taxable_rate: 7,
                default_unit_price: 3
              },function(err, count){if (err)console.log(err)});
              Itemtype.create({
                name: 'Parkplatz',
                category: 'Allgemein',
                code: 0,
                no_delete: false,
                day_count: true,
                edit_name: false,
                display_string: '%count% %name% à € %unitprice%',
                display_order: 1,
                taxable_rate: 19,
                default_unit_price: 3
              },function(err, count){if (err)console.log(err)});
              Itemtype.create({
                name: 'Telephone',
                category: 'Allgemein',
                code: 0,
                no_delete: false,
                day_count: true,
                edit_name: false,
                display_string: '',
                display_order: 1,
                taxable_rate: 19,
                default_unit_price: 3
              },function(err, count){if (err)console.log(err)});
              Itemtype.create({
                name: 'Pauschale',
                category: 'Allgemein',
                code: 2,
                no_delete: false,
                day_count: false,
                edit_name: true,
                display_string: '%name% à € %price%',
                display_order: 1,
                taxable_rate: 19,
                default_unit_price: 0
              },function(err, count){if (err)console.log(err)});
              Itemtype.create({
                name: 'Classic Mineralwasser 0,2l',
                category: 'Getränke',
                code: 0,
                no_delete: false,
                day_count: false,
                edit_name: true,
                display_string: '%count% %name% à € %unitprice%',
                display_order: 1,
                taxable_rate: 19,
                default_unit_price: 1.5
              },function(err, count){if (err)console.log(err)});
              Itemtype.create({
                name: 'Distelhäuser Landbier dunkel 0,5l',
                category: 'Getränke',
                code: 0,
                no_delete: false,
                day_count: false,
                edit_name: true,
                display_string: '%count% %name% à € %unitprice%',
                display_order: 1,
                taxable_rate: 19,
                default_unit_price: 2.1
              },function(err, count){if (err)console.log(err)});
              Itemtype.create({
                name: 'Kuchen',
                category: 'Speisen',
                code: 0,
                no_delete: false,
                day_count: false,
                edit_name: true,
                display_string: '%count% %name% à € %unitprice%',
                display_order: 1,
                taxable_rate: 19,
                default_unit_price: 2.0
              },function(err, count){if (err)console.log(err)});
              Itemtype.create({
                name: 'Erdnüsse',
                category: 'Speisen',
                code: 0,
                no_delete: false,
                day_count: false,
                edit_name: true,
                display_string: '%count% %name% à € %unitprice%',
                display_order: 1,
                taxable_rate: 19,
                default_unit_price: 1.0
              },function(err, count){if (err)console.log(err)});
              Itemtype.create({
                name: 'Halbpension',
                category: 'Speisen',
                code: 0,
                no_delete: false,
                day_count: true,
                edit_name: true,
                display_string: '%count% %name% à € %unitprice%',
                display_order: 1,
                taxable_rate: 19,
                default_unit_price: 19.0
              },function(err, count){if (err)console.log(err)});
              Itemtype.create({
                name: 'Vollpension',
                category: 'Speisen',
                code: 0,
                no_delete: false,
                day_count: true,
                edit_name: true,
                display_string: '%count% %name% à € %unitprice%',
                display_order: 1,
                taxable_rate: 19,
                default_unit_price: 29.0
              },function(err, count){if (err)console.log(err)});
              Itemtype.create({
                name: 'X1501 Fangopackungen',
                category: 'VDAK',
                code: 0,
                no_delete: false,
                day_count: false,
                edit_name: true,
                display_string: '%count% %name% à € %unitprice%',
                display_order: 1,
                taxable_rate: 19,
                default_unit_price: 8.19
              },function(err, count){if (err)console.log(err)});
              Itemtype.create({
                name: 'X1712 Gashaltiges Bad mit Zusatz',
                category: 'VDAK',
                code: 0,
                no_delete: false,
                day_count: false,
                edit_name: true,
                display_string: '%count% %name% à € %unitprice%',
                display_order: 1,
                taxable_rate: 19,
                default_unit_price: 15.5
              },function(err, count){if (err)console.log(err)});
              Itemtype.create({
                name: 'X0106 Klassische Massage',
                category: 'VDAK',
                code: 0,
                no_delete: false,
                day_count: false,
                edit_name: true,
                display_string: '%count% %name% à € %unitprice%',
                display_order: 1,
                taxable_rate: 19,
                default_unit_price: 14.06
              },function(err, count){if (err)console.log(err)});
/*
              Itemtype.create({
                name: '',
                category: '',
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

          RoomPlan.count(function(err, count){
            if (count === 0){
               RoomPlan.create({
                 name: 'Unterkunft mit Frühstück im Einzelzimmer',
                 resTypeFilter: ['Std.'],
                 is_default: true,
                 is_plan: false,
                 is_group: false,
                 one_bill: false,
                 one_room: true,
                 single_only: true,
                 double_only: false,
                 needs_firm: false,
                 needs_insurance: false,
                 display_string: '%day% Tage %name% à € %roomprice%',
                 required_items: [
                   {name: 'Zimmer', category: 'Plan', count: -1, price: -1, no_delete: true, day_count: true, taxable_rate: 7},
                   {name: 'Frühstück', category: 'Plan', count: -1, price: 5, no_delete: true, day_count: true, taxable_rate: 19},
                   {name: 'Kurtaxe', category: 'Plan', count: -1, price: 3.15, canDelete: false, dayCount: true, taxable_rate: 19}
                 ]
               });
              RoomPlan.create({
                name: 'Unterkunft mit Frühstück im Doppelzimmer',
                resTypeFilter: ['Std.'],
                is_plan: false,
                is_group: false,
                one_bill: false,
                one_room: true,
                single_only: false,
                double_only: true,
                needs_firm: false,
                needs_insurance: false,
                display_string: '%day% Tage %name% à € %roomprice%',
                required_items: [
                  {name: 'Zimmer', category: 'Plan', count: -1, price: -1, no_delete: true, day_count: true, taxable_rate: 7},
                  {name: 'Frühstück', category: 'Plan', count: -1, price: 5, no_delete: true, day_count: true, taxable_rate: 19}
                ]
              });
              RoomPlan.create({
                name: 'Schnupperangebot',
                resTypeFilter: ['Std.'],
                is_plan: true,
                is_group: false,
                one_bill: false,
                one_room: true,
                single_only: false,
                double_only: false,
                needs_firm: false,
                needs_insurance: false,
                pp_price: 153,
                single_surcharge: 22,
                duration: 3,
                display_string: '%duration% Tage %name%',
                required_items: [
                  {name: 'Zimmer', category: 'Plan', count: 3, price: 46, canDelete: false, dayCount: true, taxable_rate: 7},
                  {name: 'Frühstück', category: 'Plan', count:3, price: 5, canDelete: false, dayCount: true, taxable_rate: 19}
                ]
              });
              RoomPlan.create({
                name: 'Urlaub in der Kurstadt',
                resTypeFilter: ['Std.'],
                is_plan: true,
                is_group: false,
                one_bill: false,
                one_room: true,
                single_only: false,
                double_only: false,
                needs_firm: false,
                needs_insurance: false,
                pp_price: 330,
                single_surcharge: 35,
                duration: 6,
                display_string: '%duration% Tage %name%',
                required_items: [
                  {name: 'Zimmer', category: 'Plan', count: 6, price: 46, canDelete: false, dayCount: true, taxable_rate: 7},
                  {name: 'Frühstück', category: 'Plan', count:6, price: 5, canDelete: false, dayCount: true, taxable_rate: 19},
                  {name: 'Zug/Radfhart nach Weikersheim', category: 'Plan', count:1, price: 10, canDelete: false, dayCount: true, taxable_rate: 19},
                  {name: 'Besuch des Deutschordensmuseum', category: 'Plan', count:1, price: 8, canDelete: false, dayCount: true, taxable_rate: 19},
                  {name: 'Massagebehandlung im Haus', category: 'Plan', count:1, price: 6, canDelete: false, dayCount: true, taxable_rate: 19},
                  {name: 'Eintritt in den Wildpark', category: 'Plan', count:1, price: 3, canDelete: false, dayCount: true, taxable_rate: 19},
                  {name: 'Stadtführung', category: 'Plan', count:1, price: 5, canDelete: false, dayCount: true, taxable_rate: 19}
                ]
              });
              RoomPlan.create({
                name: 'Übernachtung im Einzelzimmer',
                resTypeFilter: ['Bus.'],
                is_default: true,
                is_plan: false,
                is_group: false,
                one_bill: false,
                one_room: true,
                single_only: true,
                double_only: false,
                needs_firm: true,
                needs_insurance: false,
                display_string: '%day% Tage %name% à € %roomprice%',
                required_items: [
                  {name: 'Zimmer', count: -1, price: -1, no_delete: true, day_count: true, taxable_rate: 19}
                ]
              });
              RoomPlan.create({
                name: 'Übernachtung im Dopplezimmer',
                resTypeFilter: ['Bus.'],
                is_plan: false,
                is_group: false,
                one_bill: false,
                one_room: true,
                single_only: false,
                double_only: true,
                needs_firm: true,
                needs_insurance: false,
                display_string: '%day% Tage %name% à € %roomprice%',
                required_items: [
                  {name: 'Zimmer', count: -1, price: -1, no_delete: true, day_count: true, taxable_rate: 19}
                ]
              });
              RoomPlan.create({
                name: 'Der Kur-Klassiker',
                resTypeFilter: ['Kur'],
                is_plan: true,
                is_group: false,
                one_bill: false,
                one_room: true,
                single_only: false,
                double_only: false,
                needs_firm: false,
                needs_insurance: true,
                pp_price: 1056,
                single_surcharge: 154,
                duration: 6,
                display_string: '%duration% Tage %name%',
                required_items: [
                  {name: 'Zimmer', count: -1, price: -1, no_delete: true, day_count: true, taxable_rate: 19}
                ]
              });
              RoomPlan.create({
                name: 'Geschäftsgruppe',
                resTypeFilter: ['Group'],
                is_default: true,
                is_plan: false,
                is_group: true,
                one_bill: false,
                one_room: false,
                single_only: false,
                double_only: false,
                needs_firm: true,
                needs_insurance: false,
                display_string: '%day% Tage %name% à € %roomprice%',
                required_items: [
                  {name: 'Zimmer', count: -1, price: -1, no_delete: true, day_count: true, taxable_rate: 19}
                ]
              });
              RoomPlan.create({
                name: 'Reisegruppe',
                resTypeFilter: ['Group'],
                is_plan: false,
                is_group: true,
                one_bill: true,
                one_room: false,
                single_only: false,
                double_only: false,
                needs_firm: true,
                needs_insurance: false,
                display_string: '%day% Tage %name% à € %roomprice%',
                required_items: [
                  {name: 'Zimmer', count: -1, price: -1, no_delete: true, day_count: true, taxable_rate: 19}
                ]
              });
            }
            else {
              console.log("RoomPlan collection contains %d records", count);
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
                room_class: 'Economy',
                display_order: 1,
                price: 57
              },function(err, count){if (err)console.log(err)});
              Room.create({
                number: 3,
                room_type: 'Einzelzimmer',
                room_class: 'Komfort',
                display_order: 1,
                price: 66
              },function(err, count){if (err)console.log(err)});
              Room.create({
                number: 4,
                room_type: 'Einzelzimmer',
                room_class: 'Komfort',
                display_order: 1,
                price: 66
              },function(err, count){if (err)console.log(err)});
              Room.create({
                number: 5,
                room_type: 'Einzelzimmer',
                room_class: 'Economy',
                display_order: 1,
                price: 57
              },function(err, count){if (err)console.log(err)});
              Room.create({
                number: 6,
                room_type: 'Einzelzimmer',
                room_class: 'Komfort',
                display_order: 1,
                price: 66
              },function(err, count){if (err)console.log(err)});
              Room.create({
                number: 7,
                room_type: 'Einzelzimmer',
                room_class: 'Komfort',
                display_order: 1,
                price: 66
              },function(err, count){if (err)console.log(err)});
              Room.create({
                number: 9,
                room_type: 'Doppelzimmer',
                room_class: 'Economy',
                display_order: 2,
                price: 94
              },function(err, count){if (err)console.log(err)});
              Room.create({
                number: 10,
                room_type: 'Einzelzimmer',
                room_class: 'Economy',
                display_order: 1,
                price: 57
              },function(err, count){if (err)console.log(err)});
              Room.create({
                number: 12,
                room_type: 'Einzelzimmer',
                room_class: 'Komfort',
                display_order: 1,
                price: 66
              },function(err, count){if (err)console.log(err)});
              Room.create({
                number: 15,
                room_type: 'Einzelzimmer',
                room_class: 'Komfort',
                display_order: 1,
                price: 66
              },function(err, count){if (err)console.log(err)});
              Room.create({
                number: 18,
                room_type: 'Doppelzimmer',
                room_class: 'Komfort',
                display_order: 2,
                price: 109
              },function(err, count){if (err)console.log(err)});
              Room.create({
                number: 23,
                room_type: 'Suite',
                room_class: '',
                display_order: 3,
                price: 125
              },function(err, count){if (err)console.log(err)});
              Room.create({
                number: 26,
                room_type: 'Suite',
                room_class: 'Balkon',
                display_order: 3,
                price: 130
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
                  type: 'Bus.',
                  title: 'The Grand Central (LongStay)',
                  guest: {name: guest1, id: id1},
                  firm: 'The Grand Central',
                  start_date: datetime.dateOnly(new Date()),
                  end_date: datetime.dateOnly(new Date(), 10),
                  occupants: 1,
                  rooms: [{number: 2, room_type: 'Economy-Einzelzimmer', guest: 'Dr. Susie Longstay', price: 54}],
                  resources: [{name: 'Parkplatz 1',resource_type: 'Parkplatz', price: 3}],
                  status: 'Sicher',
                  plan: 'Übernachtung im Einzelzimmer',
                  plan_code: 20,
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
                  type: 'Std.',
                  title: guest2,
                  guest: {name: guest2, id: id2},
                  firm: '',
                  start_date: datetime.dateOnly(new Date(), -10),
                  end_date: datetime.dateOnly(new Date()),
                  checked_in: datetime.dateOnly(new Date(), -10),
                  occupants: 2,
                  rooms: [{number: 3, room_type: 'Komfort-Einzelzimmer', guest: 'Johnny Guest', price: 66},
                         {number: 4, room_type: 'Komfort-Einzelzimmer', guest: 'Jane Smith', price: 66}],
                  resources: [{name: 'Parkplatz 2',resource_type: 'Parkplatz', price: 3}],
                  status: 'Sicher',
                  plan: 'Unterkunft mit Frühstück im Doppelzimmerr',
                  plan_code: 6,
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
                  rooms: [{number: 12, room_type: 'Economy-Einzelzimmer', guest: 'Monika Adams', price: 57}],
                  resources: [{name: 'Parkplatz 2',resource_type: 'Parkplatz', price: 3}],
                  status: 'Sicher',
                  plan: 'Der Kur-Klassiker',
                  plan_code: 24,
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
