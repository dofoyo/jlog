var Promise = require('es6-promise').Promise;

var execute = function(obj) {
    // 成功与否随机决定
    if (Math.random() > 0.3) {
        obj.success();
    } else {
        obj.error();
    }
}

var Request = function(name) {
    return new Promise(function(resolve, reject) {
        execute({
            name: name,
            success: function() {
                console.log(name + "攻略成功！");
                resolve();
            },
            error: function() {
                console.log("攻略" + name + "失败，求婚失败！");
                reject();
            }
        });
    });
};

Request("岳父")                                       // 搞定岳父，然后...
    .then(function() { return Request("大伯"); })  // 搞定大伯，然后...
    .then(function() { return Request("大姑"); })  // 搞定大姑，然后...
    .then(function() { return Request("女神"); })  // 搞定大姑，然后...
    ;
