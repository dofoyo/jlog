'use strict';

function LogCtrl($scope, $http, $templateCache, $window) {
    var str = "工作总结：\n\n工作计划：\n";

    $scope.message = str;

    $scope.pageState={
        writeShow: false
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

    $scope.getLogs = function(level){
        var params = {
            creatorId:$scope.loginUser.userId,
            page:$scope.pageState.page,
            limit:$scope.pageState.limit
        };
        switch (level){
            case 0:
                var url = '/logs/own';
                getLog($scope,$http,url,params);
                break;
            case 1:
                var url = '/logs/one';
                getLog($scope,$http,url,params);
                break;
            case 2:
                var url = '/logs/two';
                getLog($scope,$http,url,params);
                break;
            case 3:
                var url = '/logs/three';
                getLog($scope,$http,url,params);
                break;
            case 4:
                var url = '/logs/four';
                getLog($scope,$http,url,params);
                break;
        }

    };

    $scope.getLogs(0);

    $scope.toggleCommentState = function(index){
        $scope.selectedIndex = index;
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
}

function getLog($scope, $http,url, params){
    $http.get(url,{params:params}).
        success(function(data,status,headers,config) {
            //alert('get logs successed!');
            $scope.logs = data;
        }).
        error(function(data,status,headers,config){
            alert("get logs error!");
            alert(data);
        });
}

function saveComment($http,$templateCache,jdata ){
    //alert(jdata);
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