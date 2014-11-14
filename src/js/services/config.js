/*
 * Configuration service. Provides methods to get and set local storage variables. Also provides objects containing
 * global constants and text strings for the UI.
 */
define(['./module'], function (services) {
  'use strict';

  services.service('configService', ['$q', function ($q) {

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

    // Object that contains system-wide constants
    this.constants = {
      autoCloseTime: 2000
    };

    // An object that contains the various text strings for the UI views, forms and directives
    // The purpose is to have the standard text items all in one place.
    this.loctxt = {
      //'': '',
      'add': 'Hinzufügen',
      'address1': 'Adresse 1',
      'address2': 'Adresse 2',
      'arrive': 'Ankunft',
      'birthday': 'Geburtstag',
      'cancel': 'Abbrechen',
      'charges': 'Gebühren',
      'checkin': 'Check-in',
      'checkout': 'Kasse',
      'city': 'Ort',
      'clear': 'Löschen',
      'close': 'Schließen',
      'comments': 'Bemerkung',
      'confirmDelete': 'Löschen bestätigen',
      'contact': 'Kontakt',
      'contact_email': 'Kontakt E-Mail',
      'contact_name': 'Kontakt Name',
      'contact_tel': 'Kontakt Tf.',
      'country': 'Land',
      'delete': 'Löschen',
      'double': 'Doppel',
      'edit': 'Bearbeiten',
      'email': 'E-Mail',
      'firmName': 'Firma Name',
      'firm': 'Firma',
      'firm_titleCreate': 'Firma Informationen Erstellen',
      'firm_titleDelete': 'Firma Informationen Löschen',
      'firm_titleRead': 'Informationen zur Firma',
      'firm_titleUpdate': 'Firma Informationen Bearbeiten',
      'firstName': 'Vorname',
      'free': 'Frei',
      'from': 'Von',
      'guest': 'Gast',
      'guests': 'Gäste',
      'guestCount': 'Gäste Anzahl',
      'guest_titleCreate': 'Gast Informationen Erstellen',
      'guest_titleDelete': 'Gast Informationen Löschen',
      'guest_titleEdit': 'Gast Informationen Bearbeiten',
      'guest_titleRead': 'Informationen zur Gast',
      'insurance': 'Krankenkasse',
      'item_notFound': 'Artikel nicht gefunden',
      'lastName': 'Nachname',
      'leave': 'Abfahrt',
      'night': 'Nacht',
      'nights': 'Nächte',
      'no': 'Kein',
      'no_lc': '<keine>',
      'noParkPlace': 'Kein Parkplatz',
      'noRoom': 'Kein Zimmer',
      'notFound': 'nicht gefunden',
      'ok': 'Ok',
      'open': 'Öffnen',
      'parkPlace': 'Parkplatz',
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
      'roomNumber': 'Zimmernummer',
      'roomPlan': 'Zimmer Plan',
      'roomPrice': 'Zimmer Preis',
      'roomsFree': 'Frei Zimmer',
      'salutation': 'Anrede',
      'selected': 'Ausgewählt',
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
      'today': 'Heute',
      'until': 'Bis',
      'update': 'Aktualisieren',
      'val_invalidPlan': 'You must select a Room Plan',
      'val_invalidGuest': 'Missing or invalid Guest',
      'val_invalidFirm': 'Missing or invalid Firm',
      'val_invalidRoom': 'At least one room is required',
      'val_invalidDates': 'Missing or invalid Reservation dates',

      'xxx': '***'
    };
  }]);
});
