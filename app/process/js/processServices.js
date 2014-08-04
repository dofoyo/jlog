'use strict';
var pm = angular.module('myApp.processServices', []);

pm.constant('CommentType',{
    EXECUTER:0,
    ADVISER:1,
    SUPPLEMENT:2
});

pm.factory('Processes', function($resource){
    return $resource('/processes');
});


pm.factory('Process', function($resource){
    return $resource('/process');
});

