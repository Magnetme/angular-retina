// Add support for Retina displays when using element attribute "ng-src".
// This module overrides the built-in directive "ng-src" with one which
// distinguishes between standard or high-resolution (Retina) displays.

(function(angular, undefined) {
'use strict';
var infix = '@2x',
  data_url_regex = /^data:([a-z]+\/[a-z]+(;[a-z\-]+\=[a-z\-]+)?)?(;base64)?,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/,
  pattern = /.*/;

var ngRetina = angular.module('ngRetina', []).config(function($provide) {
  $provide.decorator('ngSrcDirective', ['$delegate', function($delegate) {
    $delegate[0].compile = function(element, attrs) {
      // intentionally empty to override the built-in directive ng-src
    };
    return $delegate;
  }]);
});

ngRetina.provider('ngRetina', function() {
  this.setInfix = function(value) {
    infix = value;
  };
  this.setPattern = function(value) {
    pattern = new RegExp(value);
  };

  this.$get = angular.noop;
});

ngRetina.directive('ngSrc', ['$window', '$http', function($window, $http) {
  var msie = parseInt(((/msie (\d+)/.exec($window.navigator.userAgent.toLowerCase()) || [])[1]), 10);
  var isRetina = (function() {
    var mediaQuery = "(-webkit-min-device-pixel-ratio: 1.5), (min--moz-device-pixel-ratio: 1.5), " +
      "(-o-min-device-pixel-ratio: 3/2), (min-resolution: 1.5dppx)";
    if ($window.devicePixelRatio > 1)
      return true;
    return ($window.matchMedia && $window.matchMedia(mediaQuery).matches);
  })();

  function getHighResolutionURL(url) {
    var pathParts = url.split('/');
    var file = pathParts.pop();
    var fileParts = file.split('.');

    if (fileParts.length < 2)
      return url + infix;
    fileParts[fileParts.length - 2] += infix;
    pathParts.push(fileParts.join('.'));
    return pathParts.join('/');
  }

  return function(scope, element, attrs) {
    function setImgSrc(img_url) {
      attrs.$set('src', img_url);
      if (msie) element.prop('src', img_url);
    }

    function set2xVariant(img_url) {
      if (!pattern.test(img_url)) {
        setImgSrc(img_url);
        return;
      }
      var img_url_2x = $window.sessionStorage.getItem(img_url);

      if (!img_url_2x) {
        img_url_2x = getHighResolutionURL(img_url);
        $http.head(img_url_2x).
        success(function(data, status) {
          setImgSrc(img_url_2x);
          $window.sessionStorage.setItem(img_url, img_url_2x);
        }).
        error(function(data, status, headers, config) {
          setImgSrc(img_url);
          $window.sessionStorage.setItem(img_url, img_url);
        });
      } else {
        setImgSrc(img_url_2x);
      }
    }

    attrs.$observe('ngSrc', function(value) {
      if (!value)
        return;
      if (isRetina && typeof $window.sessionStorage === 'object' && element[0].tagName === 'IMG' && !value.match(data_url_regex)) {
        set2xVariant(value);
      } else {
        setImgSrc(value);
      }
    });
  };
}]);

})(window.angular);
