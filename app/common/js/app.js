'use strict';

// Declare app level module which depends on filters, and services
angular.module('myApp', [
  'ngRoute',
  'myApp.logServices',
  'myApp.userServices',
  'myApp.userFilterServices',
  'myApp.loginServices',
  'myApp.filters',
  'myApp.services',
  'myApp.directives',
  'myApp.controllers'
]).
config(function ($httpProvider) {
    $httpProvider.interceptors.push('authInterceptor');
}).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/log', {templateUrl: 'log/views/log.html', controller: 'LogCtrl'});
  $routeProvider.when('/user', {templateUrl: 'user/views/user.html', controller: ''});
  $routeProvider.when('/search', {templateUrl: 'log/views/search.html', controller: 'MyCtrl4'});
  $routeProvider.when('/login', {templateUrl: 'login/views/login.html', controller: 'LoginCtrl'});
  $routeProvider.otherwise({redirectTo: '/log'});
}]);


//test