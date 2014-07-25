'use strict';

var logModule = angular.module('myApp.processFilters', []);
logModule.filter('attachmentName', function(){
    var attachmentNameFilter = function(str){
        if(str && str.lastIndexOf('/') != -1){
            return str.substring(str.lastIndexOf('/')+1);
        }else{
            return str;
        }
    };
    return attachmentNameFilter;
});

logModule.filter('attachmentUrl', function(){
    var attachmentNameFilter = function(str){
        if(str && str.lastIndexOf('/') != -1){
            return '/' + str;
        }else{
            return '';
        }
    };
    return attachmentNameFilter;
});


logModule.filter('hasAttachment', function(){
    var attachmentNameFilter = function(str){
        if(str && str.lastIndexOf('/') != -1){
            return true;
        }else{
            return false;
        }
    };
    return attachmentNameFilter;
});