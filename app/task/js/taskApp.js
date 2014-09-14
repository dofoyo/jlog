'use strict';

// Declare app level module which depends on filters, and services
angular.module('taskApp', [
  'ngRoute',
  'angularFileUpload',
  'task.controllers',
  'task.services',
  'task.filters',
  'user.services',
  'common.filters',
  'common.services',
  'common.directives',
  'common.controllers'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/create', {templateUrl: 'views/task.html', controller: 'TaskCtrl'});
  $routeProvider.when('/todo', {templateUrl: 'views/task.html', controller: 'TaskCtrl'});
  $routeProvider.when('/tore', {templateUrl: 'views/task.html', controller: 'TaskCtrl'});
  $routeProvider.when('/done', {templateUrl: 'views/task.html', controller: 'TaskCtrl'});
  $routeProvider.otherwise({redirectTo: '/todo'});
}]);

