'use strict';

function LogCtrl($scope, $http, $templateCache, $window) {
    var str = "工作总结：\n\n工作计划：\n";
    $scope.message = str;

    $scope.loginUser = $window.sessionStorage.token ?
    {
        userid:$window.sessionStorage.loginUserId,
        username:$window.sessionStorage.loginUserName,
        department:$window.sessionStorage.loginUserDepartment,
        bosses:$window.sessionStorage.loginUserBosses,
        followers:$window.sessionStorage.loginUserFollowers,
        tobebosses:$window.sessionStorage.loginUsertobebosses
    }:
    {
        userid:'',
        username:'',
        department:'',
        bosses:'',
        followers:'',
        tobebosses:''
    };

    var params = {
        creatorid:$scope.loginUser.userid
    };

    $scope.list = getLog($scope,$http,params);

    $scope.toggleCommentState = function(index){
        $scope.selectedIndex = index;
    };

    $scope.submitComment = function(index){
        var log = $scope.logs[index];

        var msg = log.comment;
        var msg = msg.replace(/[\n\r]/g,'').replace(/[\\]/g,'').replace("工作计划","    工作计划");

        var comment = {
            message:msg,
            datetime:new Date(),
            creator:{
                "id":$scope.loginUser.userid,
                "name":$scope.loginUser.username,
                "department":$scope.loginUser.department
            }
        };

        log.comments.splice(0,0,comment);

        var jdata = 'mydata='+JSON.stringify(log);

        saveLog($http,$templateCache,jdata);

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
                "id":$scope.loginUser.userid,
                "name":$scope.loginUser.username,
                "department":$scope.loginUser.department
            },
            comments:[]
        };

        var jdata = 'mydata='+JSON.stringify(log);
        saveLog($http,$templateCache,jdata);

        $scope.logs.splice(0,0,log);
        $scope.message = str;
    };
}

function getLog($scope, $http, params){
    var url = '/logs';
    $http.get(url,{params:params}).
        success(function(data,status,headers,config) {
            //alert('get logs successed!');
            $scope.logs = data;
        }).
        error(function(data,status,headers,config){
            alert("get logs error!");
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