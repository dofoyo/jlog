'use strict';

function LoginCtrl($scope, $http, $window) {
    //$scope.$apply(function () {
        $scope.loginUser = parseProfile($window.sessionStorage.token);
    //});
    $scope.isAuthenticated = $window.sessionStorage.token ? true : false;
    $scope.welcome = $scope.isAuthenticated ? "Hi, " + $scope.loginUser.username + "(id:" + $scope.loginUser.id  + ",department:" + $scope.loginUser.department + ",password:" + $scope.loginUser.password  + ")! you has already logined." : "";
    $scope.message = '';

    $scope.login = function () {
        $http
            .post('/authenticate', $scope.loginUser)
            .success(function (data, status, headers, config) {
                alert('authenticate successed!');
                $window.sessionStorage.token = data.token;
                $scope.isAuthenticated = true;
                var profile = parseProfile(data.token);
                $scope.welcome = 'Welcome ' + profile.username + '!';
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
        //$scope.$apply(function () {
            $scope.loginUser = {};
        //});
        delete $window.sessionStorage.token;
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
    //return window.atob(output); //polifyll https://github.com/davidchambers/Base64.js
    return unescape(decodeURIComponent(window.atob(output)));
}

