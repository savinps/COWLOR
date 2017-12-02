/**
 * Copyright 2016 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const watson = require('watson-developer-cloud'); // watson sdk
var request = require('request');
var Promise = require('promise');
var Q = require('q');
var json2csv = require('json2csv');
var fs = require('fs');

// Create the service wrapper
const conversation = watson.conversation({
  // If unspecified here, the CONVERSATION_USERNAME and CONVERSATION_PASSWORD env properties will be checked
  // After that, the SDK will fall back to the bluemix-provided VCAP_SERVICES environment property
  // username: '<username>',
  // password: '<password>',
  version_date: '2016-10-21',
  version: 'v1'
});

/**
 * Updates the response text using the intent confidence
 * @param  {Object} input The request to the Conversation service
 * @param  {Object} response The response from the Conversation service
 * @return {Object}          The response with the updated message
 */
const updateMessage = (input, response) => {

  var responseText = null;
  if (!response.output) {
    response.output = {};
  } else {
    return response;
  }
  if (response.intents && response.intents[0]) {
    var intent = response.intents[0];
    // Depending on the confidence of the response the app can return different messages.
    // The confidence will vary depending on how well the system is trained. The service will always try to assign
    // a class/intent to the input. If the confidence is low, then it suggests the service is unsure of the
    // user's intent . In these cases it is usually best to return a disambiguation message
    // ('I did not understand your intent, please rephrase your question', etc..)
    if (intent.confidence >= 0.75) {
      responseText = 'I understood your intent was ' + intent.intent;
    } else if (intent.confidence >= 0.5) {
      responseText = 'I think your intent was ' + intent.intent;
    } else {
      responseText = 'I did not understand your intent';
    }
  }
  response.output.text = responseText;
  console.log(responseText);
  return response;
};


