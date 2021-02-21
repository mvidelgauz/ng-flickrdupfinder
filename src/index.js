'use strict'

require('angular-resource')
require('angular-route')
require('angular-ui-bootstrap/src/pagination/pagination')

require('./oauth-shim')
require('./uservoice-shim')
require('./services')
require('./controllers')

angular
  .module('flickrDupFinder', ['ngRoute', 'flickrDupFinderControllers'])
  .config([
    '$locationProvider',
    '$routeProvider',
    function ($locationProvider, $routeProvider) {
      //probably breaks things due to oauth redirect landing page hack below
      //$locationProvider.html5Mode(true);

      // the oauth redirect callback page must be matched with .otherwise
      $routeProvider
        .when('/', {
          templateUrl: 'partials/start.html',
          controller: 'startCtrl',
        })
        .otherwise({
          templateUrl: 'partials/photos.html',
          controller: 'photoCtrl',
          resolve: { Flickr: 'Flickr' },
        })
    },
  ])
