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
  './services/index',
  './controllers/index',
  './filters/index',
  './directives/index',
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
    'ui.bootstrap.tpls',
    'ui.bootstrap.tooltip',
    'ui.router',
    'ngLocale',
    'xeditable'
  ]).config(function($compileProvider){ //perform app configuration steps
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension):/); //needed for NW.js 0.15.4
  }).run(function ($state, nwService, appConstants, $rootScope, editableOptions) {
    // Create the menubar
    $rootScope.menubar = nwService.createMenu({
      root: {
        title: 'Alexa',
        type: 'menubar',
        items: [
          {
            label: 'Alexa Reservierungen',
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
                    label: 'Addressliste',
                    tooltip: 'Gaste Postadressen',
                    click: 'export-address'
                  },  
                  {
                    label: 'Einzeldaten',
                    tooltip: 'Gäste Addresse Liste, Firma, usw.',
                    click: 'export-one'
                  },
                  {
                    label: 'Alle Daten',
                    tooltip: 'Backup aller Programmdaten',
                    click: 'export-all'
                  }
                ]
              },
              // {
              //   label: 'Importieren...',
              //   tooltip: 'Importieren von Daten',
              //   click: 'open-file',
              //   items: [
              //     {
              //       label: 'Einzeldaten',
              //       tooltip: 'Gäste Addresse Liste, Firma, usw.',
              //       click: 'import-one'
              //     },
              //     {
              //       label: 'Alle Daten',
              //       tooltip: 'Wiederherstellung alle Programmdaten',
              //       click: 'import-all'
              //     }
              //   ]
              // },,
              // {
              //   label: 'Importieren...',
              //   tooltip: 'Importieren von Daten',
              //   click: 'open-file',
              //   items: [
              //     {
              //       label: 'Einzeldaten',
              //       tooltip: 'Gäste Addresse Liste, Firma, usw.',
              //       click: 'import-one'
              //     },
              //     {
              //       label: 'Alle Daten',
              //       tooltip: 'Wiederherstellung alle Programmdaten',
              //       click: 'import-all'
              //     }
              //   ]
              // },
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

    $rootScope.appTitle = appConstants.appTitle;   //may need language switching
    $rootScope.appBrand = appConstants.appName;
    $rootScope.version = appConstants.version;
    editableOptions.theme = 'bs3'; //for the radioButtonGroup directive (third party)
    $state.go('home');
  });
});
