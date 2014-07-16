JLOG is a log for organization. the different with blog is: when focus on someone, it must be agreed.

JLOG is builded on Angularjs + Nodejs + Mongodb.

1.install

first, install Nodejs and Mongodb.

second, install all neccessary node_modules to run the system:

1.1 npm install -g

bower,es6-promise,formidable,mongodb,mongojs,http-server,karma,protractor...

1.2 npm install

express, express-jwt, jsonwebtoken...


2.init

2.1 cd app, bower install.

2.2 cd test, bower install


3.test

npm test

you can see karma test result console.

you can also see karma-coverage test result in jlog\test\unit\coverage\Chrome 27.0.1453 (Windows XP)\index.html


4.start

npm start

you can see the app: http://localhost:8080/app

you can see the e2e test result: http://localhost:8080/test/e2e