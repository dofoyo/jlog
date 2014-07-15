'use strict';

// Declare app level module which depends on filters, and services
angular.module('myApp', [
  'ngRoute',
  'angularFileUpload',
  'myApp.logServices',
  'myApp.logFilters',
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
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
}).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/log', {templateUrl: 'log/views/log.html', controller: 'LogCtrl'});
  $routeProvider.when('/relationship', {templateUrl: 'user/views/relationship.html', controller: ''});
  $routeProvider.when('/login', {templateUrl: 'login/views/login.html', controller: 'LoginCtrl'});
  $routeProvider.when('/user', {templateUrl: 'user/views/user.html', controller: 'UserListCtrl'});
  $routeProvider.otherwise({redirectTo: '/log'});
}]);

