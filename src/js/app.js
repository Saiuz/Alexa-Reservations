/**
 * loads sub modules and wraps them up into the main module
 * this should be used for top-level module definitions only
 */
define("app", [
  'angular',
  'angular-ui-router',
  'angular-bootstrap',
  'text!',
  'angular-xeditable',
  'angular-i18n',
  './controllers/index',
  './directives/index',
  './filters/index',
  './services/index',
  './views/index',
  './states/index',
  './models/index'
], function (ng) {
  'use strict';

  return ng.module('app', [
    'app.services',
    'app.controllers',
    'app.filters',
    'app.directives',
    'app.views',
    'app.states',
    'app.models',
    'ui.bootstrap',
    "ui.bootstrap.tpls",
    'ui.router',
    'ngLocale',
    'xeditable'
  ]).run(function ($state, nwService, $rootScope, editableOptions) {

    // Create the menubar
    $rootScope.menubar = nwService.createMenu({
      root: {
        title: 'Alexa',
        type: 'menubar',
        items: [
          {
            label: 'Alexa Reservierung',
            items: [
              {
                label: 'Exportieren',
                tooltip: 'Exportieren von Daten',
                click: '',
                items: [
                  {
                    label: 'Steuerinformationen',
                    tooltip: 'Mehrwertsteuer, Kurtaxe usw.',
                    click: 'export-tax'
                  },
                  {
                    label: 'Addresse',
                    tooltip: 'Gäste Addresse Liste',
                    click: 'export-guest'
                  },
                  {
                    label: 'Firma',
                    tooltip: 'Firma Liste',
                    click: 'export-firm'
                  },
                  {
                    label: 'Alle Daten',
                    tooltip: 'Backup aller Programmdaten',
                    click: 'export-all'
                  }
                ]
              },
              {
                label: 'Importieren...',
                tooltip: 'Importieren von Daten',
                click: 'open-file',
                items: [
                  {
                    label: 'Addresse',
                    tooltip: 'Gäste Addresse Liste',
                    click: 'import-guest'
                  },
                  {
                    label: 'Firma',
                    tooltip: 'Firma Liste',
                    click: 'import-firm'
                  },
                  {
                    label: 'Alle Daten',
                    tooltip: 'Wiederherstellung alle Programmdaten',
                    click: 'import-all'
                  }
                ]
              },
              {
                label: 'Quit',
                tooltip: 'Quit Alexa Reservierung',
                click: 'close-app'
              }
            ]
          }
        ]
      }
    });

    $rootScope.appTitle = "Hotel Alexa Reservierungssystem";   //may need language switching
    $rootScope.appBrand = "Alexa Reservierung";
    editableOptions.theme = 'bs3'; //for the radioButtonGroup directive (third party)
    $state.go('home');
  });
});
