$.material.init();

angular.module('podigger',['ngRoute'])
    .config(function($routeProvider) {

        $routeProvider
            .when('/', {
                templateUrl: 'static/partials/search.html'
            });
    });