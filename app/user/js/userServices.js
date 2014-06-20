'use strict';

angular.module('myApp.userServices', ['ngResource']).factory('User', function($resource){
    return $resource('user/user_resource/:userId.json', {}, {
        query: {method:'GET', params:{userId:'users'}, isArray:true}
    });
});
angular.module('myApp.userFilterServices', []).
    factory('userFilterService', function() {
        return {
            activeFilters: {},
            searchText: ''
        };
    });

