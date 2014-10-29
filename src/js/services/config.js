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

    // Added an object that contains the various text strings for the UI views, forms and directives
    // The purpose is to have the standard text items all in one place.

    this.loctxt = {
      //'': '',
      'add': 'Hinzufügen',
      'address1': 'Addresse 1',
      'address2': 'Addresse 2',
      'arrive': 'Ankunft',
      'birthday': 'Geburtstag',
      'cancel': 'Abbrechen',
      'charges': 'Gebühren',
      'city': 'Ort',
      'clear': 'Löschen',
      'close': 'Schließen',
      'comments': 'Bemerkung',
      'confirmDelete': 'Löschen bestätigen',
      'contact_email': 'Kontakt E-Mail',
      'contact_name': 'Kontakt Name',
      'contact_tel': 'Kontakt Tf.',
      'delete': 'Löschen',
      'double': 'Doppel',
      'email': 'E-Mail',
      'firmName': 'Firma Name',
      'firm': 'Firma',
      'firm_titleCreate': 'Erstellen Firma Informationen',
      'firm_titleDelete': 'Löschen Firma Informationen',
      'firm_titleRead': 'Informationen zur Firma',
      'firm_titleUpdate': 'Bearbeiten Firma Informationen',
      'firstName': 'Vorname',
      'free': 'Frei',
      'from': 'Von',
      'guest': 'Gast',
      'guests': 'Gäste',
      'guestCount': 'Gäste Anzahl',
      'guest_titleCreate': 'Erstellen Gast Informationen',
      'guest_titleDelete': 'Löschen Gast Informationen',
      'guest_titleEdit': 'Bearbeiten Gast Informationen',
      'guest_titleRead': 'Informationen zur Gast',
      'insurance': 'Krankenkasse',
      'item_notFound': 'Artikel nicht gefunden',
      'lastName': 'Nachname',
      'leave': 'Abfahrt',
      'nights': 'Nächte',
      'no': 'Kein',
      'noParkPlace': 'Kein Parkplatz',
      'noRoom': 'Kein Zimmer',
      'ok': 'Ok',
      'open': 'Öffnen',
      'parkPlace': 'Parkplatz',
      'postCode': 'PLZ',
      'price': 'Preis',
      'priceSymbol': '€',
      'reservation': 'Reservierung',
      'reservationType': 'Res. Typ',
      'room': 'Zimmer',
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
      'stay': 'Bleiben',
      'telephone': 'Telefonnummer',
      'today': 'Heute',
      'until': 'Bis',
      'update': 'Aktualisieren',
      'xxx': '***'
    };

  }]);
});
