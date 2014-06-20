'use strict';

function LogCtrl($scope, Log, $window) {
    //alert('hello, i am here.');
    var str = "#工作总结#             \n\n#工作计划#\n";
    $scope.loginUser = parseProfile($window.sessionStorage.token);
    var username = $scope.loginUser.username;
    $scope.logs = Log.query();
    $scope.message = str;

    $scope.toggleCommentState = function(index){
        $scope.selectedIndex = index;
    };

    $scope.submitComment = function(index){
        var log = $scope.logs[index];
        log.comments.splice(0,0,{id:"",message:log.comment,datetime:new Date(),creator:{"name":username,"department":"集团总部.信息化管理中心.实施推广部"}});
        log.comment = "";
    };

    $scope.submitMesasage = function(){
        $scope.logs.splice(0,0,{id:"",message:$scope.message,datetime:new Date(),creator:{"name":username,"department":"集团总部.信息化管理中心.实施推广部"},comments:[]});
        $scope.message = str;
    };
}

function parseProfile(token){
    var profile = {};
    if (token) {
        var encodedProfile = token.split('.')[1];
        profile = JSON.parse(url_base64_decode(encodedProfile));
    }
    return profile;
}