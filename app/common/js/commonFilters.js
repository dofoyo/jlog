'use strict';

/* Filters */

var mf = angular.module('common.filters', []);

mf.filter('interpolate', ['version', function(version) {
    return function(text) {
      return String(text).replace(/\%VERSION\%/mg, version);
    };
  }]);

mf.filter('attachmentName', function(){
    var attachmentNameFilter = function(str){
        if(str && str.lastIndexOf('/') != -1){
            return str.substring(str.lastIndexOf('/')+1);
        }else{
            return str;
        }
    };
    return attachmentNameFilter;
});

mf.filter('attachmentUrl', function(){
    var attachmentNameFilter = function(str){
        if(str && str.lastIndexOf('/') != -1){
            return '/' + str;
        }else{
            return '';
        }
    };
    return attachmentNameFilter;
});


mf.filter('hasAttachment', function(){
    var attachmentNameFilter = function(str){
        if(str && str.lastIndexOf('/') != -1){
            return true;
        }else{
            return false;
        }
    };
    return attachmentNameFilter;
});