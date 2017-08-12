var http = require('http');
var el = require('./elasticSearchClient');
var alert = require('./alertService');
var thresh = require('./thresholdWebService');
var url = require('url');
var events = require('events');
var PropertiesReader = require('properties-reader');

var properties = PropertiesReader('application.properties');
var eventEmitter = new events.EventEmitter();


el.startElasticService(eventEmitter);
alert.alertService(eventEmitter);

var serverFunction = function (req, res) {

    var reqUrl = url.parse(req.url);
    if (reqUrl.pathname == properties.get('threshold.incoming.rest.pathname')) {
        thresh.thresholdRequest(req, res);
    } else {
        res.writeHead(200, {'Content-Type': 'text/json'});
        res.end("Node JS running successfully " + reqUrl.pathname);
    }
};

var server = http.createServer(serverFunction);
server.listen(process.env.PORT || properties.get('main.application.port'));
console.log("server started");
