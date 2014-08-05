'use strict';

var um = angular.module('myApp.userServices', []);

um.factory('User', function($resource){
    return $resource('/users');
});

angular.module('myApp.userFilterServices', []).
    factory('userFilterService', function() {
        return {
            activeFilters: {},
            searchText: ''
        };
    });

