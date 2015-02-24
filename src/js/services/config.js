/*
 * Configuration service. Provides methods to get and set local storage variables. Also provides objects containing
 * global constants and text strings for the UI.
 */
define(['./module'], function (services) {
  'use strict';

  // returns object with aplication specific constants
  services.service('appConstants', [function () {
    var appName = 'Alexa Reservations',
        appTitle = 'Hotel Alexa Reservierungssystem',
        tmpPath, dbPath, dbConnStr, defExportPath, zipCmdfn, execPath;

    // Determine the database path and the default export path based on the operating system (mac or windows).
    if (/^win/.test(process.platform)) {
      tmpPath = process.env.TEMP;
      dbPath = process.env.APPDATA + '\\' + appName.replace(' ', '-') + '\\data';
      dbConnStr = 'tingodb://'+ dbPath;
      defExportPath = process.env.HOMEDRIVE + process.env.HOMEPATH + '\\Desktop';
      execPath = process.execPath.replace('nw.exe','');
      zipCmdfn = function (fpath) {
        //execute 7-Zip command line version (in same folder as the nw.exe file. The zip options are as follows:
        // e to expand archive, -aou to quietly add a copy of the expanded file if the old file exists. The
        // copy has a _1 suffix. -o specifies the output path.
        return execPath + '7za e ' + fpath + ' -aou -o' + dbPath;
      }
    }
    else { //assume mac
      tmpPath = process.env.TMPDIR;
      dbPath = process.env.HOME + '/Library/Application Support/' + appName.replace(' ', '-') + '\\data';
      defExportPath = process.env.HOME + '/Desktop';
      execPath = process.env.PWD;
      zipCmdfn = ''; //currently don't have an unzip option for the mac
    }

    return {
      appName: appName,
      appTitle: appTitle,
      tmpPath: tmpPath,
      dbPath: dbPath,
      execPath: execPath,
      dbConnStr: dbConnStr,
      defExportPath: defExportPath,
      zipCommand: zipCmdfn
    };
  }]);

  services.service('configService', ['$q', 'AppConstants', function ($q, AppConstants) {
    var _this = this;


    // methods for accessing local storage
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
      calEventChangedEvent: 'CAL_EVENT_EVENT', // calendar event saved/deleted
      weekButtonsSetEvent: 'WEEK_BTN1',
      appReadyEvent: '', // broadcast when app.js finishes.
      bcRoom: 0,
      bcPackageItem: 1,
      bcExtraRoom: 2,
      bcMeals: 3,
      bcResources: 4,
      bcKurTax: 5,
      bcPlanDiverses: 6,
      bcFood: 7,
      bcDrink: 8,
      bcKur: 9,
      bcKurPackageItem: 10,
      bcKurSpecial: 11, //for copay and prescription charges
      bcDienste: 12, // for other services

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
      'addedKurtaxDisplayString': '%count% Tag|Tage Kurtaxe à %price%',
      'addedExtraDaysDisplayString': '%count% Tag|Tage Extra',
      'aggregatePersonDisplayString': '%text% für %count% Personen',
      'aggregateRoomDisplayString': '%text% (%count% Zimmer - %guestCnt% Gäste)',
      'advancedSettings': 'Erweiterte Einstellungen',
      'arrive': 'Ankunft',
      'bill': 'Rechnung',
      'billCode': 'Rechnung Vorwahl',
      'bills': 'Rechnungen',
      'birthday': 'Geburtstag',
      'breakfast': 'Frühstück',
      'breakfastInc': 'FrühstückInc',
      'busPauschale': 'Business Pauschale',
      'calendar': 'Kalender',
      'cancel': 'Abbrechen',
      'category': 'Kategorie',
      'charges': 'Gebühren',
      'chargesFor': 'Gebühren für',
      'checkin': 'Einchecken',
      'checkout': 'Auschecken',
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
      'copay': 'Eigenanteil',
      'count': 'Anzahl',
      'country': 'Land',
      'credit': 'Kredit',
      'creditForDisplayString': '(%credit% Kredit für %name%)',
      'cureAndTreatment': 'Kur-und Heilmittel',
      'currentReservations': 'Aktuelle Reservierungen',
      'cure': 'Kur',
      'dataExport': 'Daten exportieren',
      'dataImport': 'Daten importieren',
      'day': 'Tag',
      'days': 'Tage',
      'daysTimes': 'Tage / Mal',
      'dbImport': 'Import der kompletten Datenbank',
      'dbExport': 'Export der kompletten Datenbank',
      'delete': 'Löschen',
      'description': 'Beschreibung',
      'dine': 'Speisen',
      'displayString': 'Darstellung String',
      'displayOrder': 'Darstellung Ordnung',
      'DietAndAccommodation': 'Diätkost und Unterkunft',
      'double': 'Doppel',
      'doublePrice': 'Doppel Preis',
      'drink': 'Getränke',
      'edit': 'Bearbeiten',
      'email': 'E-Mail',
      'expenseItemErr1': 'Expense Artikel, Zimmer oder Gastnamen nicht vorgesehen.',
      'expenseItemErr2': 'Expense Artikel nicht gefunden',
      'exporting': 'Exportieren',
      'exportEnded': 'Export erfolgreich beendet',
      'extra_days_item': 'Extra Tage',
      'error': 'Fehler',
      'errorBold': 'FEHLER!',
      'event': 'Veranstaltung',
      'event_titleCreate': 'Veranstaltung Informationen Erstellen',
      'event_titleDelete': 'Veranstaltung Informationen Löschen',
      'event_titleRead': 'Veranstaltung zur Firma',
      'event_titleUpdate': 'Veranstaltung Informationen Bearbeiten',
      'expenseItem': 'Aufwandsposten',
      'expenseItem_titleCreate': 'Aufwandsposten Informationen Erstellen',
      'expenseItem_titleDelete': 'Aufwandsposten Informationen Löschen',
      'expenseItem_titleRead': 'Informationen zur Aufwandsposten',
      'expenseItem_titleUpdate': 'Aufwandsposten Informationen Bearbeiten',
      'extra': 'Extra',
      'firmName': 'Firma Name',
      'firm': 'Firma',
      'firmSearch': 'Firmenname Suche...',
      'firmGuestSearch': 'Gäste mit Firmenname Suche...',
      'firm_titleCreate': 'Firma Informationen Erstellen',
      'firm_titleDelete': 'Firma Informationen Löschen',
      'firm_titleRead': 'Informationen zur Firma',
      'firm_titleUpdate': 'Firma Informationen Bearbeiten',
      'firstName': 'Vorname',
      'forTwoPeople': 'für 2 Personen',
      'free': 'Frei',
      'from': 'Von',
      'fullCityTax': 'Voll Kurtaxe',
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
      'importing':'Importieren',
      'importEnded': 'Import erfolgreich beendet',
      'importWarning': 'Warnung! Diese Aktion wird alle aktuellen Daten zu ersetzen. Wollen Sie weitermachen?',
      'includedInPlan': 'In Plan Preis inbegriffen',
      'insurance': 'Krankenkasse',
      'item': 'Artikel',
      'item_notFound': 'Artikel nicht gefunden',
      'lastName': 'Nachname',
      'lastNameSearch': 'Nachnamen Suche...',
      'leave': 'Abfahrt',
      'minus': 'Minus',
      'miscellaneous': 'Diverses',
      'miscellaneousDetails': 'Diverses Einzelheiten',
      'multiple': 'Mehrere',
      'name': 'Name',
      'night': 'Nacht',
      'nights': 'Nächte',
      'no': 'Kein',
      'noNeg': 'Nein',
      'no_lc': '<keine>',
      'noParkPlace': 'Kein Parkplatz',
      'noRoom': 'Kein Zimmer',
      'notFound': 'nicht gefunden',
      'ok': 'Ok',
      'onlyOneInRoom': 'Nur ein im Doppelzimmer',
      'open': 'Öffnen',
      'parkPlace': 'Parkplatz',
      'parkCharge': 'Parkgebür',
      'perPersonAbrv': 'p.P.',
      'postCode': 'PLZ',
      'prescription_charge': ' Rezeptgebühr',
      'price': 'Preis',
      'priceLookup': 'Preisabfrage',
      'priceSymbol': '€',
      'print': 'Drucken',
      'programRestart': 'Das Programm wird in 5 Sekunden neu starten',
      'recent': 'Kürzlich',
      'resource': 'Ressource',
      'resources': 'Ressourcen',
      'resource_titleCreate': 'Ressource Informationen Erstellen',
      'resource_titleDelete': 'Ressource Informationen Löschen',
      'resource_titleUpdate': 'Ressource Informationen Bearbeiten',
      'resource_titleRead': 'Ressource zur Reservierung',
      'resourceType': 'Ressourcentyp',
      'reduction': 'Ermässigung',
      'reinstate': 'Zurückgeben',
      'reservation': 'Reservierung',
      'reservation_titleCreate': 'Reservierung Informationen Erstellen',
      'reservation_titleDelete': 'Reservierung Informationen Löschen',
      'reservation_titleEdit': 'Reservierung Informationen Bearbeiten',
      'reservation_titleRead': 'Informationen zur Reservierung',
      'reservationType': 'Res. Typ',
      'room': 'Zimmer',
      'room_titleCreate': 'Zimmer Informationen Erstellen',
      'room_titleDelete': 'Zimmer Informationen Löschen',
      'room_titleUpdate': 'Zimmer Informationen Bearbeiten',
      'room_titleRead': 'Zimmer zur Reservierung',
      'roomAbrv': 'Zi.',
      'roomClass': 'Zimmerklasse',
      'roommate': 'Zimmergenosse',
      'roomNumber': 'Zimmernummer',
      'roomNumberAbrv': 'ZN',
      'roomPlan': 'Zimmer Plan',
      'roomPrice': 'Zimmer Preis',
      'roomsFree': 'Frei Zimmer',
      'roomType': 'Zimmertyp',
      'salutation': 'Anrede',
      'selected': 'Ausgewählt',
      'selectedRoom': 'Gewählte Zi.',
      'select': 'Auswählen',
      'selectReservation': 'Wählen Sie eine Reservierung',
      'selectParkPlace': 'Parkplatz auswählen',
      'selectRoom': 'Zimmer auswählen',
      'selectRoomPlan': 'Zimmer plan auswählen',
      'services': 'Dienste',
      'single': 'Einzel',
      'singlePrice': 'Einzel Preis',
      'source': 'Quelle',
      'status': 'Status',
      'stay': 'Bleiben',
      'success_deleted': ' erfolgreich gelöscht',
      'success_saved': ' erfolgreich gespeichert',
      'success_changes_saved': 'Veränderungen erfolgreich gespeichert',
      'telephone': 'Telefonnummer',
      'times': 'Mal',
      'title': 'Titel',
      'toBill': 'Zu Rechnung',
      'toCharges': 'Zu Gebüren',
      'toRoomPlan': 'Zu Zimmer Plan',
      'today': 'Heute',
      'tomorrow': 'Morgen',
      'tomorrowNext':'Übermorgen',
      'total': 'Sum',
      'until': 'Bis',
      'update': 'Aktualisieren',
      'ustRate': 'UST Steuersatz',
      'val_invalidPlan': 'You must select a Room Plan',
      'val_invalidGuest': 'Missing or invalid Guest',
      'val_invalidFirm': 'Missing or invalid Firm',
      'val_invalidRoom': 'At least one room is required',
      'val_invalidDates': 'Missing or invalid Reservation dates',
      'val_invalidInsurance': 'An insurance plan must be selected',
      'val_invalidPlanInsurance': 'The Kur package plan requires "Privat" insurance',
      'wantToEdit': 'This reservation has been checked out. Are you sure you want to edit it?',
      'wantToCheckout': 'The reservation end date is in the future. Are you sure you want to check out now? The reservation end date will NOT be adjusted',
      'wantToDeleteItem': 'Bestätigen Artikel Löschen?',
      'withFirm': 'Mit Firma',
      'withoutFirm': 'Ohne Firma',
      'yes': 'Ja',
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
