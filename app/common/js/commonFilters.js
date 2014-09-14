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

mf.filter('isPic', function(){
    var attachmentNameFilter = function(str){
        var picReg = new RegExp('\.jpg$|\.jpeg$|\.gif$','i')
        if(picReg.test(str)){
            //console.log(str + ' is pic');
            return true;
        }else{
            //console.log(str + ' is NOT pic');
            return false;
        }
    };
    return attachmentNameFilter;
});