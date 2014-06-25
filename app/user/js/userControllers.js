'use strict';

function UserFilterCtrl($scope, userFilterService) {
    $scope.userFilterService = userFilterService;
}

function UserCtrl($scope, User, $window, userFilterService) {
    $scope.userFilterService = userFilterService;
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

function UserListCtrl($scope, $http, $templateCache) {

    var method = 'POST';
    var inserturl = '/user';
    $scope.codeStatus = "";
    $scope.save = function() {
        var formData = {
            'username' : this.username,
            'password' : this.password,
            'department' : this.department
        };
        this.username = '';
        this.password = '';
        this.department = '';


        var jdata = 'mydata='+JSON.stringify(formData);

        $http({
            method: method,
            url: inserturl,
            data:  jdata ,
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            cache: $templateCache
        }).
            success(function(response) {
                alert("save user successed!");
                $scope.codeStatus = response.data;
                console.log($scope.codeStatus);

            }).
            error(function(response) {
                alert("save user error!");
                $scope.codeStatus = response || "Request failed";
                console.log($scope.codeStatus);
            });
        $scope.list();
        return false;
    };

    $scope.list = function() {
        var url = '/users';
        //alert(url);
        $http.get(url).
            //$http({url: '127.0.0.1:1212/users', method: 'GET'})
            success(function(data,status,headers,config) {
                //alert("get users success!");
                $scope.users = data;
            }).
            error(function(data,status,headers,config){
                alert("get users error!");
            });
    };

    $scope.list();
}

