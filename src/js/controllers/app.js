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
        'AppConstants',
        'datetime',
        '$state',
        function ($scope, db, Firm, Guest, Reservation, Resource, Room, Itemtype, RoomPlan, AppConstants, datetime, $state) {
          console.log("App controller fired");

          // Add base db collections if needed.

          // Default Constant values. Note the name properties should not be edited since these are used to
          // reference the constants throughout the program
          AppConstants.count(function (err, count) {
            if (count === 0) {
              AppConstants.create({
                name: 'cityTax',
                display_name: 'Kurtaxe Preis',
                nvalue: 2.70,
                units: '€'
              }, function (err) {
                console.log(err);
              });
              AppConstants.create({
                name: 'parking',
                display_name: 'Parkplatz Preis',
                nvalue: 3.00,
                units: '€'
              }, function (err) {
                console.log(err);
              });
              AppConstants.create({
                name: 'breakfast',
                display_name: 'Frühstück Preis',
                nvalue: 4.80,
                units: '€'
              }, function (err) {
                console.log(err);
              });
              AppConstants.create({
                name: 'telephone',
                display_name: 'Tel Einheiten Preis',
                nvalue: 0.20,
                units: '€'
              }, function (err) {
                console.log(err);
              });
              AppConstants.create({
                name: 'salesTax',
                display_name: 'Mehrwertsteuer',
                nvalue: 19.0,
                units: '%'
              }, function (err) {
                console.log(err);
              });
              AppConstants.create({
                name: 'roomTax',
                display_name: 'Zimmer Ust',
                nvalue: 7.0,
                units: '%'
              }, function (err) {
                console.log(err);
              });
              AppConstants.create({
                name: 'prescriptionCharges',
                display_name: 'Rezept Gebühr',
                nvalue: 10,
                units: '€'
              }, function (err) {
                console.log(err);
              });
              AppConstants.create({
                name: 'ownContribution',
                display_name: 'Eigenanteil Prozent',
                nvalue: 10.0,
                units: '%'
              }, function (err) {
                console.log(err);
              });
              AppConstants.create({
                name: 'cityTaxDiscount',
                display_name: 'Kurtax Ermäßigung',
                nvalue: 10,
                units: '%'
              }, function (err) {
                console.log(err);
              });
              /*,
               AppConstants.create({
               name: 'cityTaxDiscount',
               display_name: 'Kurtax Ermäßigung',
               value: 10,
               units: '%'
               }, function (err) {
               console.log(err);
               });
 */
            }
            else {
              console.log("Firm collection contains %d records", count);
            }
          });
          //build expense types collection
          Itemtype.count(function (err, count) {
            if (count === 0) {
              Itemtype.create({
                name: 'ZimmerSchnupper',
                category: 'Plan',
                guest: '',
                room: 0,
                is_room: true,
                per_room: true,
                per_person: true,
                no_delete: true,
                no_display: true,
                day_count: true,
                one_per: false,
                edit_name: false,
                edit_count: false,
                low_tax_rate: true,
                display_string: '%count% %name% à € %price%',
                display_order: 1,
                single_price: 58.33,
                double_price: 51, //per person
                price: 0,
                count: 0
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'ZimmerUrlaub',
                category: 'Plan',
                guest: '',
                room: 0,
                is_room: true,
                per_room: true,
                per_person: true,
                no_delete: true,
                no_display: true,
                day_count: true,
                one_per: false,
                edit_name: false,
                low_tax_rate: true,
                display_string: '%count% %name% à € %price%',
                display_order: 1,
                single_price: 53.53,
                double_price: 46.2, //per person
                price: 0,
                count: 0
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'Zimmer',
                category: 'Plan',
                guest: '',
                room: 0,
                is_room: true,
                per_room: true,
                per_person: false,
                no_delete: true,
                no_display: true,
                day_count: true,
                one_per: false,
                edit_name: false,
                low_tax_rate: true,
                display_string: '%count% %planName% à € %price%',
                display_order: 1,
                price: 0,
                count: 0
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'BusZimmer',
                category: 'Plan',
                guest: '',
                room: 0,
                is_room: true,
                per_room: true,
                per_person: true,
                no_delete: true,
                no_display: true,
                day_count: true,
                one_per: false,
                edit_name: false,
                low_tax_rate: true,
                display_string: '%count%X  1 Tag Übernachtung im %roomType% à € %price%',
                display_order: 1,
                price: 0,
                count: 0
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'ZimmerKurKStd',
                category: 'Plan',
                guest: '',
                room: 0,
                is_room: true,
                per_room: true,
                per_person: true,
                no_delete: true,
                no_display: true,
                day_count: true,
                one_per: false,
                edit_name: false,
                low_tax_rate: true,
                display_string: '%count% %name% à € %price%',
                display_order: 1,
                single_price: 53.53,
                double_price: 46.2, //per person
                price: 0,
                count: 0
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'ZimmerKurKKomf',
                category: 'Plan',
                guest: '',
                room: 0,
                is_room: true,
                per_room: true,
                per_person: true,
                no_delete: true,
                no_display: true,
                day_count: true,
                one_per: false,
                edit_name: false,
                low_tax_rate: true,
                display_string: '%count% %name% à € %price%',
                display_order: 1,
                single_price: 58.53,
                double_price: 53.0, //per person
                price: 0,
                count: 0
              }, function (err) {
                if (err)console.log(err)
              });
              /*
              Itemtype.create({
                name: 'Kurtaxe',
                category: 'Plan',
                guest: '',
                room: 0,
                per_room: true,
                per_person: true,
                no_delete: false,
                no_display: false,
                day_count: true,
                one_per: true,
                edit_name: false,
                low_tax_rate: true,
                display_string: '%count% %name% à € %price%',
                display_order: 1,
                price: 2.70,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              */
              Itemtype.create({
                name: 'FrühstückInc',
                category: 'Plan',
                guest: '',
                room: 0,
                included_in_room: true,
                per_room: true,
                per_person: true,
                no_delete: true,
                no_display: true,
                day_count: true,
                one_per: false,
                edit_name: false,
                bus_pauschale: true,
                display_string: '%count% %name% à € %price%',
                display_order: 2,
                taxable_rate: 19,
                price: 4.80,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'HalbpensionInc',
                category: 'Plan',
                guest: '',
                room: 0,
                per_room: false,
                per_person: true,
                no_delete: true,
                no_display: true,
                day_count: true,
                one_per: true,
                edit_name: false,
                bus_pauschale: false,
                display_string: '%count% %name% à € %price%',
                display_order: 2,
                price: 19,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'Fangopackungen',
                category: 'Plan',
                guest: '',
                room: 0,
                per_room: false,
                per_person: true,
                no_delete: true,
                no_display: true,
                day_count: false,
                one_per: false,
                edit_name: false,
                bus_pauschale: false,
                low_tax_rate: true,
                display_string: '%count% %name% à € %price%',
                display_order: 2,
                price: 10,
                count: 4
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'Medizinische Sprudelbäder',
                category: 'Plan',
                guest: '',
                room: 0,
                per_room: false,
                per_person: true,
                no_delete: true,
                no_display: true,
                day_count: false,
                one_per: false,
                edit_name: false,
                bus_pauschale: false,
                low_tax_rate: true,
                display_string: '%count% %name% à € %price%',
                display_order: 2,
                price: 15,
                count: 4
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'Klassische Massage',
                category: 'Plan',
                guest: '',
                room: 0,
                per_room: false,
                per_person: true,
                no_delete: true,
                no_display: true,
                day_count: false,
                one_per: false,
                edit_name: false,
                bus_pauschale: false,
                low_tax_rate: true,
                display_string: '%count% %name% à € %price%',
                display_order: 2,
                price: 10,
                count: 4
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'Zug/Radfhart nach Weikersheim',
                category: 'Plan',
                guest: '',
                room: 0,
                per_room: false,
                per_person: true,
                no_delete: true,
                no_display: true,
                day_count: false,
                one_per: false,
                edit_name: false,
                display_string: '%name% à € %price%',
                display_order: 3,
                taxable_rate: 19,
                price: 10,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'Besuch des Deutschordensmuseum',
                category: 'Plan',
                guest: '',
                room: 0,
                per_room: false,
                per_person: true,
                no_delete: true,
                no_display: true,
                day_count: false,
                one_per: false,
                edit_name: false,
                display_string: '%name% à € %price%',
                display_order: 3,
                taxable_rate: 19,
                price: 8,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'Massagebehandlung im Haus',
                category: 'Plan',
                guest: '',
                room: 0,
                per_room: false,
                per_person: true,
                no_delete: true,
                no_display: true,
                day_count: false,
                one_per: false,
                edit_name: false,
                display_string: '%name% à € %price%',
                display_order:3,
                taxable_rate: 19,
                price: 30,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'Eintritt in den Wildpark',
                category: 'Plan',
                guest: '',
                room: 0,
                per_room: false,
                per_person: true,
                no_delete: true,
                no_display: true,
                day_count: false,
                one_per: false,
                edit_name: false,
                display_string: '%name% à € %price%',
                display_order: 3,
                taxable_rate: 19,
                price: 6.5,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'Stadtführung',
                category: 'Plan',
                guest: '',
                room: 0,
                per_room: false,
                per_person: true,
                no_delete: true,
                no_display: true,
                day_count: false,
                one_per: false,
                edit_name: false,
                display_string: '%name% à € %price%',
                display_order: 3,
                taxable_rate: 19,
                price: 4.80,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'Frühstück',
                category: 'Plan',
                guest: '',
                room: 0,
                per_room: true,
                per_person: true,
                no_delete: false,
                no_display: false,
                day_count: true,
                one_per: true,
                edit_name: false,
                bus_pauschale: true,
                display_string: '%count% %name% à € %price%',
                display_order: 2,
                price: 4.80,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'Pauschale',
                category: 'Plan',
                guest: '',
                room: 0,
                per_room: false,
                per_person: false,
                no_delete: false,
                no_display: false,
                day_count: false,
                one_per: false,
                edit_name: true,
                display_string: '%count% %name% à € %price%',
                display_order: 4,
                price: 0,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'Telephone',
                category: 'Plan',
                guest: '',
                room: 0,
                per_room: true,
                per_person: false,
                no_delete: false,
                no_display: false,
                day_count: false,
                one_per: false,
                edit_name: false,
                bus_pauschale: true,
                display_string: 'Telefon: %count% Einheiten à € %price%',
                display_order: 3,
                price: -1,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              /* This is added only by reserving a resource on the reservation
              Itemtype.create({
                name: 'Parkplatz',
                category: 'Plan',
                guest: '',
                room: 0,
                per_room: true,
                per_person: false,
                no_delete: false,
                no_display: false,
                day_count: true,
                one_per: false,
                edit_name: false,
                bus_pauschale: true,
                display_string: '%count% Parkgebühr à € %price%',
                display_order: 1,
                price: -1,
                count: 1
              },function(err){if (err)console.log(err)});
              */
              Itemtype.create({
                name: 'Classic Mineralwasser 0,2l',
                category: 'Getränke',
                guest: '',
                room: 0,
                per_room: false,
                per_person: false,
                no_delete: false,
                no_display: false,
                day_count: false,
                one_per: false,
                edit_name: false,
                display_string: '%count% %name% à € %price%',
                display_order: 1,
                taxable_rate: 19,
                price: 1.5,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'Distelhäuser Landbier dunkel 0,5l',
                category: 'Getränke',
                guest: '',
                room: 0,
                per_room: false,
                per_person: false,
                no_delete: false,
                no_display: false,
                day_count: false,
                one_per: false,
                edit_name: false,
                display_string: '%count% %name% à € %price%',
                display_order: 1,
                taxable_rate: 19,
                price: 2.1,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'Kuchen',
                category: 'Speisen',
                guest: '',
                room: 0,
                per_room: false,
                per_person: false,
                no_delete: false,
                no_display: false,
                day_count: false,
                one_per: false,
                edit_name: false,
                display_string: '%count% %name% à € %price%',
                display_order: 1,
                taxable_rate: 19,
                price: 2.0,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'Erdnüsse',
                category: 'Speisen',
                guest: '',
                room: 0,
                per_room: false,
                per_person: false,
                no_delete: false,
                no_display: false,
                day_count: false,
                one_per: false,
                edit_name: false,
                display_string: '%count% %name% à € %price%',
                display_order: 1,
                taxable_rate: 19,
                price: 1.0,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'Halbpension',
                category: 'Speisen',
                guest: '',
                room: 0,
                per_room: false,
                per_person: false,
                no_delete: false,
                no_display: false,
                day_count: false,
                one_per: false,
                edit_name: false,
                display_string: '%count% %name% à € %price%',
                display_order: 1,
                taxable_rate: 19,
                price: 19.0,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'Vollpension',
                category: 'Speisen',
                guest: '',
                room: 0,
                per_room: false,
                per_person: true,
                no_delete: false,
                no_display: false,
                day_count: false,
                one_per: false,
                edit_name: false,
                display_string: '%count% %name% à € %price%',
                display_order: 1,
                taxable_rate: 19,
                price: 29.0,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'X1501 Fangopackungen',
                category: 'VDAK',
                guest: '',
                room: 0,
                per_room: false,
                per_person: true,
                no_delete: false,
                no_display: false,
                day_count: false,
                one_per: false,
                edit_name: false,
                display_string: '%count% %name% à € %price%',
                display_order: 1,
                taxable_rate: 19,
                price: 8.19,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'X1712 Gashaltiges Bad mit Zusatz',
                category: 'VDAK',
                guest: '',
                room: 0,
                per_room: false,
                per_person: true,
                no_delete: false,
                no_display: false,
                day_count: false,
                one_per: false,
                edit_name: false,
                display_string: '%count% %name% à € %price%',
                display_order: 1,
                taxable_rate: 19,
                price: 15.5,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'X0106 Klassische Massage',
                category: 'VDAK',
                guest: '',
                room: 0,
                per_room: false,
                per_person: false,
                no_delete: false,
                no_display: false,
                day_count: false,
                one_per: false,
                edit_name: false,
                display_string: '%count% %name% à € %price%',
                display_order: 1,
                taxable_rate: 19,
                price: 14.06,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              /*
               Itemtype.create({
               name: '',
               category: 'Plan',
               guest: '',
               room: 0,
               per_room: false,
               per_person: false,
               no_delete: false,
               no_display: false,
               day_count: false,
               one_count: false,
               edit_name: false,
               display_string: '%count% %name% à € %price%',
               display_order: 1,
               taxable_rate: 19,
               price: 4.80,
               count: 1
               }, function (err) {
               if (err)console.log(err)
               });
               */
            }
            else {
              console.log("Itemtype collection contains %d records", count);
            }
          });

          RoomPlan.count(function (err, count) {
            if (count === 0) {
              RoomPlan.create({
                name: 'Unterkunft mit Frühstück im Einzelzimmer',
                resTypeFilter: ['Std.'],
                is_default: true,
                is_plan: false,
                is_group: false,
                one_bill: true,
                one_room: true,
                single_only: true,
                double_only: false,
                second_guest: false,
                needs_firm: false,
                needs_insurance: false,
                includes_breakfast: true,
                display_string: '%nights% Tage %name% à € %roomprice%',
                required_items: ['Zimmer']
              },function(err){if (err)console.log(err)});
              RoomPlan.create({
                name: 'Unterkunft mit Frühstück im Doppelzimmer',
                resTypeFilter: ['Std.'],
                is_plan: false,
                is_group: false,
                one_bill: true,
                one_room: true,
                single_only: false,
                double_only: true,
                second_guest: false,
                needs_firm: false,
                needs_insurance: false,
                includes_breakfast: true,
                display_string: '%nights% Tage %name% à € %roomprice%',
                required_items: ['Zimmer']
              },function(err){if (err)console.log(err)});
              RoomPlan.create({
                name: 'Schnupperangebot',
                resTypeFilter: ['Std.'],
                is_plan: true,
                is_group: false,
                one_bill: true,
                one_room: true,
                single_only: false,
                double_only: false,
                second_guest: false,
                needs_firm: false,
                needs_insurance: false,
                includes_breakfast: true,
                pp_price: 153,
                single_surcharge: 22,
                duration: 3,
                display_string: '%duration% Tage %name% %perPerson%',
                required_items: ['ZimmerSchnupper']
              },function(err){if (err)console.log(err)});
              RoomPlan.create({
                name: 'Urlaub in der Kurstadt',
                resTypeFilter: ['Std.'],
                is_plan: true,
                is_group: false,
                one_bill: true,
                one_room: true,
                single_only: false,
                double_only: false,
                second_guest: false,
                needs_firm: false,
                needs_insurance: false,
                includes_breakfast: true,
                pp_price: 330,
                single_surcharge: 35,
                duration: 6,
                display_string: '%duration% Tage %name% %perPerson%',
                required_items:  ['ZimmerUrlaub', 'Zug/Radfhart nach Weikersheim', 'Besuch des Deutschordensmuseum', 'Massagebehandlung im Haus', 'Eintritt in den Wildpark', 'Eintritt in den Wildpark', 'Stadtführung']
              },function(err){if (err)console.log(err)});
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
                second_guest: false,
                needs_firm: true,
                needs_insurance: false,
                display_string: '%nights%X - 1 Tag %name% à € %roomprice%',
                required_items: ['BusZimmer']
              },function(err){if (err)console.log(err)});
              RoomPlan.create({
                name: 'Übernachtung im Dopplezimmer',
                resTypeFilter: ['Bus.'],
                is_plan: false,
                is_group: false,
                one_bill: false,
                one_room: true,
                single_only: false,
                double_only: true,
                second_guest: true,
                needs_firm: true,
                needs_insurance: false,
                display_string: '%nights%X - 1 Tag %name% à € %roomprice%',
                required_items: ['BusZimmer']
              },function(err){if (err)console.log(err)});
              RoomPlan.create({
                name: 'Der Kur-Klassiker Std. Zimmer',
                resTypeFilter: ['Kur'],
                is_default: true,
                is_plan: true,
                is_group: false,
                one_bill: false,
                one_room: true,
                single_only: false,
                double_only: false,
                second_guest: true,
                needs_firm: false,
                needs_insurance: true,
                includes_breakfast: true,
                pp_price: 1056,
                single_surcharge: 154,
                duration: 14,
                display_string: '%duration% Tage %name% %perPerson%',
                required_items: ['ZimmerKurKStd', 'HalbpensionInc', 'Fangopackungen', 'Medizinische Sprudelbäder', 'Klassische Massage', 'Stadtführung']
              },function(err){if (err)console.log(err)});
              RoomPlan.create({
                name: 'Der Kur-Klassiker Komf. Zimmer',
                resTypeFilter: ['Kur'],
                is_plan: true,
                is_group: false,
                one_bill: false,
                one_room: true,
                single_only: false,
                double_only: false,
                second_guest: true,
                needs_firm: false,
                needs_insurance: true,
                includes_breakfast: true,
                pp_price: 1151,
                single_surcharge: 129,
                duration: 14,
                display_string: '%duration% Tage %name% %perPerson%',
                required_items: ['ZimmerKurKKomf', 'HalbpensionInc', 'Fangopackungen', 'Medizinische Sprudelbäder', 'Klassische Massage', 'Stadtführung']
              },function(err){if (err)console.log(err)});
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
                second_guest: true,
                needs_firm: true,
                needs_insurance: false,
                display_string: '%day% Tage %name% à € %roomprice%',
                required_items: ['BusZimmer']
              },function(err){if (err)console.log(err)});
              RoomPlan.create({
                name: 'Reisegruppe',
                resTypeFilter: ['Group'],
                is_plan: false,
                is_group: true,
                one_bill: true,
                one_room: false,
                single_only: false,
                double_only: false,
                second_guest: false,
                needs_firm: true,
                needs_insurance: false,
                includes_breakfast: true,
                display_string: '%nights% Tage Unterkunft mit Frühstück für %occupants% Personen',
                required_items: ['Zimmer']
              },function(err){if (err)console.log(err)});
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
              }, function (err) {
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
              }, function (err) {
                if (err) console.log(err);
              });
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
              }, function (err) {
                if (err) console.log(err);
              });
            }
            else
              console.log("Guest collection contains %d records", count);
          });

          Resource.count(function (err, count) {
            if (count === 0) {
              console.log("Creating Resource collection");
              Resource.create({
                name: 'Parkplatz 1',
                resource_type: 'Parkplatz',
                display_order: 1,
                multiple_allowed: false,
                price: 3
              }, function (err) {
                if (err)console.log(err)
              });
              Resource.create({
                name: 'Parkplatz 2',
                resource_type: 'Parkplatz',
                display_order: 2,
                multiple_allowed: false,
                price: 3
              }, function (err) {
                if (err)console.log(err)
              });
              Resource.create({
                name: 'Parkplatz 3',
                resource_type: 'Parkplatz',
                display_order: 3,
                multiple_allowed: false,
                price: 3
              }, function (err) {
                if (err)console.log(err)
              });
              Resource.create({
                name: 'Parkplatz 4',
                resource_type: 'Parkplatz',
                display_order: 4,
                multiple_allowed: false,
                price: 3
              }, function (err) {
                if (err)console.log(err)
              });
              Resource.create({
                name: 'Parkplatz 5',
                resource_type: 'Parkplatz',
                display_order: 5,
                multiple_allowed: false,
                price: 3
              }, function (err) {
                if (err)console.log(err)
              });
              Resource.create({
                name: 'Parkplatz 6',
                resource_type: 'Parkplatz',
                display_order: 6,
                multiple_allowed: false,
                price: 3
              }, function (err) {
                if (err)console.log(err)
              });
              Resource.create({
                name: 'Parkplatz 7',
                resource_type: 'Parkplatz',
                display_order: 7,
                multiple_allowed: false,
                price: 3
              }, function (err) {
                if (err)console.log(err)
              });
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
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 3,
                room_type: 'Einzelzimmer',
                room_class: 'Komfort',
                display_order: 1,
                price: 66
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 4,
                room_type: 'Einzelzimmer',
                room_class: 'Standart',
                display_order: 1,
                price: 61
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 5,
                room_type: 'Einzelzimmer',
                room_class: 'Economy',
                display_order: 1,
                price: 57
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 6,
                room_type: 'Einzelzimmer',
                room_class: 'Komfort',
                display_order: 1,
                price: 66
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 7,
                room_type: 'Einzelzimmer',
                room_class: 'Komfort',
                display_order: 1,
                price: 66
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 9,
                room_type: 'Doppelzimmer',
                room_class: 'Economy',
                display_order: 2,
                price: 94
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 10,
                room_type: 'Einzelzimmer',
                room_class: 'Economy',
                display_order: 1,
                price: 57
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 12,
                room_type: 'Einzelzimmer',
                room_class: 'Komfort',
                display_order: 1,
                price: 66
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 15,
                room_type: 'Einzelzimmer',
                room_class: 'Komfort',
                display_order: 1,
                price: 66
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 18,
                room_type: 'Doppelzimmer',
                room_class: 'Komfort',
                display_order: 2,
                price: 109
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 31,
                room_type: 'Doppelzimmer',
                room_class: 'Komfort',
                display_order: 2,
                price: 109
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 32,
                room_type: 'Doppelzimmer',
                room_class: 'Komfort',
                display_order: 2,
                price: 109
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 23,
                room_type: 'Suite',
                room_class: '',
                display_order: 3,
                price: 125
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 26,
                room_type: 'Suite',
                room_class: 'Balkon',
                display_order: 3,
                price: 130
              }, function (err) {
                if (err)console.log(err)
              });
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
              }, function (err) {
                if (err) console.log(err);
              });
              Firm.create({
                firm_name: 'ELB-SCHLIFF Werkzeugmaschinen GmbH/aba Grinding Technologies GmbH',
                address1: 'Bollenwaldstraße 116',
                address2: '',
                city: 'Aschaffenburg',
                post_code: 63743,
                room_price: 57
              }, function (err) {
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
              }, function (err) {
                if (err) console.log(err);
              });
              Firm.create({
                firm_name: 'Federal-Mogul Systems Protection',
                address1: 'Bürgermeister-Schmidt-Straße 17',
                address2: '',
                city: 'Bruscheid',
                post_code: 51399,
                room_price: 55
              }, function (err) {
                if (err) console.log(err);
              });
            }
            else {
              console.log("Firm collection contains %d records", count);
            }
          });
/*
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
                  resources: [{name: 'Parkplatz 1', resource_type: 'Parkplatz', price: 3}],
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
                  resources: [{name: 'Parkplatz 2', resource_type: 'Parkplatz', price: 3}],
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
                  resources: [{name: 'Parkplatz 2', resource_type: 'Parkplatz', price: 3}],
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
*/


          // Other stuff for menu Currently not used
          $scope.$on('new-file', function (e, menu, item) {
            $state.go('file_new');
          });

          $scope.$on('open-file', function (e, menu, item) {
            $state.go('file_open');
          });
        }]);
});
