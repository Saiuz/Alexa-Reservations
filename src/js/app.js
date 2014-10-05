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
        'xeditable'
    ]).run(function($state, nwService, $rootScope,  editableOptions) {

        // Create the menubar
        $rootScope.menubar = nwService.createMenu({
            root: {
                type:'menubar',
                items:[
                  {label:'File', items:[
                    {label: 'Export...', tooltip: 'Create a new file', click:'new-file'},
                    {label: 'Import...', tooltip: 'Open a file', click:'open-file'},
                    {label: 'Save', tooltip: 'Save a file', click:'save-file'},
                    {label: 'Close', tooltip: 'Close a file', click:'close-file'}
                  ]}
                ]
            }
        });

      $rootScope.appTitle = "Hotel Alexa Reservierungssystem";   //may need language switching
      $rootScope.appBrand = "Alexa Reservierung";
      editableOptions.theme = 'bs3'; //for the radioButtonGroup directive (third party)
        $state.go('home');
    });
});
