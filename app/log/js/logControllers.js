'use strict';

function LogCtrl($scope, Log, $window) {
    //alert('hello, i am here.');
    var str = "#工作总结#             \n\n#工作计划#\n";
    $scope.message = str;

    $scope.loginUser = parseProfile($window.sessionStorage.token);

    $scope.logs = Log.query();

    $scope.toggleCommentState = function(index){
        $scope.selectedIndex = index;
    };

    $scope.submitComment = function(index){
        var log = $scope.logs[index];
        var comment = {
            id:"",
            message:log.comment,
            datetime:new Date(),
            creator:{
                "id":$scope.loginUser.id,
                "name":$scope.loginUser.username,
                "department":$scope.loginUser.department
            }
        };
        log.comments.splice(0,0,comment);
        log.comment = "";
    };

    $scope.submitMesasage = function(){
        var message = {
            id:"",
            message:$scope.message,
            datetime:new Date(),
            creator:{
                "id":$scope.loginUser.id,
                "name":$scope.loginUser.username,
                "department":$scope.loginUser.department
            },
            comments:[]
        };
        $scope.logs.splice(0,0,message);
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