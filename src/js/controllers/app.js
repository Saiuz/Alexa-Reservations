define(['./module'], function (controllers) {
  'use strict';

  controllers.controller('AppCtrl',
      ['$scope',
       '$rootScope',
        'db',
        'Firm',
        'Guest',
        'Reservation',
        'Resource',
        'Room',
        'Itemtype',
        'RoomPlan',
        'AppConstants',
        'configService',
        'datetime',
        '$state',
        '$timeout',
        function ($scope, $rootScope, db, Firm, Guest, Reservation, Resource,
                  Room, Itemtype, RoomPlan, AppConstants, configService, datetime, $state, $timeout) {
          console.log("App controller fired");
          // Set the saved date for the home page room plan to the current date
          configService.set('planDate', datetime.dateOnly(new Date()));

          // Add base db collections if needed.

          // Default Constant values. These are constant values that are used throughout the program but that have
          // values that can be changed but the user. Note the name properties should not be edited since these are used
          // to reference the constants throughout the program
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
                nvalue: 50,
                units: '%'
              }, function (err) {
                console.log(err);
              });
              AppConstants.create({
                name: 'halfpension',
                display_name: 'Halbpension',
                nvalue: 19,
                units: '€'
              }, function (err) {
                console.log(err);
              });
              AppConstants.create({
                name: 'fullpension',
                display_name: 'Vollpension',
                nvalue: 29,
                units: '€'
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
                bill_code: configService.constants.bcRoom,
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
                display_string: '%planName%',
                display_order: 1,
                single_price: 53.3349, // times 3 rounds up to 175.00
                double_price: 51.0, //per person
                price: 0,
                count: 0
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'ZimmerUrlaub',
                category: 'Plan',
                bill_code: configService.constants.bcRoom,
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
                display_string: '%planName%',
                display_order: 1,
                single_price: 53.53,
                double_price: 47.6967, //per person
                price: 0,
                count: 0
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'Zimmer',
                category: 'Plan',
                bill_code: configService.constants.bcRoom,
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
                display_string: '%planName%',
                display_order: 1,
                price: 0,
                count: 0
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'BusZimmer',
                category: 'Plan',
                bill_code: configService.constants.bcRoom,
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
                display_string: '%planName%',
                display_order: 1,
                price: 0,
                count: 0
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'ZimmerKurKneipp',
                category: 'Plan',
                bill_code: configService.constants.bcRoom,
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
                display_string: '%planName%',
                display_order: 1,
                single_price: 51.20,
                double_price: 46.2, //per person
                price: 0,
                count: 0
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'ZimmerKörnerKur',
                category: 'Plan',
                bill_code: configService.constants.bcRoom,
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
                display_string: '%planName%',
                display_order: 1,
                single_price: 53.53,
                double_price: 46.2, //per person
                price: 0,
                count: 0
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'ZimmerKurKStd',
                category: 'Plan',
                bill_code: configService.constants.bcRoom,
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
                display_string: '%planName%',
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
                bill_code: configService.constants.bcRoom,
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
                display_string: '%planName%',
                display_order: 1,
                single_price: 58.53,
                double_price: 53.0, //per person
                price: 0,
                count: 0
              }, function (err) {
                if (err)console.log(err)
              });
              /*Itemtype.create({
                name: configService.loctxt.breakfastInc,
                category: 'Plan',
                bill_code: configService.constants.bcPackageItem,
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
                display_string: '%count% %name% à %price%',
                display_order: 2,
                price: 4.80,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });*/
              Itemtype.create({
                name: configService.loctxt.halfPensionInc,
                category: 'Plan',
                bill_code: configService.constants.bcPackageItem,
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
                display_string: '%count% %name% à %price%',
                display_order: 2,
                price: 19,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: configService.loctxt.fullPensionInc,
                category: 'Plan',
                bill_code: configService.constants.bcPackageItem,
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
                display_string: '%count% %name% à %price%',
                display_order: 2,
                price: 29,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'Kneippgüsse',
                category: 'Plan',
                bill_code: configService.constants.bcKurPackageItem,
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
                display_string: '%count% %name% à %price%',
                display_order: 2,
                price: 3.5,
                count: 3
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'Kräuterbad-Kneipp',
                category: 'Plan',
                bill_code: configService.constants.bcKurPackageItem,
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
                display_string: '%count% %name% à %price%',
                display_order: 2,
                price: 21,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'Blitzguss-Kneipp',
                category: 'Plan',
                bill_code: configService.constants.bcKurPackageItem,
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
                display_string: '%count% %name% à %price%',
                display_order: 2,
                price: 11,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'Kopfmassage-Kneipp',
                category: 'Plan',
                bill_code: configService.constants.bcKurPackageItem,
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
                display_string: '%count% %name% à %price%',
                display_order: 2,
                price: 16,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'Heublumensack-Kneipp',
                category: 'Plan',
                bill_code: configService.constants.bcKurPackageItem,
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
                display_string: '%count% %name% à %price%',
                display_order: 2,
                price: 15,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'Fangopackungen',
                category: 'Plan',
                bill_code: configService.constants.bcKurPackageItem,
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
                display_string: '%count% %name% à %price%',
                display_order: 2,
                price: 10,
                count: 4
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'Medizinische Sprudelbäder',
                category: 'Plan',
                bill_code: configService.constants.bcKurPackageItem,
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
                display_string: '%count% %name% à %price%',
                display_order: 2,
                price: 15,
                count: 4
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'Klassische Massage',
                category: 'Plan',
                bill_code: configService.constants.bcKurPackageItem,
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
                display_string: '%count% %name% à %price%',
                display_order: 2,
                price: 10,
                count: 4
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'Zug/Radfhart nach Weikersheim',
                category: 'Plan',
                bill_code: configService.constants.bcPackageItem,
                guest: '',
                room: 0,
                per_room: false,
                per_person: true,
                no_delete: true,
                no_display: true,
                day_count: false,
                one_per: false,
                edit_name: false,
                display_string: '%name% à %price%',
                display_order: 3,
                price: 9.70,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'Besuch des Deutschordensmuseum',
                category: 'Plan',
                bill_code: configService.constants.bcPackageItem,
                guest: '',
                room: 0,
                per_room: false,
                per_person: true,
                no_delete: true,
                no_display: true,
                day_count: false,
                one_per: false,
                edit_name: false,
                display_string: '%name% à %price%',
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
                bill_code: configService.constants.bcPackageItem,
                guest: '',
                room: 0,
                per_room: false,
                per_person: true,
                no_delete: true,
                no_display: true,
                day_count: false,
                one_per: false,
                edit_name: false,
                display_string: '%name% à %price%',
                display_order:3,
                taxable_rate: 19,
                price: 14.52,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'Eintritt in den Wildpark',
                category: 'Plan',
                bill_code: configService.constants.bcPackageItem,
                guest: '',
                room: 0,
                per_room: false,
                per_person: true,
                no_delete: true,
                no_display: true,
                day_count: false,
                one_per: false,
                edit_name: false,
                display_string: '%name% à %price%',
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
                bill_code: configService.constants.bcPackageItem,
                guest: '',
                room: 0,
                per_room: false,
                per_person: true,
                no_delete: true,
                no_display: true,
                day_count: false,
                one_per: false,
                edit_name: false,
                display_string: '%name% à %price%',
                display_order: 3,
                taxable_rate: 19,
                price: 5.10,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'Frühstück',
                category: 'Plan',
                bill_code: configService.constants.bcMeals,
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
                display_string: '%count% %name% à %price%',
                display_order: 2,
                price_lookup: 'breakfast',
                price: 0,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: configService.loctxt.halfPension,
                category: 'Plan',
                bill_code: configService.constants.bcMeals,
                guest: '',
                room: 0,
                per_room: false,
                per_person: true,
                no_delete: false,
                no_display: false,
                day_count: true,
                one_per: true,
                edit_name: false,
                edit_count: true,
                display_string: '%count% Tag|Tage %name% à %price%',
                display_order: 4,
                price_lookup: 'halfpension',
                price: 19.0,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: configService.loctxt.fullPension,
                category: 'Plan',
                bill_code: configService.constants.bcMeals,
                guest: '',
                room: 0,
                per_room: false,
                per_person: true,
                no_delete: false,
                no_display: false,
                day_count: true,
                one_per: true,
                edit_name: false,
                edit_count: true,
                display_string: '%count% Tag|Tage %name% à %price%',
                display_order: 5,
                price_lookup: 'fullpension',
                price: 29.0,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'Pauschale à 19%',
                category: 'Plan',
                bill_code: configService.constants.bcPlanDiverses,
                guest: '',
                room: 0,
                per_room: false,
                per_person: false,
                no_delete: false,
                no_display: false,
                day_count: false,
                one_per: false,
                edit_name: true,
                low_tax_rate: false,
                display_string: '%name%',
                display_order: 6,
                price: 0,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'Pauschale à 7%',
                category: 'Plan',
                bill_code: configService.constants.bcPlanDiverses,
                guest: '',
                room: 0,
                per_room: false,
                per_person: false,
                no_delete: false,
                no_display: false,
                day_count: false,
                one_per: false,
                edit_name: true,
                low_tax_rate: true,
                display_string: '%name%',
                display_order: 7,
                price: 0,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'Telephone',
                category: 'Plan',
                bill_code: configService.constants.bcPlanDiverses,
                guest: '',
                room: 0,
                per_room: true,
                per_person: false,
                no_delete: false,
                no_display: false,
                day_count: false,
                one_per: false,
                edit_count: true,
                edit_name: false,
                bus_pauschale: true,
                display_string: 'Telefon: %count% Einheiten à %price%',
                display_order: 3,
                price_lookup: 'telephone',
                price: 0,
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
                display_string: '%count% Parkgebühr à %price%',
                display_order: 1,
                price: -1,
                count: 1
              },function(err){if (err)console.log(err)});
              */
              Itemtype.create({
                name: 'Classic Mineralwasser 0,2l',
                category: 'Getränke',
                bill_code: configService.constants.bcDrink,
                guest: '',
                room: 0,
                per_room: false,
                per_person: false,
                no_delete: false,
                no_display: false,
                day_count: false,
                one_per: false,
                edit_name: false,
                edit_count: true,
                display_string: '%count% %name% à %price%',
                display_order: 1,
                price: 1.5,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'Distelhäuser Landbier dunkel 0,5l',
                category: 'Getränke',
                bill_code: configService.constants.bcDrink,
                guest: '',
                room: 0,
                per_room: false,
                per_person: false,
                no_delete: false,
                no_display: false,
                day_count: false,
                one_per: false,
                edit_name: false,
                edit_count: true,
                display_string: '%count% %name% à %price%',
                display_order: 1,
                price: 2.1,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'Kuchen',
                category: 'Speisen',
                bill_code: configService.constants.bcFood,
                guest: '',
                room: 0,
                per_room: false,
                per_person: false,
                no_delete: false,
                no_display: false,
                day_count: false,
                one_per: false,
                edit_name: false,
                edit_count: true,
                display_string: '%count% %name% à %price%',
                display_order: 1,
                price: 2.0,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'Erdnüsse',
                category: 'Speisen',
                bill_code: configService.constants.bcFood,
                guest: '',
                room: 0,
                per_room: false,
                per_person: false,
                no_delete: false,
                no_display: false,
                day_count: false,
                one_per: false,
                edit_name: false,
                edit_count: true,
                display_string: '%count% %name% à %price%',
                display_order: 1,
                price: 1.0,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'Großmassage 30 Minuten',
                category: 'Dienste',
                bill_code: configService.constants.bcKur,
                guest: '',
                room: 0,
                per_room: false,
                per_person: false,
                no_delete: false,
                no_display: false,
                day_count: false,
                one_per: false,
                edit_name: false,
                edit_count: true,
                low_tax_rate: true,
                display_string: '%count% %name% à %price%',
                display_order: 1,
                price: 19,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'Aromaöl',
                category: 'Dienste',
                bill_code: configService.constants.bcKur,
                guest: '',
                room: 0,
                per_room: false,
                per_person: false,
                no_delete: false,
                no_display: false,
                day_count: false,
                one_per: false,
                edit_name: false,
                edit_count: true,
                low_tax_rate: true,
                display_string: '%count% %name% à %price%',
                display_order: 1,
                price: 2,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'X1501 Fangopackungen',
                category: 'VDAK',
                bill_code: configService.constants.bcKur,
                guest: '',
                room: 0,
                per_room: false,
                per_person: true,
                no_delete: false,
                no_display: false,
                day_count: false,
                one_per: false,
                edit_name: false,
                edit_count: true,
                low_tax_rate: true,
                display_string: '%count% %name% à %price%',
                display_order: 1,
                price: 8.19,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'X1712 Gashaltiges Bad mit Zusatz',
                category: 'VDAK',
                bill_code: configService.constants.bcKur,
                guest: '',
                room: 0,
                per_room: false,
                per_person: true,
                no_delete: false,
                no_display: false,
                day_count: false,
                one_per: false,
                edit_name: false,
                edit_count: true,
                low_tax_rate: true,
                display_string: '%count% %name% à %price%',
                display_order: 1,
                price: 15.5,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'X0106 Klassische Massage',
                category: 'VDAK',
                bill_code: configService.constants.bcKur,
                guest: '',
                room: 0,
                per_room: false,
                per_person: false,
                no_delete: false,
                no_display: false,
                day_count: false,
                one_per: false,
                edit_name: false,
                edit_count: true,
                low_tax_rate: true,
                display_string: '%count% %name% à %price%',
                display_order: 1,
                price: 14.06,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'X1501 Warmpackung mit Paraffin',
                category: 'AOK & Andere',
                bill_code: configService.constants.bcKur,
                guest: '',
                room: 0,
                per_room: false,
                per_person: false,
                no_delete: false,
                no_display: false,
                day_count: false,
                one_per: false,
                edit_name: false,
                edit_count: true,
                low_tax_rate: true,
                display_string: '%count% %name% à %price%',
                display_order: 1,
                price: 8.16,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'X0106 Klassische Massage',
                category: 'AOK & Andere',
                bill_code: configService.constants.bcKur,
                guest: '',
                room: 0,
                per_room: false,
                per_person: false,
                no_delete: false,
                no_display: false,
                day_count: false,
                one_per: false,
                edit_name: false,
                edit_count: true,
                low_tax_rate: true,
                display_string: '%count% %name% à %price%',
                display_order: 1,
                price: 10.51,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'Klassische Massagetherapie',
                category: 'Privat',
                bill_code: configService.constants.bcKur,
                guest: '',
                room: 0,
                per_room: false,
                per_person: false,
                no_delete: false,
                no_display: false,
                day_count: false,
                one_per: false,
                edit_name: false,
                edit_count: true,
                low_tax_rate: true,
                display_string: '%count% %name% à %price%',
                display_order: 1,
                price: 16,
                count: 1
              }, function (err) {
                if (err)console.log(err)
              });
              Itemtype.create({
                name: 'Großmassage 30 Minuten',
                category: 'Privat',
                bill_code: configService.constants.bcKur,
                guest: '',
                room: 0,
                per_room: false,
                per_person: false,
                no_delete: false,
                no_display: false,
                day_count: false,
                one_per: false,
                edit_name: false,
                edit_count: true,
                low_tax_rate: true,
                display_string: '%count% %name% à %price%',
                display_order: 1,
                price: 19,
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
               display_string: '%count% %name% à %price%',
               display_order: 1,
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
                display_string: '%nights% Tag|Tage %name% à %roomprice%',
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
                display_string: '%nights% Tag|Tage %name% à %roomprice%',
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
                display_string: '%duration% Tag|Tage %name% %perPerson%',
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
                display_string: '%nights% Tag|Tage %name% à %roomprice%',
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
                display_string: '%nights% Tag|Tage %name% à %roomprice%',
                required_items: ['BusZimmer']
              },function(err){if (err)console.log(err)});
              RoomPlan.create({
                name: 'Kur und Unterkunft mit Frühstück im Einzelzimmer',
                resTypeFilter: ['Kur'],
                is_default: true,
                is_plan: false,
                is_group: false,
                one_bill: false,
                one_room: true,
                single_only: true,
                double_only: false,
                second_guest: false,
                needs_firm: false,
                needs_insurance: true,
                includes_breakfast: true,
                display_string: '%nights% Tag|Tage %name% à %roomprice%',
                required_items: ['Zimmer']
              },function(err){if (err)console.log(err)});
              RoomPlan.create({
                name: 'Kur und Unterkunft mit Frühstück im Doppelzimmer',
                resTypeFilter: ['Kur'],
                is_plan: false,
                is_group: false,
                one_bill: false,
                one_room: true,
                single_only: false,
                double_only: true,
                second_guest: true,
                needs_firm: false,
                needs_insurance: true,
                includes_breakfast: true,
                display_string: '%nights% Tag|Tage %name% à %roomprice%',
                required_items: ['Zimmer']
              },function(err){if (err)console.log(err)});
              RoomPlan.create({
                name: 'Der Kur-Klassiker Std. Zimmer',
                resTypeFilter: ['Kur'],
                is_default: false,
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
                name: '7 Tage mit Kneipp',
                resTypeFilter: ['Kur'],
                is_default: false,
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
                pp_price: 535,
                single_surcharge: 35,
                duration: 7,
                display_string: '%name% %perPerson%',
                required_items: ['ZimmerKurKneipp', 'HalbpensionInc', 'Kneippgüsse', 'Kräuterbad-Kneipp', 'Blitzguss-Kneipp', 'Kopfmassage-Kneipp', 'Heublumensack-Kneipp', 'Stadtführung']
              },function(err){if (err)console.log(err)});
              RoomPlan.create({
                name: '7 Tage Körner-Kur',
                resTypeFilter: ['Kur'],
                is_default: false,
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
                pp_price: 532,
                single_surcharge: 67,
                duration: 7,
                display_string: '%name% %perPerson%',
                required_items: ['ZimmerKörnerKur', 'VollpensionInc', 'Stadtführung']
              },function(err){if (err)console.log(err)});
              RoomPlan.create({
                name: 'Geschäftsgruppe',
                resTypeFilter: ['Gruppe'],
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
                display_string: '%nights% Tag|Tage Übernachtung im %roomType% à %roomPrice%',
                required_items: ['BusZimmer']
              },function(err){if (err)console.log(err)});
              RoomPlan.create({
                name: 'Reisegruppe',
                resTypeFilter: ['Gruppe'],
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
                display_string: '%nights% Tag|Tage Unterkunft mit Frühstück  (%occupants% Person|Personen - %roomCnt% Zimmer)',
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
                name: 'Res. Platz',
                resource_type: 'Parkplatz',
                display_order: 1,
                display_name: 'Res. Pl.',
                price: 3
              }, function (err) {
                if (err)console.log(err)
              });
              Resource.create({
                name: 'Parkplatz 2',
                resource_type: 'Parkplatz',
                display_order: 2,
                display_name: 'Pl. 2',
                price: 3
              }, function (err) {
                if (err)console.log(err)
              });
              Resource.create({
                name: 'Parkplatz 3',
                resource_type: 'Parkplatz',
                display_order: 3,
                display_name: 'Pl. 3',
                price: 3
              }, function (err) {
                if (err)console.log(err)
              });
              Resource.create({
                name: 'Parkplatz 4',
                resource_type: 'Parkplatz',
                display_order: 4,
                display_name: 'Pl. 4',
                price: 3
              }, function (err) {
                if (err)console.log(err)
              });
              Resource.create({
                name: 'Parkplatz 5',
                resource_type: 'Parkplatz',
                display_order: 5,
                display_name: 'Pl. 5',
                price: 3
              }, function (err) {
                if (err)console.log(err)
              });
              Resource.create({
                name: 'Parkplatz 6',
                resource_type: 'Parkplatz',
                display_order: 6,
                display_name: 'Pl. 6',
                price: 3
              }, function (err) {
                if (err)console.log(err)
              });
              Resource.create({
                name: 'Parkplatz 7',
                resource_type: 'Parkplatz',
                display_order: 7,
                display_name: 'Pl. 7',
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
                price: 57
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 3,
                room_type: 'Einzelzimmer',
                room_class: 'Komfort',
                price: 66
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 4,
                room_type: 'Einzelzimmer',
                room_class: 'Standart',
                price: 61
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 5,
                room_type: 'Einzelzimmer',
                room_class: 'Economy',
                price: 57
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 6,
                room_type: 'Einzelzimmer',
                room_class: 'Komfort',
                price: 66
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 7,
                room_type: 'Einzelzimmer',
                room_class: 'Komfort',
                price: 66
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 9,
                room_type: 'Doppelzimmer',
                room_class: 'Economy',
                price: 94
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 10,
                room_type: 'Einzelzimmer',
                room_class: 'Economy',
                price: 57
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 12,
                room_type: 'Einzelzimmer',
                room_class: 'Komfort',
                price: 66
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 15,
                room_type: 'Einzelzimmer',
                room_class: 'Komfort',
                price: 66
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 18,
                room_type: 'Doppelzimmer',
                room_class: 'Komfort',
                price: 109
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 19,
                room_type: 'Doppelzimmer',
                room_class: 'Komfort',
                price: 109
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 20,
                room_type: 'Einzelzimmer',
                room_class: 'Economy',
                price: 57
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 21,
                room_type: 'Suite',
                room_class: '',
                price: 125
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 26,
                room_type: 'Suite',
                room_class: '',
                price: 125
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 27,
                room_type: 'Suite',
                room_class: 'Balkon',
                price: 130
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 31,
                room_type: 'Einzelzimmer',
                room_class: 'Standart',
                price: 61
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 32,
                room_type: 'Einzelzimmer',
                room_class: 'Standart',
                price: 61
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 33,
                room_type: 'Einzelzimmer',
                room_class: 'Standart',
                price: 61
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 34,
                room_type: 'Einzelzimmer',
                room_class: 'Standart',
                price: 61
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 35,
                room_type: 'Doppelzimmer',
                room_class: 'Komfort',
                price: 109
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 41,
                room_type: 'Einzelzimmer',
                room_class: 'Standart',
                price: 61
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 42,
                room_type: 'Einzelzimmer',
                room_class: 'Standart',
                price: 61
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 43,
                room_type: 'Einzelzimmer',
                room_class: 'Standart',
                price: 61
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 44,
                room_type: 'Einzelzimmer',
                room_class: 'Standart',
                display_order: 1,
                price: 61
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 45,
                room_type: 'Doppelzimmer',
                room_class: 'Komfort',
                price: 109
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 46,
                room_type: 'Doppelzimmer',
                room_class: 'Komfort',
                price: 109
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 47,
                room_type: 'Doppelzimmer',
                room_class: 'Komfort',
                price: 109
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 48,
                room_type: 'Doppelzimmer',
                room_class: 'Komfort',
                price: 109
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 51,
                room_type: 'Einzelzimmer',
                room_class: 'Standart',
                price: 61
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 52,
                room_type: 'Einzelzimmer',
                room_class: 'Standart',
                price: 61
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 53,
                room_type: 'Doppelzimmer',
                room_class: 'Komfort',
                price: 109
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 54,
                room_type: 'Einzelzimmer',
                room_class: 'Standart',
                price: 61
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 55,
                room_type: 'Einzelzimmer',
                room_class: 'Standart',
                price: 61
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 56,
                room_type: 'Einzelzimmer',
                room_class: 'Standart',
                price: 61
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 57,
                room_type: 'Einzelzimmer',
                room_class: 'Standart',
                price: 61
              }, function (err) {
                if (err)console.log(err)
              });
              Room.create({
                number: 58,
                room_type: 'Doppelzimmer',
                room_class: 'Komfort',
                price: 109
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

          // Listen for specific menu events and respond by navigating to a particular state.
          $scope.$on('export-tax', function (e, menu, item) {
            $state.go('export_tax');
          });

          $scope.$on('export-one', function (e, menu, item) {
            $state.go('export_one');
          });

          $scope.$on('export-all', function (e, menu, item) {
            $state.go('export_all');
          });

          $scope.$on('import-one', function (e, menu, item) {
            $state.go('import_one');
          });

           $scope.$on('import-all', function (e, menu, item) {
            $state.go('import_all');
          });

          $scope.$on('close-app', function (e, menu, item) {
            $state.go('close_app');
          });

          // Completed all start activity, broadcast the fact that we are ready
          $timeout(function () {
            $rootScope.$broadcast(configService.constants.appReadyEvent, {});
            console.log("app.js complete");
          }, 400);
        }]);
});
