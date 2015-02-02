/**
 * Defines the main routes in the application.
 * The routes you see here will be anchors '#/' unless specifically configured otherwise.
 */

define(['./module'], function (states) {
    'use strict';

    return states.config(['$stateProvider', '$urlRouterProvider', 'viewProvider',
      function ($stateProvider, $urlRouterProvider, viewProvider) {

        $stateProvider.state('home', {
            url:'/home/:resNum/:resRoom/:resGuest',
            template: viewProvider.renderView('home'),
            controller: 'HomeCtrl'

        });

        $stateProvider.state('reservations', {
          url:'/reservations',
          template: viewProvider.renderView('reservations'),
          controller: 'ReservationsCtrl'

        });

        $stateProvider.state('charges', {
          url:'/charges/:resNum/:resRoom/:resGuest',
          template: viewProvider.renderView('charges'),
          controller: 'ChargesCtrl'

        });

        $stateProvider.state('rechnung', {
          url:'/rechnung/:resNum/:resRoom/:resGuest',
          template: viewProvider.renderView('rechnung'),
          controller: 'RechnungCtrl'

        });

        $stateProvider.state('addresse', {
          url:'/addresse',
          template: viewProvider.renderView('addresse'),
          controller: 'AddresseCtrl'

        });

        $stateProvider.state('liste', {
          url:'/liste',
          template: viewProvider.renderView('liste'),
          controller: 'ListeCtrl'

        });

      }]);
});
