var events = require('events');
var elasticsearch = require('elasticsearch')
var fft = require('fft-js').fft;
var fftUtil = require('fft-js').util;
var PropertiesReader = require('properties-reader');

var properties = PropertiesReader('application.properties');
var eventEmitter;// = new events.EventEmitter();
var client = new elasticsearch.Client(
    {
        host: properties.get('elasticsearch.base.url') + ":" + properties.get('elasticsearch.base.port'),
        //log: 'trace'
    }
);

var insertFourier = function (fourierData) {
    client.bulk({
        body: fourierData
    }, function (error, response) {
        if (error) {
            //console.log(error.stack);
            var message = "Error in elasticSearchClient.js: insertFourier \n\n\n" + error.stack;
            eventEmitter.emit('mailRequest', 'dvng4u@gmail.com', 'Unable to insert Fourier ', message);
        }
        //else console.log("written");
    });
};

var buildDoc = function (fourierDataRaw, accelId, axisId) {
    var axis = 'x';
    if (axisId == 1) axis = 'y';
    if (axisId == 2) axis = 'z';

    var docArray = [];
    fourierDataRaw.forEach(function (fVal) {
        docArray.push({index: {_index: 'fourier', _type: 'fourier'}});
        docArray.push({
            accel_id: accelId,
            values: {
                frequency: fVal.frequency,
                amplitude: fVal.magnitude,
                axis: axis
            }
        });
    });
    return docArray;
};


var processElastiResponse = function (response, accelId) {

    client.deleteByQuery({
        index: 'fourier',
        type: 'fourier',
        body: {
            query: {
                term: {accel_id: accelId}
            }
        }

    }, function (error, response) {
        if (error) {
            var message = "Error in elasticSearchClient.js: processElastiResponse while deleting \n\n\n" + error.stack;
            eventEmitter.emit('mailRequest', 'dvng4u@gmail.com', 'Unable to Delete ', message);
            //console.log(error);
        }
        //else console.log('Delete success');
    });


    var hits = response.hits.hits;
    var xSignal = [], ySignal = [], zSignal = [];

    hits.forEach(function (accelObject) {
        xSignal.push(accelObject._source.x_val);
        ySignal.push(accelObject._source.y_val);
        zSignal.push(accelObject._source.z_val);
    }); //foreach end
    var signal = [];
    signal.push(xSignal);
    signal.push(ySignal);
    signal.push(zSignal);

    for (var i = 0; i < 3; i++) {

        var phasors = fft(signal[i]);
        var frequencies = fftUtil.fftFreq(phasors, 2048);
        var magnitudes = fftUtil.fftMag(phasors);
        var both = frequencies.map(function (f, ix) {
            return {frequency: f, magnitude: magnitudes[ix]}
        });

        eventEmitter.emit('fourierDocCreated', buildDoc(both, accelId, i));
    }

}

var startSearch = function (accelId) {
    //console.log('Search started');
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
                //console.log(err);
                var message = "Error in elasticSearchClient.js: startSearch while deleting \n\n\n" + error.stack;
                eventEmitter.emit('mailRequest', 'dvng4u@gmail.com', 'Unable to startSearch : accel  ' +accelId , message);
            } else {
                eventEmitter.emit('searchComplete', response, accelId);
            }
        }
    );
}


var start = function () {
   // console.log('-----------------------');
    console.log('emiting elasticConnected');
    eventEmitter.emit('elasticConnected', 1);
    eventEmitter.emit('elasticConnected', 2);
    eventEmitter.emit('elasticConnected', 3);
    setTimeout(function () {
        start();
    }, 60000);
}

exports.startElasticService = function (eventEmitterRecv) {
    console.log("Elastic service started");
    eventEmitter = eventEmitterRecv;

    client.ping({}, function (error) {
        if (error) {
            console.error('elasticsearch cluster is down!');
        } else {
            eventEmitter.addListener('elasticConnected', startSearch);
            eventEmitter.addListener('searchComplete', processElastiResponse);
            eventEmitter.addListener('fourierDocCreated', insertFourier);
            start();
        }
    });


}

