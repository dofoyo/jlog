'use strict';
var pm = angular.module('myApp.taskServices', []);

pm.constant('CommentType',{
    EXECUTER:0,
    ADVISER:1,
    SUPPLEMENT:2
});

pm.factory('Tasks', function($resource){
    return $resource('/tasks');
});


pm.factory('Task', function($resource){
    return $resource('/task');
});

