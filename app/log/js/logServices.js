'use strict';

angular.module('myApp.logServices', ['ngResource']).factory('Log', function($resource){
    return $resource('log/log_resource/:logId.json', {}, {
        query: {method:'GET', params:{logId:'logs'}, isArray:true}
    });
});

