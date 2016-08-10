"use strict";

var express = require('express');
var bodyParser = require('body-parser');

var app = express();
app.set('port', (process.env.PORT || 5000));
app.use(bodyParser.urlencoded({ extended: false }));

var config = require(__dirname + '/../config');

var VoiceProxy = require('./VoiceProxy');
var voiceProxy = new VoiceProxy(config);

app.listen(app.get('port'), function() {
  console.log('Voice Proxy App listening on port', app.get('port'));
});

app.get('/proxy-call', function(req, res) {
  var from = req.query.from;
  var to = req.query.to;
  
  var ncco = voiceProxy.getProxyNCCO(from, to);
  res.json(ncco);
});

app.post('/event', function(req, res) {
  console.log('event', req.body);
  
  res.sendStatus(204);
});

app.get('/conversation/start/:userANumber/:userBNumber', function(req, res) {
  var userANumber = req.params.userANumber;
  var userBNumber = req.params.userBNumber;
  
  voiceProxy.createConversation(userANumber, userBNumber, function(err, result) {
    if(err) {
      res.status(500).json(err);
    }
    else {
      res.json(result);
    }
  });
})

// Useful functions for testing out the functionality and querying bookings
app.get('/', function(req, res) {
  res.send('Hello Voice Proxy!');
});

app.get('/numbers/provision', function(req, res) {
  voiceProxy.provisionVirtualNumbers();
  
  res.send('OK');
});

app.get('/numbers/reconfigure', function(req, res) {
  voiceProxy.reconfigureNumbers();
  
  res.send('OK');
})

app.get('/numbers', function(req, res) {
  res.json(voiceProxy.provisionedNumbers);
});

app.get('/conversations', function(req, res) {
  res.json(voiceProxy.conversations);
});
