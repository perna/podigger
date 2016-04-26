angular.module('podigger')
    .controller('SearchController', function($scope, $http){

        $scope.term = '';
        $scope.episodes = [];

        $scope.getResults = function(){

            var query = {"term": $scope.term};
            var url = '/api/podcasts/episodes/'

            $http.post(url,query)
                .success(function(data) {
                    var len = data.hits.hits.length;
                    var arr = [];

                    for(var i = 0; i < len; i++) {
                        arr.push(data.hits.hits[i]._source)
                        //console.log(data.hits.hits[i]._source);
                    }

                    $scope.episodes = arr;
                });
        }
    })
    .controller('FeedController', function($scope, $http){

        $scope.podcast = {};

        $scope.submitForm = function(){

            var url = '/api/podcasts/'

            if($scope.addFeedForm.$valid) {

                $http.post(url, $scope.podcast)
                    .success(function(data){
                        console.log(data);
                })
            }
        }

    });