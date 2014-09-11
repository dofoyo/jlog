'use strict';

var um = angular.module('user.services', []);

um.factory('User', function($resource){
    return $resource('/users');
});

angular.module('user.filterServices', []).
    factory('userFilterService', function() {
        return {
            activeFilters: {},
            searchText: ''
        };
    });

