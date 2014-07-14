'use strict';

function LogCtrl($scope, $http, $templateCache, $window,$fileUploader) {
    var str = "工作总结：\n\n工作计划：\n";

    $scope.logs = new Array();

    $scope.attachmentIndex = -1;

    $scope.message = str;

    $scope.pageState={
        writeShow: false,
        hasMore:true,
        offset:0,
        level:0,
        limit:20
    };


    $scope.loginUser = $window.sessionStorage.token ?
    {
        userId:$window.sessionStorage.loginUserId,
        userName:$window.sessionStorage.loginUserName,
        department:$window.sessionStorage.loginUserDepartment
    }:
    {
        userId:'',
        userName:'',
        department:''
    };

    $scope.getMore = function(){
        $scope.pageState.offset = $scope.logs.length;
        $scope.getLogs();
    }

    $scope.getLogsByLevel = function(level){
        $scope.logs = new Array();
        $scope.pageState.offset = 0;
        $scope.pageState.level = level;
        $scope.getLogs();
    }

    $scope.getLogs = function(){
        var params = {
            creatorId:$scope.loginUser.userId,
            offset:$scope.pageState.offset,
            limit:$scope.pageState.limit,
            level:$scope.pageState.level
        };

        switch ($scope.pageState.level){
            case 0:
                var url = '/logs/own';
                getLogsByHttp($scope,$http,url,params);
                break;
            case 1:
                var url = '/logs/one';
                getLogsByHttp($scope,$http,url,params);
                break;
            case 2:
                var url = '/logs/two';
                getLogsByHttp($scope,$http,url,params);
                break;
            case 3:
                var url = '/logs/three';
                getLogsByHttp($scope,$http,url,params);
                break;
            case 4:
                var url = '/logs/four';
                getLogsByHttp($scope,$http,url,params);
                break;
        }
    };

    $scope.getLogs();

    $scope.toggleCommentState = function(index){
        $scope.commentIndex = index;
        $scope.attachmentIndex = -1;

    };

    $scope.toggleAttachmentState = function(index){
        $scope.attachmentIndex = index;
        $scope.commentIndex = -1;
    };

    $scope.submitComment = function(index){
        var log = $scope.logs[index];

        var msg = log.comment;
        var msg = msg.replace(/[\n\r]/g,'').replace(/[\\]/g,'');

        var comment = {
            logId:log.id,
            message:msg,
            datetime:new Date(),
            creator:{
                "id":$scope.loginUser.userId,
                "name":$scope.loginUser.userName,
                "department":$scope.loginUser.department
            }
        };

        var jdata = 'mydata='+JSON.stringify(comment);

        saveComment($http,$templateCache,jdata);

        log.comments.splice(0,0,comment);
        log.comment = "";
    };

    $scope.submitLog = function(){
        var msg = $scope.message;
        var msg = msg.replace(/[\n\r]/g,'').replace(/[\\]/g,'').replace("工作计划","    工作计划");

        var log = {
            id:uuid(24,11),
            message:msg,
            datetime:new Date(),
            creator:{
                "id":$scope.loginUser.userId,
                "name":$scope.loginUser.userName,
                "department":$scope.loginUser.department
            },
            comments:[]
        };

        var jdata = 'mydata='+JSON.stringify(log);
        saveLog($http,$templateCache,jdata);

        $scope.logs.splice(0,0,log);
        $scope.message = str;
    };

    $scope.setWriteShow = function(){
        $scope.pageState.writeShow = !$scope.pageState.writeShow;
    };


    //-------- file upload-----------
    var uploader = $scope.uploader = $fileUploader.create({
        scope: $scope,                          // to automatically update the html. Default: $rootScope
        url: '/upload',
        formData: [
            { key: 'value' }
        ]
    });

    // REGISTER HANDLERS
    uploader.bind('afteraddingfile', function (event, item) {
        //alert('After adding a file', item);
    });

    uploader.bind('whenaddingfilefailed', function (event, item) {
        //alert('When adding a file failed', item);
    });

    uploader.bind('afteraddingall', function (event, items) {
        //alert('After adding all files', items);
    });

    uploader.bind('beforeupload', function (event, item) {
        //alert('Before upload', item);
    });

    uploader.bind('progress', function (event, item, progress) {
        //alert('Progress: ' + progress, item);
    });
    uploader.bind('success', function (event, xhr, item, response) {
       var log = $scope.logs[$scope.attachmentIndex];
        log.comment = response.url;
        $scope.submitComment($scope.attachmentIndex);
        //alert('Success', xhr, item, response);
    });

    uploader.bind('cancel', function (event, xhr, item) {
        //alert('Cancel', xhr, item);
    });

    uploader.bind('error', function (event, xhr, item, response) {
        //alert('Error', xhr, item, response);
    });

    uploader.bind('progressall', function (event, progress) {
       //alert('Total progress: ' + progress);
    });

    uploader.bind('completeall', function (event, items) {
        //alert('Complete all', items);
        uploader.clearQueue();
    });
     uploader.bind('complete', function (event, xhr, item, response) {
        //alert('Complete', xhr, item, response);
         //item.remove();
     });

}

function getLogsByHttp($scope, $http,url, params){
    $http.get(url,{params:params}).
        success(function(data,status,headers,config) {
            var j = data.length;
            $scope.pageState.hasMore  = j==$scope.pageState.limit ? true : false;
            for(var i=0; i<j; i++){
                $scope.logs.push(data[i]);
            }
        }).
        error(function(data,status,headers,config){
            alert("get logs error!" + data);
        });
}

function saveComment($http,$templateCache,jdata ){
    var method = 'POST';
    var url = '/comment';
    $http({
        method: method,
        url: url,
        data:  jdata ,
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        cache: $templateCache
    }).
        success(function(response) {
            //alert("save log successed!");
        }).
        error(function(response) {
            alert("save comment error!");
        });
}

function saveLog($http,$templateCache,jdata ){
    //alert(jdata);
    var method = 'POST';
    var url = '/log';
    $http({
        method: method,
        url: url,
        data:  jdata ,
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        cache: $templateCache
    }).
        success(function(response) {
            //alert("save log successed!");
        }).
        error(function(response) {
            alert("save log error!");
        });
}

function uuid(len, radix) {
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
    var uuid = [], i;
    radix = radix || chars.length;

    if (len) {
        // Compact form
        for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random()*radix];
    } else {
        // rfc4122, version 4 form
        var r;

        // rfc4122 requires these characters
        uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
        uuid[14] = '4';

        // Fill in random data.  At i==19 set the high bits of clock sequence as
        // per rfc4122, sec. 4.1.5
        for (i = 0; i < 36; i++) {
            if (!uuid[i]) {
                r = 0 | Math.random()*16;
                uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
            }
        }
    }

    return uuid.join('');
}