"use strict";

var Promise = require('bluebird');
var Nexmo = require('nexmo');

var VoiceProxy = function(config) {
  this.config = config;
  
  this.nexmo = new Nexmo({
      apiKey: this.config.NEXMO_API_KEY, 
      apiSecret: this.config.NEXMO_API_SECRET
    },{
      debug: this.config.NEXMO_DEBUG
    });
  
  // Virtual Numbers to be assigned to UserA and UserB
  this.provisionedNumbers = [];
  
  // In progress conversations
  this.conversations = [];
};

VoiceProxy.prototype.provisionVirtualNumbers = function() {
  // Buy a UK number with VOICE capabilities.
  this.nexmo.number.search('GB', {features: 'VOICE'}, function(err, res) {
    if(err) {
      console.error(err);
    }
    else {
      var numbers = res.numbers;
      
      // For demo purposes:
      // - Assume that at least two numbers will be available
      // - Rent just two virtual numbers: one for each conversation participant
      this.rentNumber(numbers[0]);
      this.rentNumber(numbers[1]);
    }
  }.bind(this));
};

VoiceProxy.prototype.rentNumber = function(number) {
  this.nexmo.number.buy(number.country, number.msisdn, function(err, res) {
    if(err) {
      console.error(err);
    }
    else {
      this.configureNumber(number);
    }
  }.bind(this));
};

/**
 * Configure the number to be associated with the Voice Proxy application.
 */
VoiceProxy.prototype.configureNumber = function(number) {
  var options = {
    voiceCallbackType: 'app',
    voiceCallbackValue: this.config.NEXMO_APP_ID,
  };
  this.nexmo.number.update(number.country, number.msisdn, options, function(err, res) {
    if(err) {
      console.error(err);
    }
    else {
      this.provisionedNumbers.push(number);
    }
  }.bind(this));
};

/**
 * Ensure the existing provisioned numbers are linked to the Voice Proxy app.
 */
VoiceProxy.prototype.reconfigureNumbers = function() {
  this.provisionedNumbers.forEach(function(number) {
    this.configureNumber(number);
  }, this);
};

VoiceProxy.prototype.createConversation = function(userANumber, userBNumber, cb) {
  var niGetPromise = Promise.promisify(this.nexmo.numberInsight.get, {context: this.nexmo.numberInsight});
  var userAGet = niGetPromise({level: 'basic', number: userANumber});
  var userBGet = niGetPromise({level: 'basic', number: userBNumber});
  
  Promise.all([userAGet, userBGet]).then(function(results) {
    var userAResult = results[0];
    var userANumber = {
      msisdn: userAResult.international_format_number,
      country: userAResult.country_code
    };
    
    var userBResult = results[1];
    var userBNumber = {
      msisdn: userBResult.international_format_number,
      country: userBResult.country_code
    };
    
    // Create conversation object
    // For demo purposes:
    // - Use first indexed LVN for user A
    // - Use second indexed LVN for user B
    var conversation = {
      userA: {
        realNumber: userANumber,
        virtualNumber: this.provisionedNumbers[0]
      },
      userB: {
        realNumber: userBNumber,
        virtualNumber: this.provisionedNumbers[1]
      },
      callLogs: []
    };
    
    this.conversations.push(conversation);
    
    cb(null, conversation);
    
  }.bind(this)).catch(function(err) {
    console.log(err);
    
    cb(err);
  });
  
};

var fromUserAToUserB = function(from, to, conversation) {
  log('fromUserAToUserB',
    from, '===', conversation.userA.realNumber.msisdn,
    to, '===', conversation.userB.virtualNumber.msisdn
  );
  return (from === conversation.userA.realNumber.msisdn &&
          to === conversation.userB.virtualNumber.msisdn);
};
var fromUserBToUserA = function(from, to, conversation) {
  log('fromUserBToUserA',
    from, '===', conversation.userB.realNumber.msisdn,
    to, '===', conversation.userA.virtualNumber.msisdn
  );
  return (from === conversation.userB.realNumber.msisdn &&
          to === conversation.userA.virtualNumber.msisdn);
};

VoiceProxy.prototype.getProxyRoute = function(from, to) { 
  log('from: ', from, 'to: ', to);
   
  var proxyRoute = null;
  var conversation;
  for(var i = 0, l = this.conversations.length; i < l; ++i) {
    conversation = this.conversations[i];
    
    // Use to and from to determine the conversation
    var fromUserA = fromUserAToUserB(from, to, conversation);
    var fromUserB = fromUserBToUserA(from, to, conversation);
    
    if(fromUserA || fromUserB) {
      proxyRoute = {
        conversation: conversation,
        to: fromUserA? conversation.userB : conversation.userA,
        from: fromUserA? conversation.userA : conversation.userB
      };
      break;
    }
  }
  
  return proxyRoute;
};

VoiceProxy.prototype.getProxyNCCO = function(from, to) {  
  // Determine how the call should be routed
  var proxyRoute = this.getProxyRoute(from, to);
  
  if(proxyRoute === null) {
    var errorText = 'No conversation found' +
                    ' from: ' + from +
                    ' to: ' + to;
    throw new Error(errorText);
  }
  
  // Log the call
  proxyRoute.conversation.callLogs.push({
    from: from,
    to: to
  });
  
  var ncco = [];
  
  var textAction = {
    action: 'talk',
    text: 'Please wait whilst we connect your call'
  };
  ncco.push(textAction);
  
  var connectAction = {
    action: 'connect',
    from: proxyRoute.from.virtualNumber.msisdn,
    endpoint: [{
      type: 'phone',
      number: proxyRoute.to.realNumber.msisdn
    }]
  };
  ncco.push(connectAction);
  
  return ncco;
};

function log() {
  console.log.apply(this, Array.prototype.slice.call(arguments));
}

module.exports = VoiceProxy;
