'use strict';

var logModule = angular.module('myApp.taskFilters', []);
logModule.filter('notAdvisersAndExecters', function(){
    var attachmentNameFilter = function(users){
        if(str && str.lastIndexOf('/') != -1){
            return str.substring(str.lastIndexOf('/')+1);
        }else{
            return str;
        }
    };
    return attachmentNameFilter;
});
