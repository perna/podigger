angular.module('podigger')
    .controller('SearchController', function($scope, $http){

        $scope.term = '';
        $scope.episodes = [];
        $scope.progressSearch= false;
        $scope.messageSearch = '';

        $scope.getResults = function(){

            var query = {"term": $scope.term};
            var url = '/api/podcasts/episodes/';

            $scope.messageSearch = 'searching';
            $scope.progressSearch = true;

            $http.post(url,query)
                .success(function(data) {
                    var len = data.hits.hits.length;
                    var arr = [];

                    $scope.progressSearch = false;

                    if(len === 0) {

                        $scope.messageSearch = 'empty';
                        return false;

                    } else {

                        for(var i = 0; i < len; i++) {
                            arr.push(data.hits.hits[i]._source);
                            //console.log(data.hits.hits[i]._source);
                        }
                        $scope.messageSearch = 'done';
                        $scope.episodes = arr;
                    }
                });
        };
    })
    .controller('FeedController', function($scope, $http){

        $scope.podcast = {};
        $scope.successMessage = false;
        $scope.errorMessage = false;

        $scope.submitForm = function(){

            var url = '/api/podcasts/';

            if($scope.addFeedForm.$valid) {

                $http.post(url, $scope.podcast)
                    .success(function(data){
                        $scope.successMessage = true;
                });
            }
        };
    });