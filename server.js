// var http = require('http');
// var serverFunction = function (req, res) {
//
//
//         res.writeHead(200, {'Content-Type': 'application/json'});
//         res.end("{\n" +
//             "    \"version\": \"1.0\",\n" +
//             "    \"sessionAttributes\": {},\n" +
//             "    \"response\": {\n" +
//             "        \"outputSpeech\": {\n" +
//             "            \"type\": \"PlainText\",\n" +
//             "            \"text\": \"Welcome\"\n" +
//             "        }\n" +
//             "    }\n" +
//             "}");
// };
//
// var server = http.createServer(serverFunction);
// server.listen(8080);
// console.log("server started");


var http = require('http');
var el = require('./elasticSearchClient');

var alert = require('./alertService');
var thresh = require('./thresholdWebService');
var accel = require('./accelWebService');

var file = require('./fileDownloadHelper');

var url = require('url');
var events = require('events');
var PropertiesReader = require('properties-reader');

var properties = PropertiesReader('application.properties');
var eventEmitter = new events.EventEmitter();


//el.startElasticService(eventEmitter);
//alert.alertService(eventEmitter);

var serverFunction = function (req, res) {

    var reqUrl = url.parse(req.url);
    if (reqUrl.pathname == properties.get('threshold.incoming.rest.pathname')) {
        thresh.thresholdRequest(req, res);
    }

    if (reqUrl.pathname == properties.get('accelerometer.push.rest.pathname')) {
        accel.accelPush(req, res);
    }
    if (reqUrl.pathname == properties.get('download.current.data.file')) {
        file.fileDownload(req, res);
    }

    else {
        res.writeHead(200, {'Content-Type': 'text/json'});
        res.end("Node JS running successfully " + reqUrl.pathname);
    }
};

var server = http.createServer(serverFunction);
server.listen(process.env.PORT || properties.get('main.application.port'));
console.log("server started");