module.exports = function(app) {

  app.post('/api/message', (req, res, next) => {
    const workspace = process.env.WORKSPACE_ID || '<workspace-id>';
    if (!workspace || workspace === '<workspace-id>') {
      return res.json({
        output: {
          text: 'The app has not been configured with a <b>WORKSPACE_ID</b> environment variable. Please refer to the ' +
            '<a href="https://github.com/watson-developer-cloud/conversation-simple">README</a> ' +
            'documentation on how to set this variable. <br>' +
            'Once a workspace has been defined the intents may be imported from ' +
            '<a href="https://github.com/watson-developer-cloud/conversation-simple/blob/master/training/car_workspace.json">here</a> ' +
            'in order to get a working application.'
        }
      });
    }

    const payload = {
      workspace_id: workspace,
      context: req.body.context || {},
      input: req.body.input || {}

    };

    // Send the input to the conversation service
    conversation.message(payload, (error, data) => {

      var quote_json = [];
      var quote;
      if (error) {
        return next(error);
      }
      console.log(data);
      console.log(data.input.text);

      if(data.input.text.indexOf("confirm") != -1) {
        data.output.text[0] = "Sending request to WLE"
        // console.log("Posting to WLE");
        // post_WLE();
      }

      // If an intent was detected, log it out to the console.
      if (data.intents.length > 0) {
        console.log('Detected intent: #' + data.intents[0].intent);

        // If an intent with utilisation rate is detected, sent create XML and sent it to WLE.

        if (data.intents[0].intent.indexOf("proc_utilization_rate") != -1) {
          console.log("Confirmation about quote...");




          // // quote_json.push({"system_name":data.context.systype,"no_procs":data.context.nprocs,"proc_utilization":data.context.procsutilization});
          // quote_json.push({"Identifier":"SZATAP25","Quantity":"1","System":"Power 595 Power6 5.0GHz 32MB (32ch/64co)",
          // "Partition Type":"LPAR Shared Processor Uncapped","Active Cores":"4","Storage (GB)":"0","CPU Utilization":"40","Memory (MB)":"6144","Disk Reads Per Second":"0","Bytes Per Read Op":"0",
          // "Disk Writes Per Second":"0","Bytes Per Write Op":"0","Network (MB/S)":"0","Network Ops/Sec":"0","Overhead":"5","Concurrency":"70",});
          // // console.log(quote_json);
          // // var fields = ['system_name', 'no_procs', 'proc_utilization'];
          // //
          // // var csv = json2csv({ data: quote_json, fields: fields });
          // // console.log("CSV File generated!!");
          // // console.log(csv);





        }

      }

      // Display the output from dialog, if any.
      if (data.output.text.length != 0) {
          console.log(data.output.text[0]);
      }

      if(data.input.text.indexOf("check") != -1) {
        data.output.text[0] = "<a href=\"response.xml\" target=\"_blank\">WLE xml</a>";
         return res.json(updateMessage(payload, data));
      }
      //////////////////////////////////////////////////////////////////
      if(data.input.text.indexOf("confirm") != -1) {
        // data.output.text[0] = "<a href=\"https://cdn.pixabay.com/photo/2016/04/15/04/02/water-1330252_960_720.jpg\" target=\"_blank\">xml</a>"
        data.output.text[0] = "Sending request to WLE"
        console.log("Posting to WLE");

        var quote_sample= "Identifier,Quantity,System,Partition Type,Active Cores,Storage (GB),CPU Utilization,Memory (MB),Disk Reads Per Second,Bytes Per Read Op,Disk Writes Per Second,Bytes Per Write Op,Network (MB/S),Network Ops/Sec,Overhead,Concurrency\n" + data.context.systype + ",1," + data.context.sysname + ",LPAR Shared Processor Uncapped," + data.context.nprocs + "," + data.context.nmem + "," + data.context.putil + ",6144,0,0,0,0,0,0,5,70";
          console.log(quote_sample);
        function changeResponse() {

          // ////////////
          // var csv = require('csv-parser')
          // fs = require('fs')
          // fs.readFile('scon1.csv', 'utf8', function (err,data) {
          //   if (err) {
          //     return console.log(err);
          //   }
          //
          //   quote = data;
          //
          // });
          //
          //
          // //require the csvtojson converter class
          // var Converter = require("csvtojson").Converter;
          // // create a new converter object
          // var converter = new Converter({});
          //
          // // call the fromFile function which takes in the path to your
          // // csv file as well as a callback function
          //
          // converter.fromFile("./scon1.csv",function(err,result){
          //     // if an error has occured then handle it
          //     if(err){
          //         console.log("An Error Has Occured");
          //         console.log(err);
          //     }
          //     // create a variable called json and store
          //     // the result of the conversion
          //     console.log("CSV to JSON converted");
          //    quote_json = result;
          //
          //     // log our json to verify it has worked
          //     console.log(quote_json);
          // });
          //
          // var quote2= "Identifier,Quantity,System,Partition Type,Active Cores,Storage (GB),CPU Utilization,Memory (MB),Disk Reads Per Second,Bytes Per Read Op,Disk Writes Per Second,Bytes Per Write Op,Network (MB/S),Network Ops/Sec,Overhead,Concurrency\nSZATAP25,1,Power 595 Power6 5.0GHz 32MB (32ch/64co),LPAR Shared Processor Uncapped,4,0,40,6144,0,0,0,0,0,0,5,70";
          //
          // /////////////
          //
          // console.log("Input XML");
          // console.log(quote_json);
          var deferred = Q.defer();
          var delay = 1000;

          setTimeout(function() {


              console.log("in promise 1");
              script_output ="hello";
              console.log("Testing");
              var headers = {
                 'User-Agent': 'request',
                  'Content-Type':'application/text'
                  // 'Host': 'wle.w3ibm.mybluemix.net/wle/rest'
              }

              var options2 = {
                  url: 'http://estimatortest.w3ibm.mybluemix.net/wle/rest/sizingoptions/doSCONSizing',
                  // url: 'http://9.109.223.39:8080/wle/rest/sizingoptions/doSCONSizing',
                  // url: 'http://estimatortest.w3ibm.mybluemix.net/wle/rest//sizingoptions/postHello',
                  method: 'POST',
                  headers: headers,
                  // json: true,
                  body: quote_sample
              }

              console.log(options2);

              request(options2, function (error, response, body) {
                 console.log("Code of Post : "+response.statusCode);
                 console.log("Response :" + response);
                   if(error) {
                     console.log("Error of Post : "+error);
                   }
                  if (!error && response.statusCode == 201) {
                      // Print out the response body
                      console.log("Body of json post request: "+body)
                      deferred.resolve(body);
                  }
              })




               }, delay);

               return deferred.promise;
        }


        changeResponse().then(function(body){

          console.log("in promise 2");
          var delay = 1000;
          setTimeout(function() {
            // console.log(body);
            fs.writeFile('C:\\Users\\IBM_ADMIN\\node\\COWLOR2\\COWLOR2\\dist\\response.xml', body, function(err) {
              if (err) throw err;
              console.log('file saved');
            });
            var parseString = require('xml2js').parseString;
            var xml = body;
            parseString(xml, function (err, result) {
                console.dir(result);

            });
            // data.output.text[0] = "Response is ready";
            data.output.text[0] = "<a href=\"response.xml\" target=\"_blank\">WLE xml</a>";
            return res.json(updateMessage(payload, data));

            }, delay);

        })
////////////////////////////////////////////////////////////////////

      }
      else
      return res.json(updateMessage(payload, data));
    });
  });
};


////////////////////////////
