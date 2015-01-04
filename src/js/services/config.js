/*
 * Configuration service. Provides methods to get and set local storage variables. Also provides objects containing
 * global constants and text strings for the UI.
 */
define(['./module'], function (services) {
  'use strict';

  services.service('configService', ['$q', 'AppConstants', function ($q, AppConstants) {
    var _this = this;
    this.get = function (key, defVal) {
      var _this = this;
      var val = localStorage.getItem(key);
      if (!val && defVal) {
        val = defVal;
        _this.set(key, defVal);
      }
      return $q.when(val);
    };

    this.set = function (key, val) {
      return $q.when(localStorage.setItem(key, val));
    };

    // Object that contains system-wide constants, any constants that are programatic and can't be changed by the user
    // Are defined here first. This object is then updated by a call to the AppConstants collection. That collection
    // contains the application constants that the UI can expose for the propose of updating the constant value.
    // The constants prefaced by 'bc' are used to sub-categorize the expenense items for display in the proper
    // bill section.
    this.constants = {
      autoCloseTime: 2000,
      expensesChangedEvent: 'EXP_EVENT1',  // event names
      reservationChangedEvent: 'RES_EVENT1',
      roomPlanClickEvent: 'ZPLAN_EVENT1',
      appReadyEvent: '', // broadcast when app.js finishes.
      bcRoom: 0,
      bcPackageItem: 1,
      bcExtraRoom: 2,
      bcMeals: 3,
      bcResources: 4,
      bcKurTax: 5,
      bcPlanDiverses: 6,
      bcFoodDrink: 7,
      bcKur: 8,


      // Method to retrieve value of the specified constant. (For programmatic retrieval of constant value.)
      get: function (constName) {
        if (this.hasOwnProperty(constName)) {
          return this[constName];
        }
        else {
          return undefined;
        }
      }
    };

    // An object that contains the various text strings for the UI views, forms and directives
    // The purpose is to have the standard text items all in one place.
    this.loctxt = {
      //'': '',
      'accommodation': 'Unterkunft',
      'add': 'Hinzufügen',
      'address1': 'Adresse 1',
      'address2': 'Adresse 2',
      'aggregatePersonDisplayString': '%text% für %icount% Personen',
      'aggregateRoomDisplayString': '%text% (%icount% Zimmer - %guestCnt% Gäste)',
      'arrive': 'Ankunft',
      'birthday': 'Geburtstag',
      'breakfast': 'Frühstück',
      'breakfastInc': 'FrühstückInc',
      'calendar': 'Kalender',
      'cancel': 'Abbrechen',
      'charges': 'Gebühren',
      'chargesFor': 'Gebühren für',
      'checkin': 'Check-in',
      'checkout': 'Kasse',
      'city': 'Ort',
      'cityTax': 'Kurtaxe',
      'clear': 'Löschen',
      'close': 'Schließen',
      'comments': 'Bemerkung',
      'confirmDelete': 'Löschen bestätigen',
      'contact': 'Kontakt',
      'contact_email': 'Kontakt E-Mail',
      'contact_name': 'Kontakt Name',
      'contact_tel': 'Kontakt Tf.',
      'country': 'Land',
      'cureAndTreatment': 'Kur-und Heilmittel',
      'currentReservations': 'Aktuelle Reservierungen',
      'cure': 'Kur',
      'day': 'Tag',
      'days': 'Tage',
      'daysTimes': 'Tage / Mal',
      'delete': 'Löschen',
      'DietAndAccommodation': 'Diätkost und Unterkunft',
      'double': 'Doppel',
      'edit': 'Bearbeiten',
      'email': 'E-Mail',
      'expenseItemErr1': 'Expense Artikel, Zimmer oder Gastnamen nicht vorgesehen.',
      'expenseItemErr2': 'Expense Artikel nicht gefunden',
      'extra_day': 'tag Extra',
      'extra_days': 'tage Extra',
      'extra_days_item': 'Extra Tage',
      'firmName': 'Firma Name',
      'firm': 'Firma',
      'firm_titleCreate': 'Firma Informationen Erstellen',
      'firm_titleDelete': 'Firma Informationen Löschen',
      'firm_titleRead': 'Informationen zur Firma',
      'firm_titleUpdate': 'Firma Informationen Bearbeiten',
      'firstName': 'Vorname',
      'forTwoPeople': 'für 2 Personen',
      'free': 'Frei',
      'from': 'Von',
      'fullPension': 'Vollpension',
      'fullPensionInc': 'VollpensionInc',
      'guest': 'Gast',
      'guest2': 'Gast 2',
      'guests': 'Gäste',
      'guestCount': 'Gäste Anzahl',
      'guest_titleCreate': 'Gast Informationen Erstellen',
      'guest_titleDelete': 'Gast Informationen Löschen',
      'guest_titleEdit': 'Gast Informationen Bearbeiten',
      'guest_titleRead': 'Informationen zur Gast',
      'halfPension': 'Halbpension',
      'halfPensionInc': 'HalbpensionInc',
      'insurance': 'Krankenkasse',
      'item': 'Artikel',
      'item_notFound': 'Artikel nicht gefunden',
      'lastName': 'Nachname',
      'leave': 'Abfahrt',
      'miscellaneous': 'Diverses',
      'night': 'Nacht',
      'nights': 'Nächte',
      'no': 'Kein',
      'no_lc': '<keine>',
      'noParkPlace': 'Kein Parkplatz',
      'noRoom': 'Kein Zimmer',
      'notFound': 'nicht gefunden',
      'ok': 'Ok',
      'onlyOneInRoom': 'Nur ein im Doppelzimmer',
      'open': 'Öffnen',
      'parkPlace': 'Parkplatz',
      'perPersonAbrv': 'p.P.',
      'postCode': 'PLZ',
      'price': 'Preis',
      'priceSymbol': '€',
      'reservation': 'Reservierung',
      'reservation_titleCreate': 'Reservierung Informationen Erstellen',
      'reservation_titleDelete': 'Reservierung Informationen Löschen',
      'reservation_titleEdit': 'Reservierung Informationen Bearbeiten',
      'reservation_titleRead': 'Informationen zur Reservierung',
      'reservationType': 'Res. Typ',
      'room': 'Zimmer',
      'roomAbrv': 'Zi.',
      'roommate': 'Zimmergenosse',
      'roomNumber': 'Zimmernummer',
      'roomNumberAbrv': 'ZN',
      'roomPlan': 'Zimmer Plan',
      'roomPrice': 'Zimmer Preis',
      'roomsFree': 'Frei Zimmer',
      'salutation': 'Anrede',
      'selected': 'Ausgewählt',
      'selectedRoom': 'Gewählte Zi.',
      'select': 'Auswählen',
      'selectParkPlace': 'Parkplatz auswählen',
      'selectRoom': 'Zimmer auswählen',
      'selectRoomPlan': 'Zimmer plan auswählen',
      'single': 'Einzel',
      'source': 'Quelle',
      'status': 'Status',
      'stay': 'Bleiben',
      'success_deleted': ' erfolgreich gelöscht',
      'success_saved': ' erfolgreich gespeichert',
      'success_changes_saved': 'Veränderungen erfolgreich gespeichert',
      'telephone': 'Telefonnummer',
      'times': 'Mal',
      'today': 'Heute',
      'total': 'Sum',
      'until': 'Bis',
      'update': 'Aktualisieren',
      'val_invalidPlan': 'You must select a Room Plan',
      'val_invalidGuest': 'Missing or invalid Guest',
      'val_invalidFirm': 'Missing or invalid Firm',
      'val_invalidRoom': 'At least one room is required',
      'val_invalidDates': 'Missing or invalid Reservation dates',
      'val_invalidInsurance': 'An insurance plan must be selected',
      'week_plan_for': 'Wochen Plan für',
      'xxx': '***'
    };

    // Kalendar month and day names and abbreviations
    this.calendarInfo = {
      months: ['Januar', 'Febuar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
      monthsAbrv: ['Januar', 'Febuar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
      days: ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'],
      daysAbrv: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
      daysDe: ['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'],
      daysAbrvDe: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
    };
    // Constructor actions - populate the constants object with the constants defined in the AppConstants collection
    // This action gives precedence to the string value of a constant. If it is defined then it is choosen, else the
    // numeric value is chosen.
    AppConstants.find()
        .exec(function (err, constants) {
          if (err) {
            console.log("Failed to retrieve constants!"); //Major error program will not function correctly!!!
          }
          else {
            angular.forEach(constants, function (constant){
              if (constant.svalue) {
                _this.constants[constant.name] = constant.svalue;
              }
              else {
                _this.constants[constant.name] = constant.nvalue;
              }
            });
          }
        });
  }]);
});
