var events = require('events');
var elasticsearch = require('elasticsearch')
var dateFormat = require('dateformat');
var eventEmitter;// = new events.EventEmitter();

var nodemailer = require('nodemailer');

var x1_thresh = 0;
var y1_thresh = 0;
var z1_thresh = 0;

var x2_thresh = 0;
var y2_thresh = 0;
var z2_thresh = 0;

var x3_thresh = 0;
var y3_thresh = 0;
var z3_thresh = 0;

var last_date = "2016-08-11 00:00:00.000";


var client = new elasticsearch.Client(
    {
        host: 'localhost:9200',
        //log: 'trace'
    }
);

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'dvng4u@gmail.com',
        pass: 'dummy'
    }
});


var sendMail = function (to, subject, message) {
    var mailOptions = {
        from: 'dvng4u@gmail.com',
        to: to,
        subject: subject,
        text: message
    };

    /*transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            //console.log('Email sent: ' + info.response);
        }
    });*/
}

var sendAlert = function (accelId, dataArray) {

    var message = "Threshold was breached for one of the following Accelerometer: \n ";

    dataArray.forEach(function (data) {
        message = message + JSON.stringify(data._source) + "\n";
    }); //foreach end

    eventEmitter.emit('mailRequest', 'dvng4u@gmail.com', 'Threshold Breached For Accel ' + accelId, message);

}


var validateThresh = function (accelId, thresh) {

    var date_till = dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss.l");

    client.search({
            index: 'accelerometer',
            body: {
                query: {
                    bool: {

                        must: [
                            {
                                term: {accel_id: accelId}
                            },
                            {
                                range: {
                                    post_date: {
                                        gte: last_date,
                                        lt: date_till
                                    }
                                }
                            },
                            {
                                bool: {
                                    should: [
                                        {
                                            "range": {
                                                "x_val": {"gte": thresh[0]}
                                            }
                                        },
                                        {
                                            "range": {
                                                "y_val": {"gte": thresh[0]}
                                            }
                                        },
                                        {
                                            "range": {
                                                "z_val": {"gte": thresh[0]}
                                            }
                                        }
                                    ]

                                }
                            }
                        ]
                    }
                }
            }                //body end
        }, function (err, response) {
            if (err) {
                console.log(err);
            } else {
                last_date = date_till;
                //console.log(response.hits.hits);
                eventEmitter.emit('threshComplete', accelId, response.hits.hits);
            }
        }
    );
}

var startThresholdService = function (accelId) {
    console.log("Threshold : elasticConnected event received");
    client.search({
            index: 'threshold',
            type: 'threshold',
            //_id: "1" TODO @TODO : search by id not working, find how to do this and fix
        }, function (err, response) {
            if (err) {
                console.log(err);
            } else {
                //console.log(response.hits.hits[0]._source.x1_thresh);
                var thresh = []
                thresh.push(response.hits.hits[0]._source.x1_thresh);
                thresh.push(response.hits.hits[0]._source.y1_thresh);
                thresh.push(response.hits.hits[0]._source.z1_thresh);

                validateThresh(accelId, thresh);

            }
        }
    );

}


exports.alertService = function (eventEmitterRecv) {
    console.log("Threshold service startinf");
    eventEmitter = eventEmitterRecv;

    eventEmitter.addListener('elasticConnected', startThresholdService);
    //eventEmitter = new events.EventEmitter();
    eventEmitter.addListener('threshComplete', sendAlert);
    eventEmitter.addListener('mailRequest', sendMail);

}