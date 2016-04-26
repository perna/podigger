angular.module('podigger',['ngRoute','ngAnimate'])
    .config(function($routeProvider) {

        $routeProvider
            .when('/', {
                templateUrl: 'static/partials/home.html'
            })
            .when('/search', {
                templateUrl: 'static/partials/search.html',
                controller: 'SearchController'
            })
            .when('/add-feed', {
                templateUrl: 'static/partials/add_feed.html',
                controller: 'FeedController'
            })
            .when('/about', {
                templateUrl: 'static/partials/about.html'
            })
            .when('/contact', {
                templateUrl: 'static/partials/contact.html'
            })
            .otherwise({
                redirectTo: '/'
            });
    });