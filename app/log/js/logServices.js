'use strict';

angular.module('log.services', ['ngResource']).factory('Log', function($resource){
    //alert('ngResource');
    return $resource('log/log_resource/:logId', {}, {
        query: {method:'GET', params:{logId:'logs.json'}, isArray:true}
    });
});

