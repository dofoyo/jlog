'use strict';

angular.module('myApp.logServices', ['ngResource']).factory('Log', function($resource){
    //alert('ngResource');
    return $resource('log/log_resource/:logId', {}, {
        query: {method:'GET', params:{logId:'logs.json'}, isArray:true}
    });
});

