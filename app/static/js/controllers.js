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
        $scope.loading = false;
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

                $scope.loading = true;

                $http.post(url, params)
                    .success(function(response){

                        $scope.loading = false;
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
        $scope.loading = true;
        $scope.tableListPodcasts = false;

        $scope.listAll = function(){

            $http.get(url)
                .success(function(data){
                    $scope.loading = false;
                    $scope.tableListPodcasts = true;
                    $scope.list = data;
            })
        };

    })
    .controller('TrendController', function($scope, $http){

        function getDeltaDays(days) {

            var date = new Date(),
                last = new Date(date.getTime() - (days * 24 * 60 * 60 * 1000)),
                day = (last.getDate() < 10)? '0'+ last.getDate():last.getDate(),
                month = ((last.getMonth()+1) < 10)? '0'+(last.getMonth()+1):last.getMonth()+1,
                year = last.getFullYear(),
                pastDate = year+'-'+month+'-'+day;
                return pastDate;
         }

        function getTodayMostSearchedTerms() {

            var url = '/api/terms/'+getDeltaDays(0);

            $http.get(url)
                .success(function(data){

                    var dataSize = data.length - 1;
                    var dataLabel = [];
                    var dataTimes = [];

                    for(var i = 0; i < dataSize; i++) {
                        dataLabel.push(data[i].name)
                        dataTimes.push(data[i].times)
                    }

                    $scope.labels = dataLabel;
                    $scope.data = dataTimes;
            });
        }



        function getSevenMostSearchedTerms() {

            var url = '/api/terms/'+getDeltaDays(7);

            $http.get(url)
                .success(function(data){

                    var dataSize = data.length - 1;
                    var dataLabel = [];
                    var dataTimes = [];

                    for(var i = 0; i < dataSize; i++) {
                        dataLabel.push(data[i].name)
                        dataTimes.push(data[i].times)
                    }

                    $scope.labels7 = dataLabel;
                    $scope.data7 = dataTimes;
            });
        }

        function getFifteenMostSearchedTerms() {

            var url = '/api/terms/'+getDeltaDays(15);
            $http.get(url)
                .success(function(data){

                    var dataSize = data.length - 1;
                    var dataLabel = [];
                    var dataTimes = [];

                    for(var i = 0; i < dataSize; i++) {
                        dataLabel.push(data[i].name)
                        dataTimes.push(data[i].times)
                    }

                    $scope.labels15 = dataLabel;
                    $scope.data15 = dataTimes;
            });
        }

        function getThirtyMostSearchedTerms() {

            var url = '/api/terms/'+getDeltaDays(15);
            $http.get(url)
                .success(function(data){

                    var dataSize = data.length - 1;
                    var dataLabel = [];
                    var dataTimes = [];

                    for(var i = 0; i < dataSize; i++) {
                        dataLabel.push(data[i].name)
                        dataTimes.push(data[i].times)
                    }

                    $scope.labels30 = dataLabel;
                    $scope.data30 = dataTimes;
            });
        }

        getTodayMostSearchedTerms();
        getSevenMostSearchedTerms();
        getFifteenMostSearchedTerms();
        getThirtyMostSearchedTerms();

    });