'use strict';

function UserFilterCtrl($scope, userFilterService) {
    $scope.userFilterService = userFilterService;
};

function UserCtrl($scope, User, $window, userFilterService) {
    //alert('it is UserCtrl');
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
