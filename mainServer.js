var http = require('http');
var el = require('./elasticSearchClient');
var alert = require('./alertService');
var thresh = require('./thresholdWebService');
var url = require('url');
var events = require('events');

var eventEmitter = new events.EventEmitter();


//el.startElasticService(eventEmitter);
//alert.alertService(eventEmitter);

//check if threshold crossed




var serverFunction = function (req, res) {

    var reqUrl = url.parse(req.url);
    if (reqUrl.pathname == "/threshold") {
        thresh.thresholdRequest(req, res);
    } else {
        res.writeHead(404, {'Content-Type': 'text/json'});
        res.end("No handler found " + reqUrl.pathname);
    }
};

var server = http.createServer(serverFunction);
server.listen(8085);
console.log("server started");
