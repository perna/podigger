angular.module('podigger')
    .filter('trusted', ['$sce', function ($sce) {
      return function(url) {
        return $sce.trustAsResourceUrl(url);
      };
}]);