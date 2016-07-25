angular.module('podigger',['ngRoute','ngAnimate','ngMessages','angularMoment','angularUtils.directives.dirPagination','chart.js'])
    .config(function($routeProvider, paginationTemplateProvider) {

        $routeProvider
            .when('/', {
                templateUrl: 'static/partials/home.html'
            })
            .when('/search', {
                templateUrl: 'static/partials/search.html',
                controller: 'SearchController'
            })
            .when('/add-podcast', {
                templateUrl: 'static/partials/add_feed.html',
                controller: 'FeedController'
            })
            .when('/list-podcasts', {
                templateUrl: 'static/partials/list_podcasts.html',
                controller: 'PodcastController'
            })
            .when('/about', {
                templateUrl: 'static/partials/about.html'
            })
            .when('/contact', {
                templateUrl: 'static/partials/contact.html'
            })
            .when('/trends', {
                templateUrl: 'static/partials/trends.html',
                controller: 'TrendController'
            })
            .when('/topic-suggestions', {
                templateUrl: 'static/partials/add_topic_suggestion.html',
                controller: 'TopicSuggestionController'
            })
            .otherwise({
                redirectTo: '/'
            });

            paginationTemplateProvider.setPath('static/js/lib/dirPagination.tpl.html');
    })
    .run(function(amMoment){
        amMoment.changeLocale('pt-br');
    });