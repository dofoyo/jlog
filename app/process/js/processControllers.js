'use strict';
var pc = angular.module('myApp.processControllers', []);

pc.controller('ProcessCtrl',[
    '$scope',
    '$http',
    '$templateCache',
    '$window',
    '$fileUploader',
    'CommentType',
    'uuid',
    'Processes',
    function($scope, $http, $templateCache, $window,$fileUploader,CommentType,uuid,Processes){
        $scope.loginUser = $window.sessionStorage.token ?  {
            userId:$window.sessionStorage.loginUserId,
            userName:$window.sessionStorage.loginUserName,
            department:$window.sessionStorage.loginUserDepartment
        } : {
            userId:'',
            userName:'',
            department:''
        };

        $scope.getProcesses = function(){
            Processes.query($scope.processes.params,function(data){
                $scope.processes.hasMore  = data.length==$scope.processes.params.limit ? true : false;
                $scope.processes.params.offset += data.length;
                for(var i=0; i<data.length; i++){
                    var process = data[i];

                    process.isCreator= function(){
                        return this.creator.id==$scope.loginUser.userId ? true : false;
                    };

                    process.isAdviser = function(){
                        for(var i=0; i<this.advisers.length; i++){
                            var adviser = this.advisers[i];
                            if($scope.loginUser.userId == adviser.id){
                                return true;
                            }
                        }
                        return false;
                    };

                    process.isExecuter = function(){
                        for(var i=0; i<this.executers.length; i++){
                            var executer = this.executers[i];
                            if($scope.loginUser.userId == executer.id){
                                return true;
                            }
                        }
                        return false;
                    };

                    process.isAuthor = function(){
                        for(var i=0; i<this.executers.length; i++){
                            var executer = this.executers[i];
                            if($scope.loginUser.userId == executer.id
                                && executer.createDatetime.length != 0
                                && executer.completeDatetime.length == 0
                                ){
                                return true;
                            }
                        }
                        return false;
                    };

                    process.hasStoped = function(){
                        return this.stopDatetime.length!=0 ? true : false;
                    };

                    process.hasClosed = function(){
                        return this.closeDatetime.length!=0 ? true : false;
                    };

                    process.toolbar = {
                        yesBtn:false,
                        noBtn:false,
                        userBtn:false,
                        supplementBtn:false,
                        attachmentBtn:false,
                        stopBtn:false,
                        restartBtn:false
                    };

                    process.refreshToolbar = function(){
                        // 未关闭、未终止的流程，发起人和当前处理人都可终止流程
                        this.toolbar.stopBtn = (this.isCreator() || this.isAuthor()) && !this.hasStoped() && !this.hasClosed();

                        // 已关闭或终止的流程，发起人和处理人都能重启流程
                        this.toolbar.restartBtn = (this.hasStoped() || this.hasClosed()) && (this.isExecuter() || this.isCreator());

                        //未关闭、未终止的流程，参与人都可发言，即使是排在后面的处理人，也可先发言。发言并不影响流程的流向
                        this.toolbar.supplementBtn = !this.hasStoped() && !this.hasClosed() && (this.isExecuter() || this.isAdviser() || this.isCreator());

                        //未关闭、未终止的流程，参与人都可发附件，即使是排在后面的处理人，也可先发言。发言并不影响流程的流向
                        this.toolbar.attachmentBtn = !this.hasStoped() && !this.hasClosed() && (this.isExecuter() || this.isAdviser() || this.isCreator());

                        //未关闭、未终止的流程,发起人和当前处理人可拉会签人和处理人进来
                        this.toolbar.userBtn = !this.hasStoped() && !this.hasClosed() && (this.isAuthor() || this.isCreator());

                        //未关闭、未终止的流程，当前的处理人决定流程走向
                        this.toolbar.yesBtn = !this.hasStoped() && !this.hasClosed() && this.isAuthor();

                        //未关闭、未终止的流程，当前的处理人决定流程走向
                        this.toolbar.noBtn = !this.hasStoped() && !this.hasClosed() && this.isAuthor();
                    };

                    process.div = {
                        show:true,
                        yesDiv:true,
                        noDiv:true,
                        userDiv:true,
                        supplementDiv:true,
                        attachmentDiv:true
                    };

                    process.showDiv = function(div){
                        this.div[div] = !this.div[div];
                        if(div != 'yesDiv'){
                            this.div.yesDiv = true;
                        };
                        if(div != 'noDiv'){
                            this.div.noDiv = true;
                        };
                        if(div != 'userDiv'){
                            this.div.userDiv = true;
                        };
                        if(div != 'supplementDiv'){
                            this.div.supplementDiv = true;
                        };
                        if(div != 'attachmentDiv'){
                            this.div.attachmentDiv = true;
                        };
                    };

                    $scope.processes.result.push(process);
                };
            })
        };

        $scope.processes ={
            result:[],
            params:{
                keyWord:'',
                offset:0,
                limit:2,
                type:''   //1-create:我创建的，2-toExecute:待处理, 3-toAdvise:待签，4-toRead:待阅,5-completed:已完成，6-notCompleted:未完成，7-stoped：已终止
            },
            index:-1,
            hasMore:false,
            showProcess: function(index){
                var process = this.result[index];
                process.refreshToolbar();
                if(this.index == index){
                    process.div.show = !process.div.show;
                }else{
                    process.div.show = false;
                }
                this.index = index;
            },
            empty:function(){
                this.result = [];
                this.index = -1;
                this.params.offset = 0;
                this.hasMore = false;
            },
            getProcess:function(){
                return this.result[this.index];
            }
        };

        $scope.formData = {
            data1:'',
            data2:''
        };

        $scope.pageState={
            processType:'',
            userName:'',
            users:[],
            createDiv: false,
            todoDiv: false,
            doneDiv: false,
            showDiv:function(div){
                if(!$window.sessionStorage.token){
                    alert('请登录！');
                } else{
                    var currentDiv = this.createDiv ? 'createDiv': (this.todoDiv ? 'todoDiv' : 'doneDiv');

                    this.createDiv = div == 'createDiv' ? true : false;
                    this.todoDiv   = div == 'todoDiv' ? true : false;
                    this.doneDiv   = div == 'doneDiv' ? true : false;

                    if(this.createDiv && currentDiv!=div){
                        $scope.processes.empty();
                        $scope.processes.params.type = '1'  //我的流程
                        $scope.getProcesses();
                    }

                    if(this.todoDiv && currentDiv!=div){
                        $scope.processes.empty();
                        $scope.processes.params.type = '2'  //todo的默认为待处理
                        $scope.getProcesses();
                    }

                    if(this.doneDiv && currentDiv!=div){
                        $scope.processes.empty();
                        $scope.processes.params.type = '6'  //done的默认为未完成
                        $scope.getProcesses();
                    }
                }
            }
        };

        $scope.getCreates = function(){
            $scope.getProcesses();
        }

    $scope.getAdvises = function(){
        alert('getAdvises, processType=' + $scope.pageState.processType);
    }

    $scope.getReads = function(){
        alert('getReads, processType=' + $scope.pageState.processType);
    }

    $scope.getCompleted = function(){
        alert('getComplete, processType=' + $scope.pageState.processType);
    }

    $scope.getNotCompleted = function(){
        alert('getNotComplete, processType=' + $scope.pageState.processType);
    }

    $scope.getStoped = function(){
        alert('getStoped, processType=' + $scope.pageState.processType);
    }

    $scope.getUsers = function(){
        var params = {
            userName:$scope.pageState.userName
        };
        $http.get('/users',{params:params}).
            success(function(data,status,headers,config) {
                //alert("get users success!");
                $scope.pageState.users = data;
            }).
            error(function(data,status,headers,config){
                alert("get users error!");
            });
    }
    $scope.addExecuter = function(index){
        var user = $scope.pageState.users[index];
        var executer = {
            id:user.userId,
            name:user.userName,
            department:user.department,
            createDatetime: new Date(),
            completeDatetime:''
        };
        $scope.pageState.users.splice(index,1);
        var process = $scope.processes.getProcess();
        process.executers.push(executer);

        executer.add = true;
        executer.processId = process.id;
        var jdata = 'mydata='+JSON.stringify(executer);
        saveProcessExecuter($http,$templateCache,jdata);

    }
    $scope.delExecuter = function(index){
        var process = $scope.processes.getProcess();
        var executer = process.executers[index];
        process.executers.splice(index,1);
        var user = {
            userId:executer.id,
            userName:executer.name,
            department:executer.department
        };
        $scope.pageState.users.push(user);

        executer.del = true;
        executer.processId = process.id;
        //alert(executer.id);
        var jdata = 'mydata='+JSON.stringify(executer);
        saveProcessExecuter($http,$templateCache,jdata);
    }

    $scope.addAdviser = function(index){
        var user = $scope.pageState.users[index];
        var adviser = {
            id:user.userId,
            name:user.userName,
            department:user.department,
            createDatetime: new Date(),
            completeDatetime:''
        };

        $scope.pageState.users.splice(index,1);
        var process = $scope.processes.getProcess();
        process.advisers.push(adviser);

        adviser.add = true;
        adviser.processId = process.id;
        var jdata = 'mydata='+JSON.stringify(adviser);
        saveProcessAdviser($http,$templateCache,jdata);

    }
    $scope.delAdviser = function(index){
        var process = $scope.processes.getProcess();
        var adviser = process.advisers[index];
        var user = {
            userId:adviser.id,
            userName:adviser.name,
            department:adviser.department
        };

        process.advisers.splice(index,1);
        $scope.pageState.users.push(adviser);

        adviser.del = true;
        adviser.processId = process.id;
        var jdata = 'mydata='+JSON.stringify(adviser);
        saveProcessAdviser($http,$templateCache,jdata);
    }

    $scope.find = function(){
        alert('find by key ' + $scope.pageState.keyWord);
        /*
         $scope.processes = new Array();
         $scope.pageState.offset = 0;
         $scope.getProcesses();
         */

    }

        $scope.submitSupplement = function(){
            var process = $scope.processes.getProcess();

            var msg = $scope.formData.data1;
            var msg = msg.replace(/[\n\r]/g,'').replace(/[\\]/g,'');

            var comment = {
                processId:process.id,
                message:msg,
                datetime:new Date(),
                creator:{
                    "id":$scope.loginUser.userId,
                    "name":$scope.loginUser.userName,
                    "department":$scope.loginUser.department
                }
            };

            var jdata = 'mydata='+JSON.stringify(comment);

            saveProcessComment($http,$templateCache,jdata);

            process.comments.splice(0,0,comment);
            $scope.formData.data1 = "";
        };

    $scope.create = function(){
        if($window.sessionStorage.token){
            var subject = $scope.formData.data1;
            var description = $scope.formData.data2;
            var id = uuid;
            subject = subject.replace(/[\n\r]/g,'').replace(/[\\]/g,'');
            description = description.replace(/[\n\r]/g,'').replace(/[\\]/g,'');

            var process = {
                id:id,
                subject:subject,
                description:description,
                createDatetime:new Date(),
                completeDatetime:"",
                closeDatetime:"",
                stopDatetime:"",
                creator:{
                    "id":$scope.loginUser.userId,
                    "name":$scope.loginUser.userName,
                    "department":$scope.loginUser.department
                },
                comments:[],
                readers:[],
                advisers:[],
                executers:[]
            };

            var jdata = 'mydata='+JSON.stringify(process);
            //alert('save ' +jdata );
            saveProcess($http,$templateCache,jdata);

            $scope.processes.empty();
            $scope.processes.params.type = '1'  //我的流程
            $scope.getProcesses();

            $scope.formData.data1 = '';
            $scope.formData.data2 = '';

        }else{
            alert('请先登录');
        }
    };

    //-------- file upload-----------
    var uploader = $scope.uploader = $fileUploader.create({
        scope: $scope,                          // to automatically update the html. Default: $rootScope
        url: '/upload',
        formData: [
            { key: 'value' }
        ]
    });

    // REGISTER HANDLERS
    uploader.bind('success', function (event, xhr, item, response) {
        $scope.formData.data1 = response.url;
        $scope.submitSupplement();
    });

    uploader.bind('completeall', function (event, items) {
        //alert('Complete all', items);
        uploader.clearQueue();
    });

    }]);


