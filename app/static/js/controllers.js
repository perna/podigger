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
    .controller('FeedController', function($scope, $http, $location){

        $scope.podcast = {};
        $scope.successMessage = false;
        $scope.errorMessage = false;
        $scope.message = {};

        $scope.submitForm = function(){

            $scope.successMessage = false;
            $scope.errorMessage = false;

            var url = '/api/podcasts/';
            var params = {
                name: $scope.podcast.name,
                feed: $scope.podcast.feed
            };

            if($scope.addFeedForm.$valid) {

                $http.post(url, params)
                    .success(function(response){

                        var data = JSON.parse(response);

                        if(data.status === 'error') {
                            $scope.errorMessage = true;
                            $scope.message.text = data.message;
                            $scope.message.line = data.line;
                        } else {
                            $scope.successMessage = true;
                        }
                        $scope.podcast.name = '';
                        $scope.podcast.feed = '';
                });
            }
        };
    })
    .controller('PodcastController', function($scope, $http) {

        var url = '/api/podcasts/';
        $scope.list = '';

        $scope.listAll = function(){

            $http.get(url)
                .success(function(data){
                    $scope.list = data;
            })
        };

    });