'use strict';

function UserCtrl($scope,$http,$templateCache,$window, userFilterService) {
    $scope.userFilterService = userFilterService;
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


    $scope.getUnrelated = function() {
        getUsers($scope.loginUser.userId,userFilterService.searchText,$scope,$http,'/users/unrelated');
    };

    $scope.getTobeMyBosses = function() {
        getUsers($scope.loginUser.userId,userFilterService.searchText,$scope,$http,'/users/tobeboss');
    };

    $scope.getMyBosses = function() {
        getUsers($scope.loginUser.userId,userFilterService.searchText,$scope,$http,'/users/boss');
    };

    $scope.getTobeMyFollowers = function() {
        getUsers($scope.loginUser.userId,userFilterService.searchText,$scope,$http,'/users/tobefollower');
    };

    $scope.getMyFollowers = function() {
        getUsers($scope.loginUser.userId,userFilterService.searchText,$scope,$http,'/users/follower');
    };

    $scope.deleteFollower = function(index){
        var url = '/user/notfollower';
        var myId = $window.sessionStorage.loginUserId;
        var user = $scope.users[index];
        var followerId = user.userId;
        saveRelation(myId,followerId,$http,$templateCache,url);
        user.isMyFollower = false;
        user.tobeMyFollower = false;
        user.isMyBoss = false;
        user.tobeMyBoss = false;
    }

    $scope.addTobeMyFollower = function(index){
        var url = '/user/tobefollower';
        var myId = $window.sessionStorage.loginUserId;
        var user = $scope.users[index];
        var followerId = user.userId;
        saveRelation(myId,followerId,$http,$templateCache,url);
        user.isMyFollower = false;
        user.tobeMyFollower = true;
        user.isMyBoss = false;
        user.tobeMyBoss = false;

    }

    $scope.deleteBoss = function(index){
        var url = '/user/notfollower';
        var followerId = $window.sessionStorage.loginUserId; // i was the follower
        var user = $scope.users[index];
        var bossId = user.userId;
        saveRelation(bossId,followerId,$http,$templateCache,url);
        user.isMyFollower = false;
        user.tobeMyFollower = false;
        user.isMyBoss = false;
        user.tobeMyBoss = false;

    }

    $scope.addBoss = function(index){
        var url = '/user/befollower';
        var followerId = $window.sessionStorage.loginUserId; // i will be the follower
        var user = $scope.users[index];
        var bossId = user.userId;
        saveRelation(bossId,followerId,$http,$templateCache,url);

        user.isMyFollower = false;
        user.tobeMyFollower = false;
        user.isMyBoss = true;
        user.tobeMyBoss = false;

    }

    $scope.agreeTobeMyBoss = function(index){
        $scope.addBoss(index);
        user.isMyFollower = false;
        user.tobeMyFollower = false;
        user.isMyBoss = true;
        user.tobeMyBoss = false;
    }

    $scope.disagreeTobeMyBoss = function(index){
        $scope.deleteBoss(index);
        user.isMyFollower = false;
        user.tobeMyFollower = false;
        user.isMyBoss = false;
        user.tobeMyBoss = false;
    }

    $scope.deleteTobeMyFollower = function(index){
        $scope.deleteFollower(index);
        user.isMyFollower = false;
        user.tobeMyFollower = false;
        user.isMyBoss = false;
        user.tobeMyBoss = false;
    }



}

function UserListCtrl($scope, $http, $templateCache,$window) {

    $scope.search = {};
    $scope.search.userName = '';
    $scope.codeStatus = "";
    $scope.save = function() {
        var formData = {
            'userId':uuid(24,11),
            'userName' : this.userName,
            'password' : this.password,
            'department' : this.department
        };
        this.userId = '';
        this.userName = '';
        this.password = '';
        this.department = '';


        var jdata = 'mydata='+JSON.stringify(formData);

        var method = 'POST';
        var inserturl = '/user';
        $http({
            method: method,
            url: inserturl,
            data:  jdata ,
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            cache: $templateCache
        }).
            success(function(response) {
                //alert("save user successed!");
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
        var params = {
            userName:$scope.search.userName
        };
        $http.get('/users',{params:params}).
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

function cutString(str1,str2){
    str2 = ',' + str2;
    return str1.replace(str2,'');
}

function getUsers(userId,userName,$scope,$http,url) {
    if(userId.length>0){
        var params = {
            userName:userName,
            userId:userId
        };
        $http.get(url,{params:params}).
            success(function(data,status,headers,config) {
                //alert("getMyFollowers success!");
                $scope.users = data;
                //alert($scope.users);
            }).
            error(function(data,status,headers,config){
                alert("get users error!");
            });
    }
};

function saveRelation(userId,followerId,$http,$templateCache,url){
    var formData = {
        'userId':userId,
        'followerId':followerId
    };
    var jdata = 'mydata='+JSON.stringify(formData);

    $http({
        method: 'POST',
        url: url,
        data:  jdata ,
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        //,cache: $templateCache
    }).
        success(function(response) {
            //alert(response);
            //alert("save relation successed!");
        }).
        error(function(response) {
            alert(response);
            alert("save relation error!");
        });

}