function saveProcessComment($http,$templateCache,jdata ){
    var method = 'POST';
    var url = '/process-comment';
    $http({
        method: method,
        url: url,
        data:  jdata ,
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        cache: $templateCache
    }).
        success(function(response) {
            //alert("save process successed!");
        }).
        error(function(response) {
            alert("save comment error!");
        });
}

function saveProcessExecuter($http,$templateCache,jdata ){
    var method = 'POST';
    var url = '/process-executer';
    $http({
        method: method,
        url: url,
        data:  jdata ,
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        cache: $templateCache
    }).
        success(function(response) {
            //alert("save process-executer successed!");
        }).
        error(function(response) {
            alert("save process-executer error!");
        });
}

function saveProcessAdviser($http,$templateCache,jdata ){
    var method = 'POST';
    var url = '/process-adviser';
    $http({
        method: method,
        url: url,
        data:  jdata ,
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        cache: $templateCache
    }).
        success(function(response) {
            //alert("save process-adviser successed!");
        }).
        error(function(response) {
            alert("save process-adviser error!");
        });
}

function saveProcess($http,$templateCache,jdata ){
    //alert(jdata);
    var method = 'POST';
    var url = '/process';
    $http({
        method: method,
        url: url,
        data:  jdata ,
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        cache: $templateCache
    }).
        success(function(response) {
            //alert("save process successed!");
        }).
        error(function(response) {
            alert("save process error!");
        });
}

