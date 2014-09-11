'use strict';

// Declare app level module which depends on filters, and services
angular.module('jlogApp', [
  'ngRoute',
  'angularFileUpload',
  'task.controllers',
  'task.services',
  'task.filters',
  'log.services',
  'log.filters',
  'user.services',
  'user.filterServices',
  'login.services',
  'common.filters',
  'common.services',
  'common.directives',
  'common.controllers'
]).
config(function ($httpProvider) {
    $httpProvider.interceptors.push('authInterceptor');
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
}).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/task', {templateUrl: 'task/views/task.html', controller: 'TaskCtrl'});
  $routeProvider.when('/log', {templateUrl: 'log/views/log.html', controller: 'LogCtrl'});
  $routeProvider.when('/relationship', {templateUrl: 'user/views/relationship.html', controller: ''});
  $routeProvider.when('/login', {templateUrl: 'login/views/login.html', controller: 'LoginCtrl'});
  $routeProvider.when('/user', {templateUrl: 'user/views/user.html', controller: 'UserListCtrl'});
  $routeProvider.otherwise({redirectTo: '/log'});
}]);

