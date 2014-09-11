'use strict';

// Declare app level module which depends on filters, and services
angular.module('taskApp', [
  'ngRoute',
  'angularFileUpload',
  'myApp.taskControllers',
  'myApp.taskServices',
  'myApp.taskFilters',
  'myApp.userServices',
  'myApp.filters',
  'myApp.services',
  'myApp.directives',
  'myApp.controllers'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/start', {templateUrl: 'views/task.html', controller: 'TaskCtrl'});
  $routeProvider.when('/todo', {templateUrl: 'views/task.html', controller: 'TaskCtrl'});
  $routeProvider.when('/done', {templateUrl: 'views/task.html', controller: 'TaskCtrl'});
  $routeProvider.otherwise({redirectTo: '/todo'});
}]);

