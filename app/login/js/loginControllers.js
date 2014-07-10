'use strict';

function LoginCtrl($scope, $http, $window) {

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

    //allPrpos($scope.loginUser);
    $scope.isAuthenticated = $window.sessionStorage.token ? true : false;
    $scope.loginMessage = $scope.isAuthenticated  ? $scope.loginUser.userName : "登录";
    $scope.message = '';

    $scope.login = function () {
        $http
            .post('/authenticate', $scope.loginUser)
            .success(function (data, status, headers, config) {
                //alert('authenticate successed!');
                $window.sessionStorage.token = data.token;
                $window.sessionStorage.loginUserId = data.loginUser.userId;
                $window.sessionStorage.loginUserName = data.loginUser.userName;
                $window.sessionStorage.loginUserDepartment = data.loginUser.department;
                $scope.loginUser = {
                     userId:$window.sessionStorage.loginUserId,
                     userName:$window.sessionStorage.loginUserName,
                     department:$window.sessionStorage.loginUserDepartment
                };
                $scope.isAuthenticated = true;
                $scope.loginMessage = $scope.loginUser.userName;
                location.reload();
            })
            .error(function (data, status, headers, config) {
                alert('authenticate ERROR!');
                $scope.error = 'Error: Invalid user or password';
            });
    };

    $scope.logout = function () {
        $scope.loginMessage = '登录';
        $scope.message = '';
        $scope.isAuthenticated = false;
        $scope.loginUser = {userId:'',userName:'',department:''};
        delete $window.sessionStorage.token;
        delete $window.sessionStorage.loginUserId;
        delete $window.sessionStorage.loginUserName;
        delete $window.sessionStorage.loginUserDepartment;
        location.reload();
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
        $http.get(url,{params:{userId:$scope.loginUser.userId}}).
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