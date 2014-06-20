'use strict';

angular.module('logServices', ['ngResource']).factory('Log', function($resource){
    return $resource('log/:logId.json', {}, {
        query: {method:'GET', params:{logId:'logs'}, isArray:true}
    });
});

angular.module('userServices', ['ngResource']).factory('User', function($resource){
    return $resource('user/:userId.json', {}, {
        query: {method:'GET', params:{userId:'users'}, isArray:true}
    });
});

angular.module('myApp.services', []).value('version', '0.1');

angular.module('loginServices', []).factory('authInterceptor', function ($rootScope, $q, $window) {
    return {
        request: function (config) {
            config.headers = config.headers || {};
            if ($window.sessionStorage.token) {
                config.headers.Authorization = 'Bearer ' + $window.sessionStorage.token;
            }
            return config;
        },
        responseError: function (rejection) {
            if (rejection.status === 401) {
                // handle the case where the user is not authenticated
            }
            return $q.reject(rejection);
        }
    };
});

angular.module('filterServices', []).
    factory('filterService', function() {
        return {
            activeFilters: {},
            searchText: ''
        };
    });





