var win = nw.Window.get();
win.showDevTools();
/**
 * configure RequireJS
 * prefer named modules to long paths, especially for version mgt
 * or 3rd party libraries
 */
requirejs.config({

    paths: {
        'domReady': '../lib/requirejs-domready/domReady',
        'angular': '../lib/angular/angular',
        'angular-ui-router': '../lib/angular-ui-router/release/angular-ui-router',
        'angular-i18n': '../lib/angular-i18n/angular-locale_de-de',
        'text': '../lib/requirejs-text/text',
        '_': '../lib/lodash/lodash',
        '$': '../lib/jquery/dist/jquery',
        'chart': '../lib/chart.js/dist/Chart.bundle.min',
        'angular-bootstrap': '../lib/angular-bootstrap/ui-bootstrap-tpls',
        'angular-xeditable': '../lib/angular-xeditable/dist/js/xeditable',
        'angular-chart': '../lib/angular-chart.js/dist/angular-chart'
    },

    /**
     * for libs that either do not support AMD out of the box, or
     * require some fine tuning to dependency mgt'
     */
    shim: {
        'angular':{
            exports: 'angular'
        },
        'angular-ui-router':{
            deps:['angular']
        },
        'angular-i18n':{
            deps:['angular']
        },
        '_':{
            exports:'_'
        },
        'angular-bootstrap':{
            deps: ['angular', '$']
        },
        'angular-xeditable':{
          deps:['angular']
        },
        'chart.js': {
            deps: ['angular', 'chart']
        }
    },

    deps: [
        // kick start application... see bootstrap.js
        './bootstrap'
    ]
});
