'use strict';

function LogCtrl($scope, $http, $templateCache, $window) {
    var str = "工作总结：\n\n工作计划：\n";
    $scope.message = str;

    $scope.loginUser = parseProfile($window.sessionStorage.token);

    //$scope.logs = Log.query();  get logs from logServices
    //$scope.list = getLog($scope,$http,'');
    $scope.list = getLog($scope,$http,'');
    //$scope.list();

    $scope.toggleCommentState = function(index){
        $scope.selectedIndex = index;
    };

    $scope.submitComment = function(index){
        var log = $scope.logs[index];

        var msg = log.comment;
        var msg = msg.replace(/[\n\r]/g,'').replace(/[\\]/g,'').replace("工作计划","    工作计划");

        var comment = {
            parentid:log.id,
            message:msg,
            datetime:new Date(),
            creator:{
                "id":$scope.loginUser.id,
                "name":$scope.loginUser.username,
                "department":$scope.loginUser.department
            }
        };

        log.comments.splice(0,0,comment);

        var jdata = 'mydata='+JSON.stringify(comment);

        saveLog($http,$templateCache,jdata);

        log.comment = "";
    };

    $scope.submitLog = function(){
        var msg = $scope.message;
        var msg = msg.replace(/[\n\r]/g,'').replace(/[\\]/g,'').replace("工作计划","    工作计划");

        var log = {
            parentid:"",
            message:msg,
            datetime:new Date(),
            creator:{
                "id":$scope.loginUser.id,
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

function getLog($scope, $http, parentid){
    var url = '/logs';
    $http.get(url).
        success(function(data,status,headers,config) {
            //alert('get logs successed!');
            $scope.logs = data;
        }).
        error(function(data,status,headers,config){
            alert("get logs error!");
        });
}

function saveLog($http,$templateCache,jdata ){
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
            alert("save log successed!");
            $scope.codeStatus = response.data;
            console.log($scope.codeStatus);
        }).
        error(function(response) {
            alert("save log error!");
            $scope.codeStatus = response || "Request failed";
            console.log($scope.codeStatus);
        });
}

function parseProfile(token){
    var profile = {};
    if (token) {
        var encodedProfile = token.split('.')[1];
        profile = JSON.parse(url_base64_decode(encodedProfile));
    }
    return profile;
}
