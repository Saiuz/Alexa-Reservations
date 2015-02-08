/**
 * Defines the routes for the import and export pages. These are accessed by the menu.
 */

define(['./module'], function (states) {
    'use strict';

    var fs = require('fs');

    return states.config(['$stateProvider', '$urlRouterProvider', 'viewProvider', function ($stateProvider, $urlRouterProvider, viewProvider) {

        $stateProvider.state('export_tax', {
            url: '/export/tax',
            template: viewProvider.renderView('export'),
            controller: 'ExportCtrl'
        });

        $stateProvider.state('export_guest', {
            url: '/export/guest',
            template: viewProvider.renderView('export'),
            controller: 'ExportCtrl'
        });

        $stateProvider.state('export_firm', {
            url: '/export/firm',
            template: viewProvider.renderView('export'),
            controller: 'ExportCtrl'
        });

        $stateProvider.state('export_all', {
            url: '/export/all',
            template: viewProvider.renderView('export'),
            controller: 'ExportCtrl'
        });

        $stateProvider.state('import_guest', {
            url: '/import/guest',
            template: viewProvider.renderView('export'),
            controller: 'ImportCtrl'
        });

        $stateProvider.state('import_firm', {
            url: '/import/firm',
            template: viewProvider.renderView('export'),
            controller: 'ImportCtrl'
        });

        $stateProvider.state('import_all', {
            url: '/import/all',
            template: viewProvider.renderView('export'),
            controller: 'ImportCtrl'
        });

    }]);
});
