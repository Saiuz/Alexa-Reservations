/**
 * Defines the main routes in the application.
 * The routes you see here will be anchors '#/' unless specifically configured otherwise.
 */

define(['./module'], function (states) {
    'use strict';

    return states.config(['$stateProvider', '$urlRouterProvider', 'viewProvider',
      function ($stateProvider, $urlRouterProvider, viewProvider) {

        $stateProvider.state('signup', {
            url: '/signup',
            template: viewProvider.renderView('signup'),
            controller: 'SignupCtrl'
        });

        $stateProvider.state('home', {
            url:'/home',
            template: viewProvider.renderView('home'),
            controller: 'HomeCtrl'

        });

        $stateProvider.state('reservations', {
          url:'/reservations',
          template: viewProvider.renderView('reservations'),
          controller: 'ReservationsCtrl'

        });

        $stateProvider.state('charges', {
          url:'/charges/:resNum',
          template: viewProvider.renderView('charges'),
          controller: 'ChargesCtrl'

        });

        $stateProvider.state('rechnung', {
          url:'/rechnung/:resNum',
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
