var http = require('http'),
    httpProxy = require('http-proxy');

//
// Create a proxy server with custom application logic
//
var proxy = httpProxy.createProxyServer({});

// To modify the proxy connection before data is sent, you can listen
// for the 'proxyReq' event. When the event is fired, you will receive
// the following arguments:
// (http.ClientRequest proxyReq, http.IncomingMessage req,
//  http.ServerResponse res, Object options). This mechanism is useful when
// you need to modify the proxy request before the proxy connection
// is made to the target.
//
proxy.on('proxyReq', function(proxyReq, req, res, options) {
    proxyReq.setHeader('X-Special-Proxy-Header', 'foobar');
});

var server = http.createServer(function(req, res) {
    // You can define here your custom logic to handle the request
    // and then proxy the request.
    proxy.web(req, res, {
        target: 'http://127.0.0.1:5601'
    });
});

console.log("listening on port 5050")
server.listen(8050);

/*
var http = require('http');
var url = require('url');

var acceptor = http.createServer().listen(8085);

acceptor.on('request', function(request, response) {

    var reqUrl = url.parse(request.url).path.split('/');
    var port = 80;
    if (reqUrl[1] == 'elastic') {
        port = 9200;
    } else if (reqUrl[1] == 'kibana') {
        port = 5601;
    }


    var redirectUrl = 'http://localhost:' + port + "/" + (reqUrl.splice(2)).join('/');

    console.log('request ' + redirectUrl);
    request.pause();
    var options = url.parse(redirectUrl + request.url);
    options.headers = request.headers;
    options.method = request.method;
    options.agent = false;

    var connector = http.request(options, function(serverResponse) {
        serverResponse.pause();
        while (serverResponse.statusCode == 301) {

        }
        response.writeHeader(serverResponse.statusCode, serverResponse.headers);
        serverResponse.pipe(response);
        serverResponse.resume();
    });
    request.pipe(connector);
    request.resume();
});*/
