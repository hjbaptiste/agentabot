//=========================================================
// Bot for demonstrating Cognitive Services API calls
//   - menu dialogs based on:  https://github.com/Microsoft/BotBuilder/blob/master/Node/examples/basics-menus/app.js
//=========================================================

var builder = require('botbuilder');
var botbuilder_azure = require("botbuilder-azure");
var endOfLine = require('os').EOL;
var config = require('./configuration');
var javaQuestions = require('./javaQuiz'); // no need to add the .json extension


var useEmulator = (process.env.NODE_ENV == 'development');
useEmulator = true;

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

// Create bot
var bot = new builder.UniversalBot(connector);

if (useEmulator) {
    // Setup Restify Server
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    // Handle Bot Framework messages
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = { default: connector.listen() }
}

// Make sure you add code to validate these fields
var luisAppId = process.env.LuisAppId;
var luisAPIKey = process.env.LuisAPIKey;
var luisAPIHostName = process.env.LuisAPIHostName || 'westus.api.cognitive.microsoft.com';

const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v1/application?id=' + luisAppId + '&subscription-key=' + luisAPIKey;

// Main dialog with LUIS
var luisRecognizer = new builder.LuisRecognizer(LuisModelUrl);

//****************************************************************/
// Begin intent logic setup.  An intent is an action a user wants
// to perform.  They, in general, are grouped as expressions that mean
// the same thing, but may be constructed differently.  We can have as
// many as we like here.
var luisIntents = new builder.IntentDialog({ recognizers: [luisRecognizer] });

// Maps the 'root' dialog to the LUIS intents.
bot.dialog('/', luisIntents);

/**
 * @Description: Default LUIS intent when the funtionality the user wants to use doesn't
 * match any of the intents created within the LUIS model.
 */
luisIntents.onDefault ([
    function (session) {
        // If neither Entity was returned then inform the user and call the 'help' dialog
        session.send("Sorry, I did not understand \'%s\'.", session.message.text);
        session.beginDialog('/help');
    },
    function (session) {
        session.beginDialog('/process');
    }
]);

luisIntents.matches(/\b(agenta|Agenta|Agenta)\b/i, '/wakeAgenta')
    .matches('TestMySkill', '/testSkill')
    .matches('AnalyseImage', '/analyseImage')
    .matches('SendEmail', '/sendEmail');

    bot.dialog('/wakeAgenta', function(session) {
        session.send("Hi!, I\'m Agenta, the skills assessment bot.");
        // "Push" the help dialog onto the dialog stack
        session.beginDialog('/help');
        session.endDialog();
    }
);

/**
 * @Descripton: Informs the uer what functions that can be performed.
 */
bot.dialog('/help', function(session) {
        session.endDialog("I can help assess your proficiency in various areas of technology.  You can say things like:\n\n\"I want to pursue a carreer as a Software Engineer\"\n\n\"I would like to test my Java skills\"");
        //session.endDialog("Go ahead, I\'m listening");
    }
);

bot.dialog('/testSkill', [
    function (session, args) {
        //Show user that we're processing their request by sending the typing indicator
            session.sendTyping();
        // Get the list of Entities returned from LUIS
        var testSkillEntities = args.entities;
        // See if what the user said has the '' and the 'count' Entities
        var careerEntity = builder.EntityRecognizer.findEntity(testSkillEntities, 'typeCareer');
        var skillEntity = builder.EntityRecognizer.findEntity(testSkillEntities, 'typeSkill');
        if (careerEntity) {
            for(key in testSkillEntities) {
                // Get the Holiday at the current index in the loop
                var entity = testSkillEntities[key];
                // See if what the user said has the 'when' and the 'holiday' Entities
                if (entity.type == 'whichCareer') {
                    career = entity.entity;
                    doCareer(career);
                }
            }
        } else if (skillEntity) {
            for(key in testSkillEntities) {
                // Get the Holiday at the current index in the loop
                var entity = testSkillEntities[key];
                // See if what the user said has the 'when' and the 'holiday' Entities
                if (entity.type == 'whichSkill') {
                    skill = entity.entity;
                    doQuiz(skill);
                }
            }
        } else {
            // If neither Entity was returned then inform the user and call the 'help' dialog
            session.send("Sorry, I didn't understand.");
            session.beginDialog('/help');
        }
    },
    function () {

    }
]);

var doCareer = function () {

}

var doQuiz = function(whichQuiz) {

}

/**
 * @Description: This dialog is triggered when the user says 'bye'
 */
bot.dialog('/bye', function (session) {
    // end dialog with a cleared stack.  we may want to add an 'onInterrupted'
    // handler to this dialog to keep the state of the current
    // conversation by doing something with the dialog stack
    session.endDialog("Ok... See you later.");
}).triggerAction({matches: /^bye|Goodbye|Bye/i});
