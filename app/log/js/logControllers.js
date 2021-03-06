'use strict';

function LogCtrl($scope, $http, $templateCache, $window,$fileUploader) {
    var str = "工作总结：\n\n工作计划：\n";

    $scope.logs = new Array();

    $scope.attachmentIndex = -1;

    $scope.message = str;

    $scope.pageState={
        userName:'',
        keyWord:'',
        findShow: false,
        writeLogShow: false,
        writeCommentShow: true,
        attachmentShow: true,
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
            level:$scope.pageState.level,
            userName:$scope.pageState.userName,
            keyWord:$scope.pageState.keyWord
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

    $scope.find = function(){
        $scope.logs = new Array();
        $scope.pageState.offset = 0;
        $scope.getLogs();
    }

    $scope.resetFind = function(){
        $scope.pageState.userName = '';
        $scope.pageState.keyWord = '';
    }

    $scope.getLogs();

    $scope.toggleCommentState = function(index){
        $scope.pageState.writeCommentShow = ! $scope.pageState.writeCommentShow;
        $scope.commentIndex = index;
        $scope.attachmentIndex = -1;

    };

    $scope.toggleAttachmentState = function(index){
        $scope.pageState.attachmentShow = ! $scope.pageState.attachmentShow;
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

        saveLogComment($http,$templateCache,jdata);

        log.comments.splice(0,0,comment);
        log.comment = "";
        $scope.pageState.writeCommentShow = ! $scope.pageState.writeCommentShow;
        $scope.pageState.attachmentShow = ! $scope.pageState.attachmentShow;
    };

    $scope.submitLog = function(){
        if($window.sessionStorage.token){
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
        }else{
            alert('请先登录');
        }
    };

    $scope.setWriteLogShow = function(){
        $scope.pageState.writeLogShow = !$scope.pageState.writeLogShow;
        $scope.pageState.findShow = false;
    };

    $scope.setFindShow = function(){
        $scope.pageState.writeLogShow = false;
        $scope.pageState.findShow = !$scope.pageState.findShow;
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
    uploader.bind('success', function (event, xhr, item, response) {
        var log = $scope.logs[$scope.attachmentIndex];
        log.comment = response.url;
        $scope.submitComment($scope.attachmentIndex);

        //alert('Success', xhr, item, response);
    });
    uploader.bind('completeall', function (event, items) {
        //alert('Complete all', items);
        uploader.clearQueue();
    });
/*
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
    uploader.bind('cancel', function (event, xhr, item) {
        //alert('Cancel', xhr, item);
    });

    uploader.bind('error', function (event, xhr, item, response) {
        //alert('Error', xhr, item, response);
    });

    uploader.bind('progressall', function (event, progress) {
       //alert('Total progress: ' + progress);
    });

     uploader.bind('complete', function (event, xhr, item, response) {
        //alert('Complete', xhr, item, response);
         //item.remove();
     });
*/
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

function saveLogComment($http,$templateCache,jdata ){
    var method = 'POST';
    var url = '/log-comment';
    $http({
        method: method,
        url: url,
        data:  jdata ,
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        cache: $templateCache
    }).
        success(function(response) {
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
