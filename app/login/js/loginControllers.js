'use strict';

function LoginCtrl($scope, $http, $window) {

    $scope.loginUser = $window.sessionStorage.token ?
                        {userid:$window.sessionStorage.loginUserId,username:$window.sessionStorage.loginUserName,department:$window.sessionStorage.loginUserDepartment} :
                        {userid:'0874A3A42416394A65111025',username:'',department:''};

    //allPrpos($scope.loginUser);
    $scope.isAuthenticated = $window.sessionStorage.token ? true : false;
    $scope.welcome = $scope.isAuthenticated  ? "Hi, " + $scope.loginUser.username + "! you has already logined." : "";
    $scope.message = '';

    $scope.login = function () {
        $http
            .post('/authenticate', $scope.loginUser)
            .success(function (data, status, headers, config) {
                alert('authenticate successed!');
                $window.sessionStorage.token = data.token;
                $window.sessionStorage.loginUserId = data.loginUser.userid;
                $window.sessionStorage.loginUserName = data.loginUser.username;
                $window.sessionStorage.loginUserDepartment = data.loginUser.department;
                $scope.loginUser = {userid:$window.sessionStorage.loginUserId,username:$window.sessionStorage.loginUserName,department:$window.sessionStorage.loginUserDepartment};
                //$scope.loginUser = data.loginUser;
                $scope.isAuthenticated = true;
                //var profile = parseProfile(data.token);
                //$scope.welcome = 'Welcome ' + profile.userid + '!';
                $scope.welcome = 'Welcome ' + data.loginUser.username + '!';
            })
            .error(function (data, status, headers, config) {
                alert('authenticate ERROR!');
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
        $scope.loginUser = {userid:'',username:'',department:''};
        delete $window.sessionStorage.token;
        delete $window.sessionStorage.loginUserId;
        delete $window.sessionStorage.loginUserName;
        delete $window.sessionStorage.loginUserDepartment;
    };

    $scope.callRestricted = function () {
        $http({url: '/api/restricted', method: 'GET'})
            .success(function (data, status, headers, config) {
                $scope.message = $scope.message + ', ' + data.name;
            })
            .error(function (data, status, headers, config) {
                alert(data);
            });
    };

    $scope.getLoginUser = function() {
        var url = '/user';
        //alert($scope.loginUser.userid);
        $http.get(url,{params:{userid:$scope.loginUser.userid}}).
            success(function(data,status,headers,config) {
                allPrpos(data);
                $scope.loginUser = data;
            }).
            error(function(data,status,headers,config){
                alert("get users error!");
            });
    };
}

function parseProfile(token){
    var profile = {};
    if (token) {
        var encodedProfile = token.split('.')[1];
        //alert(encodedProfile);
        profile = JSON.parse(url_base64_decode(encodedProfile));
    }
    return profile;
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
    //return unescape(decodeURIComponent(window.atob(output)));
}

function allPrpos(obj) {
    // 用来保存所有的属性名称和值
    var props = "";
    // 开始遍历
    for(var p in obj){
        // 方法
        if(typeof(obj[p])=="function"){
            obj[p]();
        }else{
            // p 为属性名称，obj[p]为对应属性的值
            props+= p + "=" + obj[p] + "\n";
        }
    }
    // 最后显示所有的属性
    alert(props);
}