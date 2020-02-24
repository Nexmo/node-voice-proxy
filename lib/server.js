"use strict";

const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.set('port', (process.env.PORT || 5000));
app.use(bodyParser.urlencoded({ extended: false }));

const config = require(__dirname + '/../config');

const VoiceProxy = require('./VoiceProxy');
const voiceProxy = new VoiceProxy(config);

app.listen(app.get('port'), function() {
  console.log('Voice Proxy App listening on port', app.get('port'));
});

app.get('/proxy-call', function(req, res) {
  const from = req.query.from;
  const to = req.query.to;
  
  const ncco = voiceProxy.getProxyNCCO(from, to);
  res.json(ncco);
});

app.post('/event', function(req, res) {
  console.log('event', req.body);
  
  res.sendStatus(204);
});

app.get('/conversation/start/:userANumber/:userBNumber', function(req, res) {
  const userANumber = req.params.userANumber;
  const userBNumber = req.params.userBNumber;
  
  voiceProxy.createConversation(userANumber, userBNumber, function(err, result) {
    if(err) {
      res.status(500).json(err);
    }
    else {
      res.json(result);
    }
  });
});

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
});

app.get('/numbers', function(req, res) {
  res.json(voiceProxy.provisionedNumbers);
});

app.get('/conversations', function(req, res) {
  res.json(voiceProxy.conversations);
});
