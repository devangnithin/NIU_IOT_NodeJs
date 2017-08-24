var url = require('url');
var request = require('request');
var elasticsearch = require('elasticsearch');
var PropertiesReader = require('properties-reader');

var properties = PropertiesReader('application.properties');
var client = new elasticsearch.Client(
    {
        host: properties.get('elasticsearch.base.url') + ":" + properties.get('elasticsearch.base.port'),
        //log: 'trace'
    }
);

var buildDoc = function (jsonReqDataArray) {

    var docArray = [];
    jsonReqDataArray.forEach(function (jsonReqData) {
        docArray.push({index: {_index: 'accelerometer', _type: 'accelerometer'}});
        docArray.push({
            accel_id: jsonReqData.accel_id,
            x_val: jsonReqData.x_val,
            y_val: jsonReqData.y_val,
            z_val: jsonReqData.z_val,
            post_date: jsonReqData.post_date
        });
    });
    return docArray;
};

var insertTimeSeries = function (timeSeriesData, res) {
    client.bulk({
        body: timeSeriesData
    }, function (error, response) {
        if (error) {
            res.writeHead(400, {'Content-Type': 'text/plain'});
            res.end("Error in elasticSearchClient.js: insertTimeseries \n\n\n" + error.stack);
        }
        //else console.log("written");
    });
};

var requestArray = [];
var count = 0;

exports.accelPush = function (req, res) {

    var reqUrl = url.parse(req.url);

    if (req.method == 'POST') {
        //res.writeHead(200, {'Content-Type': 'text/json'});

        req.on('data', function (reqBody) {
            var body = null;
            try {
                body = JSON.parse(reqBody);
                if (count < 10000) {
                    requestArray.push(body);
                    count = count + 1;
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end("{'data_queue' :'" + reqUrl.pathname + "'}");
                } else {
                    insertTimeSeries(buildDoc(requestArray), res);
                    count = 0;
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end("{'data_pushed_to_elastic' :'" + reqUrl.pathname + "'}");
                }
            }
            catch (e) {
                res.writeHead(400, {'Content-Type': 'text/plain'});
                res.end("Unable To Process : JSON FOrmat Error");
            }

        });

    }
    else {
        res.writeHead(400, {'Content-Type': 'application/json'});
        res.end("BAd Request " + reqUrl.pathname);
    }
    return;

}