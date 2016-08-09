# Voice Proxy using the Nexmo Voice API

## Prerequisites

* [A Nexmo Account](https://dashboard.nexmo.com/sign-up)
* [Nexmo CLI (Command Line Interface)](https://github.com/nexmo/nexmo-cli)

## Getting Started

Create an application and take a note of the application UUID: 

```sh
nexmo app:create voice-proxy https://example.com/proxy-call https://example.com/event
```

*Note 1: You may also want to save the private key file that is returned. You won't be able to get this again.*

If you don't know the URLs for your proxy-call and event webhooks yet you can update them later e.g.

```sh
nexmo app:update APP_ID voice-proxy https://example.com/proxy-call https://example.com/event
```

Copy the `example.env` to `.env` and update the content as appropriate:

```
cp example.env .env
```

Start the application:

```sh
npm start
```

## Usage

To indicate that a conversation between two users should be allowed navigate to the following replacing `FROM_NUMBER` and `TO_NUMBER` with e.164 formatting international numbers (e.g. 14155550123):

http://localhost:5000/conversation/start/FROM_NUMBER/TO_NUMBER

In a real system this conversation would be set up by an automated process.

To check the existing ongoing conversations navigate to:

http://localhost:5000/conversations

You should see a response such as the following:

```json
[{
  "userA":{
    "realNumber":{
      "msisdn":"USER_A_REAL_NUMBER",
      "country":"GB"
    },
    "virtualNumber":{
      "msisdn":"USER_A_VIRTUAL_NUMBER",
      "country":"GB"
    }
  },
  "userB":{
    "realNumber":{
      "msisdn":"USER_B_REAL_NUMBER",
      "country":"GB"
    },
    "virtualNumber":{
      "msisdn":"USER_B_VIRTUAL_NUMBER",
      "country":"GB"
    }
  },
  "callLogs":[]
}]
```
  
This tells us there are two participants and gives us the details of their real number and their assigned virtual number.

* If you make a call from a UserA's real number to UserB's virtual number the call will be proxied to UserB's real number and the from number will be show as UserA's virtual number.
* If you make a call from a UserB's real number to UserA's virtual number the call will be proxied to UserA's real number and the from number will be show as UserB's virtual number.
