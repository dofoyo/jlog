'use strict';

// Declare app level module which depends on filters, and services
angular.module('myApp', [
  'ngRoute',
  'myApp.filters',
  'myApp.services',
  'logServices',
  'userServices',
  'loginServices',
  'filterServices',
  'myApp.directives',
  'myApp.controllers'
]).
config(function ($httpProvider) {
    $httpProvider.interceptors.push('authInterceptor');
}).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/log', {templateUrl: 'partials/log.html', controller: 'LogCtrl'});
  $routeProvider.when('/user', {templateUrl: 'partials/user.html', controller: ''});
  $routeProvider.when('/todo', {templateUrl: 'partials/todo.html', controller: ''});
  $routeProvider.when('/search', {templateUrl: 'partials/search.html', controller: 'MyCtrl4'});
  $routeProvider.when('/login', {templateUrl: 'partials/login.html', controller: 'LoginCtrl'});
  $routeProvider.otherwise({redirectTo: '/log'});
}]);


//test