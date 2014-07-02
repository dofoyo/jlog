'use strict';

function UserCtrl($scope,$http,$templateCache,$window, userFilterService) {
    $scope.userFilterService = userFilterService;
    $scope.loginUser = $window.sessionStorage.token ?
    {
        userId:$window.sessionStorage.loginUserId,
        userName:$window.sessionStorage.loginUserName,
        department:$window.sessionStorage.loginUserDepartment,
        bosses:$window.sessionStorage.loginUserBosses,
        followers:$window.sessionStorage.loginUserFollowers,
        tobeBosses:$window.sessionStorage.loginUserTobeBosses,
        tobeFollowers:$window.sessionStorage.loginUserTobeFollowers
    }:
    {
        userId:'',
        userName:'',
        department:'',
        bosses:'',
        followers:'',
        tobeBosses:'',
        tobeFollowers:''
    };


    $scope.getList = function() {
        if($scope.loginUser.userId.length>0){
            var params = {
                userName:userFilterService.searchText,
                loginUserId:$scope.loginUser.userId
            };
            $http.get('/users',{params:params}).
                success(function(data,status,headers,config) {
                    //alert("get users success!");
                    $scope.users = data;
                }).
                error(function(data,status,headers,config){
                    alert("get users error!");
                });
        }
    };
    $scope.getList();
    //$scope.users = User.query();

    $scope.addTobeMyFollower = function(index){
        var user = $scope.users[index];
        user.tobeBosses = user.tobeBosses + "," + $scope.loginUser.userId;
        user.tobeMyFollower = true;
        $scope.saveTobeBosses(user.userId,user.tobeBosses);

        var myid = $window.sessionStorage.loginUserId;
        var tobeFollowers = $scope.loginUser.tobeFollowers + ',' + user.userId;
        $window.sessionStorage.loginUserTobeFollowers = tobeFollowers;
        $scope.loginUser.tobeFollowers = tobeFollowers;
        $scope.saveTobeFollowers(myid,tobeFollowers);
    }

    $scope.deleteTobeMyFollower = function(index){
        var myid = $window.sessionStorage.loginUserId; //dyr

        var user = $scope.users[index];  //rhb
        var tobeBosses = user.tobeBosses;
        tobeBosses = cutString(tobeBosses,myid);
        user.tobeBosses = tobeBosses;
        user.tobeMyFollower = false;
        $scope.saveTobeBosses(user.userId,tobeBosses);

        var tobeFollowers = $scope.loginUser.tobeFollowers;
        tobeFollowers = cutString(tobeFollowers,user.userId);
        $window.sessionStorage.loginUserTobeFollowers = tobeFollowers;
        $scope.loginUser.tobeFollowers = tobeFollowers;
        $scope.saveTobeFollowers(myid,tobeFollowers);
    }

    $scope.deleteTobeMyBoss = function(index){
        var myid = $window.sessionStorage.loginUserId; //dyr

        var user = $scope.users[index];  //rhb
        var tobeFollowers = user.tobeFollowers;
        tobeFollowers = cutString(tobeFollowers,myid);
        user.tobeFollowers = tobeFollowers;
        user.tobeMyBoss = false;
        $scope.saveTobeFollowers(user.userId,tobeFollowers);

        var tobeBosses = $scope.loginUser.tobeBosses;
        tobeBosses = cutString(tobeBosses,user.userId);
        $window.sessionStorage.loginUserTobeBosses = tobeBosses;
        $scope.loginUser.tobeBosses = tobeBosses;
        $scope.saveTobeBosses(myid,tobeBosses);
    }

    $scope.addFollower = function(index){
        var user = $scope.users[index];
        user.bosses = user.bosses + "," + $scope.loginUser.userId;
        user.isMyFollower = true;
        $scope.saveBosses(user.userId,user.bosses);

        var myid = $window.sessionStorage.loginUserId;
        var myFollowers = $scope.loginUser.followers + ',' + user.userId;
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
        $scope.saveBosses(user.userId,bosses);

        var myid = $window.sessionStorage.loginUserId;
        var myFollowers = $scope.loginUser.followers;
        myFollowers = cutString(myFollowers,user.userId);
        $window.sessionStorage.loginUserFollowers = myFollowers;
        $scope.loginUser.followers = myFollowers;
        $scope.saveFollowers(myid,myFollowers);
    }

    $scope.addBoss = function(index){
        var user = $scope.users[index];
        user.followers = user.followers + "," + $scope.loginUser.userId;
        user.isMyBoss = true;
        $scope.saveFollowers(user.userId,user.followers);

        var myid = $scope.loginUser.userId;
        var myBosses = $scope.loginUser.bosses + ',' + user.userId;
        $window.sessionStorage.loginUserBosses = myBosses;
        $scope.loginUser.bosses = myBosses;
        $scope.saveBosses(myid,myBosses);
    }

    $scope.deleteBoss = function(index){
        var myid = $scope.loginUser.userId;

        var user = $scope.users[index];
        var followers = user.followers;
        followers = cutString(followers,myid);
        user.followers = followers;
        user.isMyBoss = false;
        $scope.saveFollowers(user.userId,followers);

        var myid = $scope.loginUser.userId;
        var myBosses = $scope.loginUser.bosses;
        myBosses = cutString(myBosses,user.userId);
        $window.sessionStorage.loginUserBosses = myBosses;
        $scope.loginUser.bosses = myBosses;
        $scope.saveBosses(myid,myBosses);

    }

    $scope.agreeTobeMyBoss = function(index){
        $scope.addBoss(index);
        $scope.deleteTobeMyBoss(index);
    }

    $scope.disagreeTobeMyBoss = function(index){
        $scope.deleteTobeMyBoss(index);
    }

    $scope.saveTobeBosses = function(userId, tobeBosses){
        var formData = {
            'userId':userId,
            'tobeBosses':tobeBosses
        };
        var jdata = 'mydata='+JSON.stringify(formData);

        var method = 'POST';
        var inserturl = '/user/tobebosses';
        $http({
            method: method,
            url: inserturl,
            data:  jdata ,
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            cache: $templateCache
        }).
            success(function(response) {
                //alert("save tobeBosses successed!");
                $scope.codeStatus = response.data;
                console.log($scope.codeStatus);

            }).
            error(function(response) {
                alert("save tobeBosses error!");
                $scope.codeStatus = response || "Request failed";
                console.log($scope.codeStatus);
            });

    }

    $scope.saveTobeFollowers = function(userId, tobeFollowers){
        var formData = {
            'userId':userId,
            'tobeFollowers':tobeFollowers
        };
        var jdata = 'mydata='+JSON.stringify(formData);

        var method = 'POST';
        var inserturl = '/user/tobefollowers';
        $http({
            method: method,
            url: inserturl,
            data:  jdata ,
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            cache: $templateCache
        }).
            success(function(response) {
                //alert("save tobeFollowers successed!");
                $scope.codeStatus = response.data;
                console.log($scope.codeStatus);

            }).
            error(function(response) {
                alert("save tobeFollowers error!");
                $scope.codeStatus = response || "Request failed";
                console.log($scope.codeStatus);
            });

    }

    $scope.saveBosses = function(userId, bosses){
        var formData = {
            'userId':userId,
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

    $scope.saveFollowers = function(userId, followers){
        var formData = {
            'userId':userId,
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

    $scope.saveTobeBossAndFollower = function(bossId,followerId){

    }


    $scope.saveTobeFollower = function(userId,followerId){
        var formData = {
            'userId':userId,
            'followerId':followerId
        };
        var jdata = 'mydata='+JSON.stringify(formData);

        var method = 'POST';
        var inserturl = '/user/tobefollower';
        $http({
            method: method,
            url: inserturl,
            data:  jdata ,
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            cache: $templateCache
        }).
            success(function(response) {
                alert("save tobefollower successed!");

            }).
            error(function(response) {
                alert("save tobefollower error!");
            });
    }

    $scope.saveBeFollower = function(userId,followerId){
        var formData = {
            'userId':userId,
            'followerId':followerId
        };
        var jdata = 'mydata='+JSON.stringify(formData);

        var method = 'POST';
        var inserturl = '/user/befollower';
        $http({
            method: method,
            url: inserturl,
            data:  jdata ,
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            cache: $templateCache
        }).
            success(function(response) {
                alert("save follower successed!");

            }).
            error(function(response) {
                alert("save follower error!");
            });
    }

    $scope.saveNotFollower = function(userId,followerId){
        var formData = {
            'userId':userId,
            'followerId':followerId
        };
        var jdata = 'mydata='+JSON.stringify(formData);

        var method = 'POST';
        var inserturl = '/user/notfollower';
        $http({
            method: method,
            url: inserturl,
            data:  jdata ,
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            cache: $templateCache
        }).
            success(function(response) {
                alert("not follower successed!");

            }).
            error(function(response) {
                alert("not follower error!");
            });
    }
    //$scope.saveTobeFollower('00285249A93A148667611007','4379825838124A4751862357');
    //$scope.saveBeFollower('00285249A93A148667611007','4379825838124A4751862357');
    $scope.saveNotFollower('00285249A93A148667611007','4379825838124A4751862357');
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