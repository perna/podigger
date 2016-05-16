angular.module('podigger')
    .controller('SearchController', function($scope, $http){

        $scope.term = '';
        $scope.episodes = [];
        $scope.progressSearch= false;
        $scope.messageSearch = '';

        $scope.getResults = function(){

            if($scope.term.length > 2) {
                var query = {"term": $scope.term};
                var url = '/api/podcasts/episodes/';

                $scope.messageSearch = 'searching';
                $scope.progressSearch = true;

                $http.post(url,query)
                    .success(function(data) {
                        var len = data.length;
                        var arr = [];

                        $scope.progressSearch = false;

                        if(len === 0) {
                            $scope.messageSearch = 'empty';
                            $scope.episodes = [];
                            return false;
                        } else {
                            for(var i = 0; i < len; i++) {
                                arr.push(JSON.parse(data[i]));
                            }
                            $scope.messageSearch = 'done';
                            $scope.episodes = arr;
                        }
                });
            }
        };
    })
    .controller('FeedController', function($scope, $http){

        $scope.podcast = {};
        $scope.successMessage = false;
        $scope.errorMessage = false;

        $scope.submitForm = function(){

            var url = '/api/podcasts/';
            var params = {
                name: $scope.podcast.name,
                feed: $scope.podcast.feed
            };

            if($scope.addFeedForm.$valid) {

                $http.post(url, params)
                    .success(function(data){
                        $scope.successMessage = true;
                        $scope.podcasts.name = '';
                        $scope.podcasts.feed = '';
                });
            }
        };
    });