'use strict';

function UserCtrl($scope,$http,$templateCache,$window, userFilterService) {
    $scope.userFilterService = userFilterService;
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


    $scope.getList = function() {
        //alert('get user list...');
        $http.get('/users',{params:{username:userFilterService.searchText,loginUserId:$scope.loginUser.userid}}).
            success(function(data,status,headers,config) {
                //alert("get users success!");
                $scope.users = data;
            }).
            error(function(data,status,headers,config){
                alert("get users error!");
            });
    };
    $scope.getList();
    //$scope.users = User.query();

    $scope.addFollower = function(index){
        var user = $scope.users[index];
        user.bosses = user.bosses + "," + $scope.loginUser.userid;
        user.isMyFollower = true;
        $scope.saveBosses(user.userid,user.bosses);

        var myid = $window.sessionStorage.loginUserId;
        var myFollowers = $scope.loginUser.followers + ',' + user.userid;
        $window.sessionStorage.loginUserFollowers = myFollowers;
        $scope.loginUser.followers = myFollowers;
        $scope.saveFollowers(myid,myFollowers);
    }

    $scope.deleteFollower = function(index){
        var myid = $window.sessionStorage.loginUserId;

        var user = $scope.users[index];
        var bosses = user.bosses;
        bosses = cutString(bosses,myid);
        user.bosses = bosses;
        user.isMyFollower = false;
        $scope.saveBosses(user.userid,bosses);

        var myid = $window.sessionStorage.loginUserId;
        var myFollowers = $scope.loginUser.followers;
        myFollowers = cutString(myFollowers,user.userid);
        $window.sessionStorage.loginUserFollowers = myFollowers;
        $scope.loginUser.followers = myFollowers;
        $scope.saveFollowers(myid,myFollowers);
    }

    $scope.addBoss = function(index){
        var user = $scope.users[index];
        user.followers = user.followers + "," + $scope.loginUser.userid;
        user.isMyBoss = true;
        $scope.saveFollowers(user.userid,user.followers);

        var myid = $scope.loginUser.userid;
        var myBosses = $scope.loginUser.bosses + ',' + user.userid;
        $window.sessionStorage.loginUserBosses = myBosses;
        $scope.loginUser.bosses = myBosses;
        $scope.saveBosses(myid,myBosses);
    }

    $scope.deleteBoss = function(index){
        var myid = $scope.loginUser.userid;

        var user = $scope.users[index];
        var followers = user.followers;
        followers = cutString(followers,myid);
        user.followers = followers;
        user.isMyBoss = false;
        $scope.saveFollowers(user.userid,followers);

        var myid = $scope.loginUser.userid;
        var myBosses = $scope.loginUser.bosses;
        myBosses = cutString(myBosses,user.userid);
        $window.sessionStorage.loginUserBosses = myBosses;
        $scope.loginUser.bosses = myBosses;
        $scope.saveBosses(myid,myBosses);

    }

    $scope.agreeMyBoss = function(index){

    }

    $scope.disagreeMyBoss = function(index){

    }

    $scope.saveBosses = function(userid, bosses){
        var formData = {
            'userid':userid,
            'bosses':bosses
        };
        var jdata = 'mydata='+JSON.stringify(formData);

        var method = 'POST';
        var inserturl = '/user/bosses';
        $http({
            method: method,
            url: inserturl,
            data:  jdata ,
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            cache: $templateCache
        }).
            success(function(response) {
                //alert("save user'bosses successed!");
                $scope.codeStatus = response.data;
                console.log($scope.codeStatus);

            }).
            error(function(response) {
                alert("save user's bosses error!");
                $scope.codeStatus = response || "Request failed";
                console.log($scope.codeStatus);
            });

    }
    $scope.saveFollowers = function(userid, followers){
        var formData = {
            'userid':userid,
            'followers':followers
        };
        var jdata = 'mydata='+JSON.stringify(formData);

        var method = 'POST';
        var inserturl = '/user/followers';
        $http({
            method: method,
            url: inserturl,
            data:  jdata ,
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            cache: $templateCache
        }).
            success(function(response) {
                //alert("save user'followers successed!");
                $scope.codeStatus = response.data;
                console.log($scope.codeStatus);

            }).
            error(function(response) {
                alert("save user's followers error!");
                $scope.codeStatus = response || "Request failed";
                console.log($scope.codeStatus);
            });

    }
}

function cutString(str1,str2){
    str2 = ',' + str2;
    return str1.replace(str2,'');
}

function UserListCtrl($scope, $http, $templateCache,$window) {

    $scope.search = {};
    $scope.search.username = '';
    $scope.codeStatus = "";
    $scope.save = function() {
        var formData = {
            'userid':uuid(24,11),
            'username' : this.username,
            'password' : this.password,
            'department' : this.department,
            'bosses':'',
            'followers':'',
            'tobebosses':''
        };
        this.userid = '';
        this.username = '';
        this.password = '';
        this.department = '';
        this.bosses = '';
        this.followers = '';
        this.tobebosses = '';


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
        $http.get('/users',{params:{username:$scope.search.username,loginUserId:$scope.loginUser.userid}}).
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
