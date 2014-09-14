'use strict';

require('./../../bower_components/ui.bootstrap/src/pagination/pagination');

module.exports = angular.module(
  'flickrDupFinderControllers',
  ['ui.bootstrap.pagination',
   require('./config').name,
   require('./services').name])
  .controller(
    'startCtrl',
    ['$http', 'OAUTHD_URL', '$log', function($http, OAUTHD_URL, $log) {
      $http.get(OAUTHD_URL + '/auth/flickr').success(function(success) {
        $log.debug("oauthd ping successful:", success);
      });
    }])
  .controller(
    'photoCtrl',
    ['$scope', '$log', 'Flickr', function($scope, $log, Flickr) {
      var _ = require('underscore');
      var specialTag = 'flickrdupfinder';
      $scope.itemsPerPage = 10;
      $scope.maxSize = 10;

      $scope.toggleTag = function(photo) {
        if (photo.duplicate) {
          removeTag(photo);
        } else {
          addTag(photo);
        }
      };

      function addTag(photo) {
        photo.inFlight = true;
        Flickr.get({
          method: 'flickr.photos.addTags',
          photo_id: photo.id,
          tags: specialTag
        }, function() {
          photo.duplicate = true;
          photo.inFlight = false;
        });
      };

      function removeTag(photo) {
        photo.inFlight = true;
        Flickr.get({
          method: 'flickr.photos.getInfo',
          photo_id: photo.id
        }, function(info) {
          var tag =
            _.find(info.photo.tags.tag, function(tag) {
              return tag.raw === specialTag;
            });
          if (tag) {
            Flickr.get({
              method: 'flickr.photos.removeTag',
              photo_id: photo.id,
              tag_id: tag.id
            }, function() {
              photo.duplicate = false;
              photo.inFlight = false;
            });
          } else {
            photo.inFlight = false;
          }
        });
      };

      function hasMaxDateTakenGranularity(photo) {
        return true;
        //return photo.datetakengranularity == "0";
      }

      function updateDuplicateState(photo) {
        photo['duplicate'] = _.contains(photo.tags.split(/ /), specialTag);
        return photo;
      }

      function fingerprint(photo) {
        return photo.datetaken + '##' + photo.title.replace(/-[0-9]$/, '');
      }

      function atLeastTwo(group) {
        return group.length > 1;
      }

      function groupDuplicates(photos) {
        var groups = _.groupBy(photos, fingerprint);
        var groups2 = _.filter(groups, atLeastTwo);
        $scope.groups = groups2;
        updateVisibleGroups()
      }

      function getPage(page, photosAcc) {
        $scope.page = page;
        Flickr.get({
          method: "flickr.photos.search",
          page: page,
          per_page: 500,
          sort: 'date-taken-asc'}, function(result) {
            $scope.totalPages = result.photos.pages;
            var resultPhotos = result.photos.photo;
            var filteredResultPhotos =
              _.filter(resultPhotos, hasMaxDateTakenGranularity);
            var updatedResultPhotos =
              _.map(filteredResultPhotos, updateDuplicateState);
            var photosAcc2 = photosAcc.concat(updatedResultPhotos);
            if (page < result.photos.pages) {
              getPage(page + 1, photosAcc2);
            } else {
              $scope.initialDownload = false;
            }
            groupDuplicates(photosAcc2);
          });
      }

      function updateVisibleGroups() {
        $scope.totalItems = _.size($scope.groups);
        var first = (($scope.currentPage - 1) * $scope.itemsPerPage);
        var last = $scope.currentPage * $scope.itemsPerPage;
        $scope.visibleGroups =
          _.pick($scope.groups, _.keys($scope.groups).slice(first, last));
      }

      $scope.pageChanged = function() {
        updateVisibleGroups()
      };

      $scope.totalItems = 0;
      $scope.currentPage = 1;
      $scope.initialDownload = true;
      getPage(1, []);
    }]);
