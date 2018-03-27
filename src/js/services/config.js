/*
 * Configuration service. Provides methods to get and set local storage variables. Also provides objects containing
 * global constants and text strings for the UI. Alexa MongoDB server ip ??? 192.168.178.44 ???
 */
const mongoose = require('mongoose');

define(['./module'], function (services) {
  'use strict';

  // returns object with application specific constants
  services.service('appConstants', [function () {
    console.log('Defining constants...')
    const pjson = require('./package.json'),
          appName = 'Alexa Reservierungen',
          dataSubPath = 'temp',
          appTitle = 'Hotel Alexa Reservierungssystem';

    let tmpPath, workPath, dbConnStr, defExportPath, execPath, basePath, host, port, database, dbDumpCmd, dbDumpPath;
    // establish db info
    host = pjson.db.host;
    port = pjson.db.port || '27017';
    database = pjson.db.database || 'AlexaDB';
    dbConnStr = `mongodb://${host}:${port}/${database}`;

    

    // Determine the database export working directory and the default export path based on the operating system (mac or windows).
    if (/^win/.test(process.platform)) {
      tmpPath = process.env.TEMP;
      basePath = process.env.APPDATA + '\\' + appName.replace(' ', '-');
      workPath = basePath + '\\' + dataSubPath;
      defExportPath = process.env.HOMEDRIVE + process.env.HOMEPATH + '\\Desktop';
      execPath = process.execPath.replace('nw.exe','');
      dbDumpPath = `${workPath}\\${database}`
      dbDumpCmd =  (outFile) => {return `${execPath}\extra\\mongodump.exe --host ${host} --port ${port} --gzip --archive="${outFile}"`;};
    }
    else { //assume mac
      tmpPath = process.env.TMPDIR;
      basePath = process.env.HOME + '/Library/Application Support/' + appName.replace(' ', '-');
      workPath = basePath + '/' + dataSubPath;
      defExportPath = process.env.HOME + '/Desktop';
      execPath = process.env.PWD;
      dbDumpPath = `${workPath}/${database}`;
      dbDumpCmd = (outFile) => {return `${execPath}/extra/mongodump --host ${host} --port ${port} --gzip  --archive="${outFile}"`;};
    }

    return {
      appName: appName,
      appTitle: appTitle,
      version: pjson.version, //from package json
      tmpPath: tmpPath,
      basePath: basePath,
      workPath: workPath,
      execPath: execPath,
      dbConnStr: dbConnStr,
      defExportPath: defExportPath,
      dbDumpCmd: dbDumpCmd,
      dbDumpPath: dbDumpPath,
      dbName: database
    };
  }]);

  //Injects the Mongoose model "AppConstants", not the service "appConstants"
  services.service('configService', ['$q', 'AppConstants', function ($q, AppConstants) {
    let _this = this;

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
      errorDisplayTime: 5000,
      billNumberID: 'billNo', //used by Counters collection to identify the bill number counter
      billNoSeed: 10000, // value used to seed the counter if the entry doesn;t exist
      resNumberID: 'resNo', //used by Counters collection to identify the reservation number counter 
      expensesChangedEvent: 'EXP_EVENT1',  // event names
      reservationChangedEvent: 'RES_EVENT1',
      roomPlanClickEvent: 'ZPLAN_EVENT1',
      calEventChangedEvent: 'CAL_EVENT_EVENT', // calendar event saved/deleted
      weekButtonsSetEvent: 'WEEK_BTN1',
      resGuestEditedEvent: 'GUEST_EDITED_EVENT',
      firmEditedEvent: 'FIRM_EDITED_EVENT',
      guestNameChangedEvent: 'GUEST_NAME_CHANGE_EVENT',
      appReadyEvent: '', // broadcast when app.js finishes.
      bcRoom: 0,
      bcPackageItem: 1, // item is a required item for a standard package plan
      bcExtraRoom: 2,
      bcMeals: 3,
      bcResources: 4,
      bcKurTax: 5,
      bcPlanDiverses: 6,
      bcFood: 7,
      bcDrink: 8,
      bcKur: 9,
      bcKurPackageItem: 10, // item is a required item for a kur package plan
      bcKurSpecial: 11, //for copay and prescription charges
      bcDienste: 12, // for other services

      // Method to retrieve an array of bill codes associated with package plans
      getPackageItemCodes: function (){
        return [1,10]; //bcPackageItem and bcKurPackageItem
      },
      /**
       * Method that returns an array of excluded (fake rooms). These are not
       * real rooms but just temporary placeholders for reservations.
       */
      getExcludedRooms: () => {
        return [30,40];
      },

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
      'accommodationType': 'Unterkunft Typ',
      'accommodationPlan': 'Unterkunft Plan',
      'accommodationPlans': 'Unterkunft Pläne',
      'add': 'Hinzufügen',
      'address1': 'Adresse 1',
      'address2': 'Adresse 2',
      'addressGuest': 'Adresse (Gäste)',
      'addedKurtaxDisplayString': '%count% Tag|Tage Kurtaxe à %price%',
      'addedExtraDaysDisplayString': '%count% Tag|Tage Extra',
      'aggregatePersonDisplayString': '%text% für %count% Personen',
      'aggregateRoomDisplayString': '%text% (%count% Zimmer - %guestCnt% Gäste)',
      'all': 'Alle',
      'advancedSettings': 'Erweiterte Einstellungen',
      'appRestart': 'Das Programm wird in 5 Sekunden neu starten',
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
      'canMail': 'Post',
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
      'dataItemsWritten': 'Datenworte geschrieben',
      'day': 'Tag',
      'days': 'Tage',
      'daysTimes': 'Tage / Mal',
      'dbImport': 'Importieren der kompletten Datenbank',
      'dbExport': 'Exportieren der kompletten Datenbank',
      'dbAddress': 'Exportieren der Addressenliste',
      'delete': 'Löschen',
      'description': 'Beschreibung',
      'dine': 'Speisen',
      'displayString': 'Darstellung String',
      'displayOrder': 'Darstellung Ordnung',
      'DietAndAccommodation': 'Diätkost und Unterkunft',
      'double': 'Doppel',
      'doublePrice': 'Doppel Preis',
      'doubleRoomPriceAbr': 'DZ Preise',
      'drink': 'Getränke',
      'duration': 'Dauer',
      'edit': 'Bearbeiten',
      'email': 'E-Mail',
      'expenseItemErr1': 'Artikel; Zimmer oder Gastname fehlt.',
      'expenseItemErr2': 'Artikel nicht gefunden',
      'exporting': 'Exportieren',
      'exportEnded': 'Export erfolgreich beendet',
      'extra_days_item': 'Extra Tage',
      'error': 'Fehler',
      'errorBold': 'FEHLER!',
      'event': 'Veranstaltung',
      'eventAction': 'Veranstaltung Aktion',
      'event_titleCreate': 'Veranstaltung Informationen Erstellen',
      'event_titleDelete': 'Veranstaltung Informationen Löschen',
      'event_titleRead': 'Veranstaltung zur Firma',
      'event_titleUpdate': 'Veranstaltung Informationen Bearbeiten',
      'expenseItem': 'Aufwandsposten',
      'expenseItem_titleCreate': 'Aufwandsposten Informationen Erstellen',
      'expenseItem_titleDelete': 'Aufwandsposten Informationen Löschen',
      'expenseItem_titleRead': 'Informationen zum Aufwandsposten',
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
      'fromPriceList': 'Von Preisliste',
      'fullCityTax': 'Voll Kurtaxe',
      'fullPension': 'Vollpension',
      'fullPensionInc': 'VollpensionInc',
      'guest': 'Gast',
      'guest2': 'Gast 2',
      'guests': 'Gäste',
      'guestCount': 'Gäste Anzahl',
      'guestIsPrivate': 'Dieser Gast ist privat',
      'guest_titleCreate': 'Gast Informationen Erstellen',
      'guest_titleDelete': 'Gast Informationen Löschen',
      'guest_titleUpdate': 'Gast Informationen Bearbeiten',
      'guest_titleRead': 'Informationen zum Gast',
      'halfPension': 'Halbpension',
      'halfPensionInc': 'HalbpensionInc',
      'importing':'Importieren',
      'importEnded': 'Import erfolgreich beendet',
      'importWarning2a': 'Warnung! Diese Aktion wird die ',
      'importWarning2b': '  Daten zu ersetzen. Wollen Sie weitermachen?',
      'importWarning': 'Warnung! Diese Aktion wird alle aktuellen Daten zu ersetzen. Wollen Sie weitermachen?',
      'includedInPlan': 'Im Plan Preis inbegriffen',
      'includesBreakfast': 'Inklusive Frühstück',
      'insurance': 'Krankenkasse',
      'item': 'Artikel',
      'itemsFor': 'Artikel für',
      'itemsSum': 'Artikel Summe',
      'item_notFound': 'Artikel nicht gefunden',
      'lastName': 'Nachname',
      'lastNameSearch': 'Nachnamen Suche...',
      'lastStay': 'Letzter Aufenthalt',
      'leave': 'Abfahrt',
      'minus': 'Minus',
      'miscellaneous': 'Diverses',
      'miscellaneousDetails': 'Diverse Einzelheiten',
      'multiple': 'Mehrere',
      'name': 'Name',
      'newReservation': 'Neue Reservierung',
      'newPackage': 'Neue Pauschalangebot',
      'night': 'Nacht',
      'nights': 'Nächte',
      'no': 'Kein',
      'noNeg': 'Nein',
      'no_lc': '<keine>',
      'noParkPlace': 'Kein Parkplatz',
      'noReservationsFor': 'Keine Reservierungen für',
      'noRoom': 'Kein Zimmer',
      'notFound': 'nicht gefunden',
      'numRoomsAbrv': '# Zm',
      'ok': 'Ok',
      'onlyOneInRoom': 'Nur einer im Doppelzimmer',
      'open': 'Öffnen',
      'overnightAbr': 'ÜN',
      'packages': 'Pauschalangebote',
      'partner': 'Partner',
      'partner_birthday': 'Partner Geburtstag',
      'parkPlace': 'Parkplatz',
      'parkCharge': 'Parkgebühr',
      'perDay': 'Pro Tag',
      'perPerson': 'Pro Person',
      'perPersonAbrv': 'p.P.',
      'perPersonPriceAbrv': 'p.P. Preis',
      'postCode': 'PLZ',
      'prescription_charge': ' Rezeptgebühr',
      'price': 'Preis',
      'priceLookup': 'Preisabfrage',
      'priceSymbol': '€',
      'print': 'Drucken',
      'privateAddress': 'Privat Adresse',
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
      'requiresKurtaxe': 'Benötigt Kurtaxe',
      'res_num': 'Res. Nr.',
      'reservation': 'Reservierung',
      'reservations': 'Reservierungen',
      'reservation_titleCreate': 'Reservierung Informationen Erstellen',
      'reservation_titleDelete': 'Reservierung Informationen Löschen',
      'reservation_titleUpdate': 'Reservierung Informationen Bearbeiten',
      'reservation_titleRead': 'Informationen zur Reservierung',
      'reservationType': 'Res. Typ',
      'reservationYearMonth': 'Reservierungen im Jahr / Monat',
      'revenueStatistics': 'Umsatzstatistiken',
      'room': 'Zimmer',
      'room_titleCreate': 'Zimmer Informationen Erstellen',
      'room_titleDelete': 'Zimmer Informationen Löschen',
      'room_titleUpdate': 'Zimmer Informationen Bearbeiten',
      'room_titleRead': 'Zimmer zur Reservierung',
      'roomAbrv': 'Zi.',
      'roomClass': 'Zimmerklasse',
      'roomDisplayString': '%planName%',
      'roommate': 'Zimmergenosse',
      'roomNumber': 'Zimmernummer',
      'roomNumberAbrv': 'ZNr',
      'roomPlan': 'Zimmer Plan',
      'roomPlan_titleCreate': 'Unterkunft Plan Informationen Erstellen',
      'roomPlan_titleDelete': 'Unterkunft Plan Informationen Löschen',
      'roomPlan_titleUpdate': 'Unterkunft Plan Informationen Bearbeiten',
      'roomPlan_titleRead': 'Unterkunft Plan zur Reservierung',
      'roomPrice': 'Zimmer Preis',
      'roomsFree': 'Freie Zimmer',
      'roomType': 'Zimmertyp',
      'salutation': 'Anrede',
      'selected': 'Ausgewählt',
      'selectedRoom': 'Gewähltes Zi.',
      'select': 'Auswählen',
      'selectDatesTax': 'Reservierungs-Enddatumsbereich',
      'selectList': 'Liste wählen',
      'selectReservation': 'Reservierung wählen',
      'selectParkPlace': 'Parkplatz auswählen',
      'selectRoom': 'Zimmer auswählen',
      'selectRoomPlan': 'Unterkunft Typ auswählen',
      'services': 'Dienste',
      'single': 'Einzel',
      'singlePrice': 'Einzel Preis',
      'singleRoomPriceAbr': 'EZ Preise',
      'singleSurchargeAbr': 'EZ Zuschlag',
      'source': 'Quelle',
      'statistics': 'Statistiken',
      'status': 'Status',
      'start': 'Starten',
      'stay': 'Bleiben',
      'success_deleted': ' erfolgreich gelöscht',
      'success_saved': ' erfolgreich gespeichert',
      'success_changes_saved': 'Änderungen erfolgreich gespeichert',
      'telephone': 'Telefonnummer',
      'times': 'Mal',
      'title': 'Titel',
      'toBill': 'Zur Rechnung',
      'toCharges': 'Zu Gebühren',
      'toRoomPlan': 'Zum Zimmer Plan',
      'today': 'Heute',
      'tomorrow': 'Morgen',
      'tomorrowNext':'Übermorgen',
      'total': 'Sum',
      'type': 'Typ',
      'until': 'Bis',
      'update': 'Aktualisieren',
      'ustRate': 'UST Steuersatz',
      'val_invalidPlan': 'Sie müssen eine Zimmerart wählen',
      'val_invalidGuest': 'Fehlender oder ungültiger Gast',
      'val_missingGuest2' : 'Ein zweiter Gast ist erforderlich',
      'val_invalidFirm': 'Fehlende oder ungültige Firma',
      'val_invalidRoom': 'Mindestens ein Zimmer ist erforderlich',
      'val_invalidDates': 'Fehlende oder ungültige Reservierungsdaten',
      'val_invalidInsurance': 'Eine Versicherung muss ausgewählt werden',
      'val_invalidLastName': 'Nachname ist erforderlich',
      'val_invalidPlanInsurance': 'Der Kur Plan erfordert "Private" Versicherung',
      'val_invalidSalutation': 'Gast muss eine Anrede haben',
      'val_guestCountMismatch': 'Die Zahl der Gäste bei der Reservierung entspricht nicht die Anzahl der Gäste in den Zimmern .',
      'wantToEdit': 'Diese Reservierung ist geschlossen. Sind Sie sicher, dass Sie sie bearbeiten möchten.?',
      'wantToCheckout': 'Das Ende der Reservierung ist in der Zunkunft. Jetzt wirklich auschecken? Der originale Endtermin für die Reservierung wird nicht geändert! Wenn notwendig Termin bearbeiten.',
      'wantToDeleteItem': 'Artikel Löschen?',
      'wantToDeleteRes': 'Dies ist eine Reservierung für eine Geschäftsgruppe. Wenn Sie die Buchung löschen werden alle Zimmer die mit der Reservierung verbunden sind frei gegeben. Die Anzahl der Zimmer für diese Reservierung kann geändert werden indem die Reservierung bearbeited wird. Die vollständige Reservierung löschen?',
      'wantToDeleteCheckedIn': 'Diese Reservierung ist eingecheckt. Reservierung löschen?',
      'weekPlan3': 'Drei Wochen Zimmerplan',
      'weekPlan5': 'Fünf Wochen Zimmerplan',
      'withFirm': 'Mit Firma',
      'withoutFirm': 'Ohne Firma',
      'yes': 'Ja',
      'week_plan_for': 'Wochen Plan für',
      'xxx': '***'
    };

    // Kalendar month and day names and abbreviations
    this.calendarInfo = {
      months: ['Januar', 'Febuar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
      monthsAbrv: ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sept.', 'Okt.', 'Nov.', 'Dez.'],
      days: ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'],
      daysAbrv: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
      daysDe: ['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'],
      daysAbrvDe: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
    };
    // Constructor actions - populate the constants object with the constants defined in the AppConstants collection
    // This action gives precedence to the string value of a constant. If it is defined then it is choosen, else the
    // numeric value is chosen.
    AppConstants.find().then((constants) => {
      constants.forEach((constant) => {
        if (constant.svalue) {
          _this.constants[constant.name] = constant.svalue;
        }
        else {
          _this.constants[constant.name] = constant.nvalue;
        }
      });
    }).catch((err) => {
      console.log("Failed to retrieve constants!"); //Major error program will not function correctly!!!
      throw err;
    });
  }]);
});
