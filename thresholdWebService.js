var url = require('url');
var request = require('request');
var elasticsearch = require('elasticsearch');

var client = new elasticsearch.Client(
    {
        host: 'localhost:9200',
        //log: 'trace'
    }
);

exports.thresholdRequest = function (req, res) {

    var reqUrl = url.parse(req.url);

    if (req.method == 'POST') {
        //res.writeHead(200, {'Content-Type': 'text/json'});

        req.on('data', function (reqBody) {
            var body = null;
            try {
                body = JSON.parse(reqBody);
            }
            catch (e) {
                res.writeHead(400, {'Content-Type': 'text/plain'});
                res.end("Unable To Process : JSON FOrmat Error");
            }

            request({
                uri: "http://localhost:9200/threshold/threshold/1",
                method: "POST",
                json: body
            }, function (error, elRes) {
                if (error) {
                    res.writeHead(400, {'Content-Type': 'text/plain'});
                    res.end("Unable To Process");
                } else {
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end("{\"success\": \"true\"}");

                }
            });
        });

    } else if (req.method == 'GET') {

        client.search({
                index: 'threshold',
                type: 'threshold',
                //_id: "1" TODO @TODO : search by id not working, find how to do this and fix
            }, function (err, response) {
                if (err) {
                    console.log(err);
                } else {
                    //console.log(response.hits.hits[0]._source.x1_thresh);
                    //var thresh = []
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end(response.hits.hits[0]._source);
                    //res.end();
                }
            }
        );

    }
    else {
        res.writeHead(400, {'Content-Type': 'text/json'});
        res.end("BAd Request " + reqUrl.pathname);
    }
    return;

}