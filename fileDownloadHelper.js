//var url = require('url');
//var request = require('request');
var elasticsearch = require('elasticsearch');
var fs = require('fs');
//var PropertiesReader = require('properties-reader');

//var properties = PropertiesReader('application.properties');
var client = new elasticsearch.Client(
    {
        host: "localhost:9200",
        //log: 'trace'
    }
);

var buildDoc = function (fourierDataRaw, accelId, axisId) {
    var axis = 'x';
    if (axisId == 1) axis = 'y';
    if (axisId == 2) axis = 'z';

    var docArray = [];
    var response = "";
    fourierDataRaw.forEach(function (fVal) {
        response = response + accelId + "," + axis + "," + fVal.frequency + "," + fVal.magnitude + "\n";
    });
    return response;
};


var processElastiResponse = function (response, accelId) {
    var fft = require('fft-js').fft;
    var fftUtil = require('fft-js').util;


    var hits = response.hits.hits;
    var xSignal = [], ySignal = [], zSignal = [];

    var xresult = "X - AXIS, TIME SERIES, DATA\n";
    var yresult = "Y - AXIS, TIME SERIES, DATA\n";
    var zresult = "Z - AXIS, TIME SERIES, DATA\n";

    hits.forEach(function (accelObject) {
        xSignal.push(accelObject._source.x_val);
        ySignal.push(accelObject._source.y_val);
        zSignal.push(accelObject._source.z_val);

        xresult = xresult + accelId + ",x,"+ accelObject._source.post_date + "," +accelObject._source.x_val + "\n";
        yresult = yresult + accelId + ",y," + accelObject._source.post_date + "," + accelObject._source.y_val + "\n";
        zresult = xresult + accelId + ",z," + accelObject._source.post_date + "," +accelObject._source.y_val + "\n";
    }); //foreach end
    var signal = [];
    signal.push(xSignal);
    signal.push(ySignal);
    signal.push(zSignal);

    var result = xresult;

    for (var i = 0; i < 3; i++) {
        if (signal[i].length < 2048) {
            console.log("No enough data to build fourier: size is " + signal[i].length);
            return;
        }
        var phasors = fft(signal[i]);
        var frequencies = fftUtil.fftFreq(phasors, 2048);
        var magnitudes = fftUtil.fftMag(phasors);
        var both = frequencies.map(function (f, ix) {
            return {frequency: f, magnitude: magnitudes[ix]}
        });

        if(i==1) result = result + yresult;
        if(i==2) result = result + zresult;
        result = result+ buildDoc(both, accelId, i);
    }
    return result;

}

var startSearch = function (accelId) {
    var promise = new Promise(function (resolve, reject) {
        var res = "";
        client.search({
                index: 'accelerometer',
                body: {
                    "query": {
                        "match": {
                            "accel_id": accelId
                        }
                    },
                    "sort": {
                        "post_date": {
                            "order": "desc"
                        }
                    },
                    "size": 2048
                } //body end
            }, function (error, response) {
                if (error) {
                    reject(err);
                    //var message = "Error in elasticSearchClient.js: startSearch while deleting \n\n\n" + error.stack;
                    //eventEmitter.emit('mailRequest', 'dvng4u@gmail.com', 'Unable to startSearch : accel  ' +accelId , message);
                } else {
                    res = processElastiResponse(response, accelId);
                    resolve(res);
                }
            }
        );
    });
    promise.then(function (result) {
        fs.writeFile("fourierresult_"+accelId+".csv", result, function(err) {
            if(err) {
                return console.log(err);
            }

            console.log("The file was saved!");
        });
        return result; // all data here
    }, function (err) {
        console.log("startSearch" + err);
        return err;
    });
    //console.log('Search started');

}


var getData = function () {
    /*client.ping({}, function (error) {
        if (error) {
            console.error('elasticsearch cluster is down!');
        } else {*/
    var promise = new Promise(function (resolve, reject) {
        var res = startSearch(1);
        var res2 = startSearch(2);
        var res3 = startSearch(3);
        if (res != undefined) {
            resolve(res);
        }
        else {
            reject(Error("It broke"));
        }
    });

    promise.then(function (result) {
        return result; // "Stuff worked!"
    }, function (err) {
        console.log(err); // Error: "It broke"
        return err;
    });
    //startSearch(2);
    //startSearch(3);
    //eventEmitter.addListener('elasticConnected', startSearch);
    //eventEmitter.addListener('searchComplete', processElastiResponse);
    //eventEmitter.addListener('fourierDocCreated', insertFourier);
    //start();
    /*  }
  });*/
}

var res = getData();


/*fileDownload = function (req, res) {

    var reqUrl = url.parse(req.url);
    var promise = new Promise(function (resolve, reject) {
        var res = getData();
        if (res != undefined) {
            resolve(res);
        }
        else {
            reject(Error("It broke - getData();"));
        }
    });
    promise.then(function (result) {
        var csv = result;
        res.writeHead(200, {'Content-Type': 'text/csv', 'Content-Disposition': "attachment;filename=dataFile.csv"});
        res.end(csv);
    }, function (err) {
        console.log(err); // Error: "It broke"
        res.writeHead(500, {'Content-Type': 'text/plain'});
        res.end("ERROR");
    });

    return;

}*/