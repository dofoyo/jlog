'use strict';

/* Controllers */
angular.module('myApp.controllers', [])
    .controller('MyCtrl1', ['$scope', function($scope) {

    }])
    .controller('MyCtrl2', ['$scope', function($scope) {

    }])
    .controller('MyCtrl3', ['$scope', function($scope) {

    }])
    .controller('MyCtrl4', ['$scope', function($scope) {

  }]);

function FilterCtrl($scope, filterService) {
    $scope.filterService = filterService;
};

function UserCtrl($scope, User, $window, filterService) {
    $scope.filterService = filterService;
    $scope.loginUser = parseProfile($window.sessionStorage.token);
    $scope.users = User.query();

    $scope.refresh = function(){
        var username = $scope.loginUser.username;
        //alert(username);
        for(var i=0; i<$scope.users.length; i++){
            var user = $scope.users[i];
            user.isMyBoss = user.bosses.indexOf(username)==-1 ? false : true;
            user.isMyFollower = user.followers.indexOf(username)==-1 ? false : true;
            user.tobeMyBoss = user.tobeBosses.indexOf(username)==-1 ? false : true;
            user.isMyself = user.name==username ? true : false;
        }
    }

    $scope.addFollower = function(index){
        var username = $scope.loginUser.username;
        var user = $scope.users[index];
        user.followers = user.followers + "," + username;
        user.isMyFollower = true;
    }

    $scope.deleteFollower = function(index){
        var username = $scope.loginUser.username;
        var user = $scope.users[index];
        user.followers.replace(username,"");
        user.isMyFollower = false;
    }
    $scope.addBoss = function(index){
        var username = $scope.loginUser.username;
        var user = $scope.users[index];
        user.bosses = user.bosses + "," + username;
        user.isMyBoss = true;
    }

    $scope.deleteBoss = function(index){
        var username = $scope.loginUser.username;
        var user = $scope.users[index];
        user.bosses.replace(username,"");
        user.isMyBoss = false;
    }

    $scope.agreeMyBoss = function(index){

    }

    $scope.disagreeMyBoss = function(index){

    }
}

function LogCtrl($scope, Log, $window) {
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

function LoginCtrl($scope, $http, $window) {
    //$scope.$apply(function () {
        $scope.loginUser = parseProfile($window.sessionStorage.token);
    //});
    $scope.isAuthenticated = $window.sessionStorage.token ? true : false;
    $scope.welcome = $scope.isAuthenticated ? "Hi, " + $scope.loginUser.username + "! you has already logined." : "";
    $scope.message = '';

    $scope.submit = function () {
        $http
            .post('/authenticate', $scope.loginUser)
            .success(function (data, status, headers, config) {
                $window.sessionStorage.token = data.token;
                $scope.isAuthenticated = true;
                var profile = parseProfile(data.token);
                $scope.welcome = 'Welcome ' + profile.username + '!';
            })
            .error(function (data, status, headers, config) {
                // Erase the token if the user fails to log in
                //delete $window.sessionStorage.token;
                //$scope.isAuthenticated = false;

                // Handle login errors here
                $scope.error = 'Error: Invalid user or password';
                //$scope.welcome = '';
            });
    };

    $scope.logout = function () {
        $scope.welcome = '';
        $scope.message = '';
        $scope.isAuthenticated = false;
        //$scope.$apply(function () {
            $scope.loginUser = {};
        //});
        delete $window.sessionStorage.token;
    };

    $scope.callRestricted = function () {
        $http({url: '/api/restricted', method: 'GET'})
            .success(function (data, status, headers, config) {
                $scope.message = $scope.message + ' ' + data.name;
            })
            .error(function (data, status, headers, config) {
                alert(data);
            });
    };

}

function url_base64_decode(str) {
    var output = str.replace('-', '+').replace('_', '/');
    switch (output.length % 4) {
        case 0:
            break;
        case 2:
            output += '==';
            break;
        case 3:
            output += '=';
            break;
        default:
            throw 'Illegal base64url string!';
    }
    return window.atob(output); //polifyll https://github.com/davidchambers/Base64.js
}

function parseProfile(token){
    var profile = {};
    if (token) {
        var encodedProfile = token.split('.')[1];
        profile = JSON.parse(url_base64_decode(encodedProfile));
    }
    return profile;
}
