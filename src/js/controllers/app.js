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
        function ($scope, $rootScope, db, Firm, Guest, Reservation, Resource,
                  Room, Itemtype, RoomPlan, AppConstants, configService, datetime,
                  $state) {
          //var gui = nw.guirequire('nw.gui');
          var zoomPercent = 100,
              win = nw.Window.get(),
              taskCnt = 0,
              MAX_TASKS = 5;

          console.log("App controller fired");
          // Set the saved date for the home page room plan to the current date
          configService.set('planDate', datetime.dateOnly(new Date()));

          // add global keyboard shortcuts
          var refreshShortcut = new nw.Shortcut({
            key : "Ctrl+Shift+R",
            active : function() {
              console.log("Global desktop keyboard shortcut: " + this.key + " active.");
              win.reloadDev();

            },
            failed : function(msg) {
              // :(, fail to register the |key| or couldn't parse the |key|.
              console.log(msg);
            }
          });
          var devBarShortcut = new nw.Shortcut({
            key : "Ctrl+Shift+D",
            active : function() {
              console.log("Global desktop keyboard shortcut: " + this.key + " active.");
              win.showDevTools();

            },
            failed : function(msg) {
              // :(, fail to register the |key| or couldn't parse the |key|.
              console.log(msg);
            }
          });
          var zoomOutShortcut = new nw.Shortcut({
            key : "Ctrl+Shift+O",
            active : function() {
              console.log("Global desktop keyboard shortcut: " + this.key + " active.");
              zoomPercent += 10;
              win.zoomLevel = Math.log(zoomPercent/100) / Math.log(1.2);

            },
            failed : function(msg) {
              // :(, fail to register the |key| or couldn't parse the |key|.
              console.log(msg);
            }
          });
          var zoomInShortcut = new nw.Shortcut({
            key : "Ctrl+Shift+I",
            active : function() {
              console.log("Global desktop keyboard shortcut: " + this.key + " active.");
              zoomPercent -= 10;
              win.zoomLevel = Math.log(zoomPercent/100) / Math.log(1.2);

            },
            failed : function(msg) {
              // :(, fail to register the |key| or couldn't parse the |key|.
              console.log(msg);
            }
          });
          nw.App.registerGlobalHotKey(refreshShortcut);
          nw.App.registerGlobalHotKey(devBarShortcut);
          nw.App.registerGlobalHotKey(zoomOutShortcut);
          nw.App.registerGlobalHotKey(zoomInShortcut);

          //$tooltipProvider.options({});

          // Listen for specific menu events and respond by navigating to a particular state.
          $scope.$on('export-tax', function (e, menu, item) {
            $state.go('export_tax');
          });
          
          $scope.$on('export-address', function (e, menu, item) {
            $state.go('export_address');
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

          // Add base db collections if needed.  This must be at end of module

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
              }, function (err) {
                if (err) console.log(err);
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
              console.log("App Constants collection contains %d records", count);
            }
            Room.count(function (err, count) {
              if (count === 0) {
                console.log("Creating Room collection");
                Room.create({
                  number: 2,
                  room_type: 'Einzelzimmer',
                  room_class: 'Standart',
                  price: 64
                }, {
                  number: 3,
                  room_type: 'Einzelzimmer',
                  room_class: 'Komfort',
                  price: 69
                }, {
                  number: 4,
                  room_type: 'Einzelzimmer',
                  room_class: 'Standart',
                  price: 64
                }, {
                  number: 5,
                  room_type: 'Einzelzimmer',
                  room_class: 'Economy',
                  price: 58
                }, {
                  number: 6,
                  room_type: 'Einzelzimmer',
                  room_class: 'Komfort',
                  price: 69
                }, {
                  number: 7,
                  room_type: 'Einzelzimmer',
                  room_class: 'Komfort',
                  price: 69
                }, {
                  number: 9,
                  room_type: 'Doppelzimmer',
                  room_class: 'Standart',
                  price: 94
                }, {
                  number: 10,
                  room_type: 'Einzelzimmer',
                  room_class: 'Economy',
                  price: 58
                }, {
                  number: 12,
                  room_type: 'Einzelzimmer',
                  room_class: 'Komfort',
                  price: 69
                }, {
                  number: 15,
                  room_type: 'Einzelzimmer',
                  room_class: 'Komfort',
                  price: 69
                }, {
                  number: 18,
                  room_type: 'Doppelzimmer',
                  room_class: 'Komfort',
                  price: 109
                }, {
                  number: 19,
                  room_type: 'Doppelzimmer',
                  room_class: 'Komfort',
                  price: 109
                }, {
                  number: 20,
                  room_type: 'Einzelzimmer',
                  room_class: 'Economy',
                  price: 58
                }, {
                  number: 21,
                  room_type: 'Suite',
                  room_class: 'Komfort',
                  price: 130
                }, {
                  number: 26,
                  room_type: 'Suite',
                  room_class: 'Komfort',
                  price: 140
                }, {
                  number: 27,
                  room_type: 'Suite',
                  room_class: 'Balkon',
                  price: 140
                }, {
                  number: 31,
                  room_type: 'Einzelzimmer',
                  room_class: 'Standart',
                  price: 64
                }, {
                  number: 32,
                  room_type: 'Einzelzimmer',
                  room_class: 'Standart',
                  price: 64
                }, {
                  number: 33,
                  room_type: 'Einzelzimmer',
                  room_class: 'Standart',
                  price: 64
                }, {
                  number: 34,
                  room_type: 'Einzelzimmer',
                  room_class: 'Standart',
                  price: 64
                }, {
                  number: 35,
                  room_type: 'Doppelzimmer',
                  room_class: 'Komfort',
                  price: 109
                }, {
                  number: 41,
                  room_type: 'Einzelzimmer',
                  room_class: 'Standart',
                  price: 64
                }, {
                  number: 42,
                  room_type: 'Einzelzimmer',
                  room_class: 'Standart',
                  price: 64
                }, {
                  number: 43,
                  room_type: 'Einzelzimmer',
                  room_class: 'Standart',
                  price: 64
                }, {
                  number: 44,
                  room_type: 'Einzelzimmer',
                  room_class: 'Standart',
                  display_order: 1,
                  price: 64
                }, {
                  number: 45,
                  room_type: 'Doppelzimmer',
                  room_class: 'Komfort',
                  price: 109
                }, {
                  number: 46,
                  room_type: 'Doppelzimmer',
                  room_class: 'Komfort',
                  price: 109
                }, {
                  number: 47,
                  room_type: 'Doppelzimmer',
                  room_class: 'Komfort',
                  price: 109
                }, {
                  number: 48,
                  room_type: 'Doppelzimmer',
                  room_class: 'Komfort',
                  price: 109
                }, {
                  number: 51,
                  room_type: 'Einzelzimmer',
                  room_class: 'Standart',
                  price: 64
                }, {
                  number: 52,
                  room_type: 'Einzelzimmer',
                  room_class: 'Standart',
                  price: 64
                }, {
                  number: 53,
                  room_type: 'Doppelzimmer',
                  room_class: 'Komfort',
                  price: 109
                }, {
                  number: 54,
                  room_type: 'Einzelzimmer',
                  room_class: 'Standart',
                  price: 64
                }, {
                  number: 55,
                  room_type: 'Einzelzimmer',
                  room_class: 'Standart',
                  price: 64
                }, {
                  number: 56,
                  room_type: 'Einzelzimmer',
                  room_class: 'Standart',
                  price: 64
                }, {
                  number: 57,
                  room_type: 'Einzelzimmer',
                  room_class: 'Standart',
                  price: 61
                }, {
                  number: 58,
                  room_type: 'Doppelzimmer',
                  room_class: 'Komfort',
                  price: 109
                }, function (err) {
                  if (err) console.log(err)
                });
              }
              else {
                console.log("Room collection contains %d records", count);
              }
              Resource.count(function (err, count) {
                if (count === 0) {
                  console.log("Creating Resource collection");
                  Resource.create({
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
                  }, function (err) {
                    if (err)console.log(err)
                  });
                }
                else {
                  console.log("Resource collection contains %d records", count);
                }
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
                      requires_kurtax: true,
                      display_string: '%nights% Tag|Tage %name% à %roomprice%',
                      required_items: []
                    },{
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
                      requires_kurtax: true,
                      display_string: '%nights% Tag|Tage %name% à %roomprice%',
                      required_items: []
                    },{
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
                      bus_breakfast: true,
                      requires_kurtax: false,
                      display_string: '%nights% Tag|Tage %name% à %roomprice%',
                      required_items: []
                    },{
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
                      bus_breakfast: true,
                      requires_kurtax: false,
                      display_string: '%nights% Tag|Tage %name% à %roomprice%',
                      required_items: []
                    },{
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
                      requires_kurtax: true,
                      display_string: '%nights% Tag|Tage %name% à %roomprice%',
                      required_items: []
                    },{
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
                      requires_kurtax: true,
                      display_string: '%nights% Tag|Tage %name% à %roomprice%',
                      required_items: []
                    },{
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
                      bus_breakfast: true,
                      requires_kurtax: false,
                      display_string: '%nights% Tag|Tage Übernachtung im %roomType% à %roomPrice%',
                      required_items: []
                    },{
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
                      requires_kurtax: true,
                      display_string: '%nights% Tag|Tage Unterkunft mit Frühstück  (%occupants% Person|Personen - %roomCnt% Zimmer)',
                      required_items: []
                    },{
                      name: 'Private Gruppe',
                      resTypeFilter: ['Gruppe'],
                      is_plan: false,
                      is_group: true,
                      one_bill: true,
                      one_room: false,
                      single_only: false,
                      double_only: false,
                      second_guest: false,
                      needs_firm: false,
                      needs_insurance: false,
                      includes_breakfast: true,
                      requires_kurtax: true,
                      display_string: '%nights% Tag|Tage Unterkunft mit Frühstück  (%occupants% Person|Personen - %roomCnt% Zimmer)',
                      required_items: []
                    },
                        {  //package plans
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
                      requires_kurtax: true,
                      pp_price: 153,
                      single_surcharge: 22,
                      single_room_price: 53.3349, // times 3 rounds up to 175.00
                      double_room_price: 51.0, //per person
                      duration: 3,
                      display_string: '%duration% Tage %name% %perPerson%',
                      required_items: []
                    },{
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
                      requires_kurtax: true,
                      pp_price: 330,
                      single_surcharge: 35,
                      single_room_price: 53.53,
                      double_room_price: 47.6967, //per person
                      duration: 6,
                      display_string: '%duration% Tag|Tage %name% %perPerson%',
                      required_items:  [{
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
                      },{
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
                      }, {
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
                      }, {
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
                      }, {
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
                      }]
                    },{
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
                      requires_kurtax: true,
                      pp_price: 1056,
                      single_surcharge: 154,
                      single_room_price: 53.53,
                      double_room_price: 46.2, //per person
                      duration: 14,
                      display_string: '%duration% Tage %name% %perPerson%',
                      required_items: [{
                        name: configService.loctxt.halfPensionInc,
                        category: 'Plan',
                        bill_code: configService.constants.bcPackageItem,
                        guest: '',
                        room: 0,
                        is_system: true,
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
                        price_lookup: 'halfpension',
                        price: 0,
                        count: 1
                      },{
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
                      }, {
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
                      }, {
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
                      }, {
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
                      }]
                    },{
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
                      requires_kurtax: true,
                      pp_price: 1151,
                      single_surcharge: 129,
                      single_room_price: 58.53,
                      double_room_price: 53.0, //per person
                      duration: 14,
                      display_string: '%duration% Tage %name% %perPerson%',
                      required_items: [{
                        name: configService.loctxt.halfPensionInc,
                        category: 'Plan',
                        bill_code: configService.constants.bcPackageItem,
                        guest: '',
                        room: 0,
                        is_system: true,
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
                        price_lookup: 'halfpension',
                        price: 0,
                        count: 1
                      },{
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
                      }, {
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
                      }, {
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
                      }, {
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
                      }]
                    }, function(err){if (err)console.log(err)});
                  }
                  else {
                    console.log("RoomPlan collection contains %d records", count);
                  }
                  Itemtype.count(function (err, count) {
                    if (count === 0) {
                      Itemtype.create({ //system required items.
                        name: configService.loctxt.halfPensionInc,
                        category: 'Plan',
                        bill_code: configService.constants.bcPackageItem,
                        guest: '',
                        room: 0,
                        is_system: true,
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
                        price_lookup: 'halfpension',
                        price: 0,
                        count: 1
                      }, {
                        name: configService.loctxt.fullPensionInc,
                        category: 'Plan',
                        bill_code: configService.constants.bcPackageItem,
                        guest: '',
                        room: 0,
                        is_system: true,
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
                        price_lookup: 'fullpension',
                        price: 0,
                        count: 1
                      }, {
                        name: configService.loctxt.breakfast,
                        category: 'Plan',
                        bill_code: configService.constants.bcMeals,
                        guest: '',
                        room: 0,
                        is_system: true,
                        per_room: true,
                        per_person: true,
                        no_delete: false,
                        no_display: false,
                        day_count: true,
                        one_per: true,
                        edit_name: false,
                        edit_count: true,
                        bus_pauschale: true,
                        display_string: '%count% %name% à %price%',
                        display_order: 2,
                        price_lookup: 'breakfast',
                        price: 0,
                        count: 1
                      }, {
                        name: configService.loctxt.halfPension,
                        category: 'Plan',
                        bill_code: configService.constants.bcMeals,
                        guest: '',
                        room: 0,
                        is_system: true,
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
                        price: .0,
                        count: 1
                      }, {
                        name: configService.loctxt.fullPension,
                        category: 'Plan',
                        bill_code: configService.constants.bcMeals,
                        guest: '',
                        room: 0,
                        is_system: true,
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
                      }, {
                        name: 'Pauschale à 19%',
                        category: 'Plan',
                        bill_code: configService.constants.bcPlanDiverses,
                        guest: '',
                        room: 0,
                        is_system: true,
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
                      }, {
                        name: 'Pauschale à 7%',
                        category: 'Plan',
                        bill_code: configService.constants.bcPlanDiverses,
                        guest: '',
                        room: 0,
                        is_system: true,
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
                      }, {
                        name: 'Telephone',
                        category: 'Plan',
                        bill_code: configService.constants.bcPlanDiverses,
                        guest: '',
                        room: 0,
                        is_system: true,
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
                      },{
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
                      }, {
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
                      }, {
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
                      }, {
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
                      }, {
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
                      }, {
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
                      }, {
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
                      }, {
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
                      }, {
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
                      }, {
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
                      },{
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
                      }, {
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
                      }, {
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
                    }
                    else {
                      console.log("Itemtype collection contains %d records", count);
                    }
                    Guest.count(function (err, count) { //don't add records just count to build indices
                      console.log('Guest collection contains %d records', count);
                      Firm.count(function (err, count) {
                        console.log('Firm collection contains %d records', count);
                        // last action in app.js
                        $rootScope.$broadcast(configService.constants.appReadyEvent, {});
                        console.log("app.js complete");
                      });
                    });
                  });
                });
              });
            });
          });
        }]);
});
