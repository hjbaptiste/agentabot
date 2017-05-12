//=========================================================
// Bot for demonstrating Cognitive Services API calls
//   - menu dialogs based on:  https://github.com/Microsoft/BotBuilder/blob/master/Node/examples/basics-menus/app.js
//=========================================================

var builder = require('botbuilder');
var botbuilder_azure = require("botbuilder-azure");
var endOfLine = require('os').EOL;
var config = require('./configuration');
var javaQuestions = require('./javaQuiz'); // no need to add the .json extension
var agileQuestions = require('./agileQuiz'); // no need to add the .json extension
var careers = require('./careerSkills');


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

//const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v1/application?id=' + luisAppId + '&subscription-key=' + luisAPIKey;
const LuisModelUrl = "https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/b9c4c92f-5f8a-4735-85e3-22ce68bed7c2?subscription-key=6e5c542c313242c38f8d5dd8e987e3d3&timezoneOffset=0&verbose=true&q=";

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
        session.beginDialog('/testSkill');
    }
]);

luisIntents.matches(/\b(agenta|Agenta|Agenta|Hi|Yo|Hello)\b/i, '/wakeAgenta')
    .matches('TestMySkill', '/testSkill')
    .matches('AnalyseImage', '/analyseImage')
    .matches('SendEmail', '/sendEmail');

    bot.dialog('/wakeAgenta', function(session) {
        session.send("Hi! I\'m Agenta, the skills assessment bot.");
        // "Push" the help dialog onto the dialog stack
        session.beginDialog('/help');
        session.endDialog();
    }
);

/**
 * @Descripton: Informs the uer what functions that can be performed.
 */
bot.dialog('/help', function(session) {
        session.endDialog("I can help assess your proficiency in various areas of technology.  You can say things like:\n\n\"I want to pursue a career as a Software Developer\"\n\n\"I would like to test my Java skills\"");
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
                    //Confirm the career with the user
                    session.send("Great! Sounds like you're interested in a career in %s.", entity.entity);
                    builder.Prompts.confirm(session, "Is that correct?");
                    var whichCareer_confirm = session.message.text;
                    //If the user confirms their career choice, move forward
                    if (whichCareer_confirm == 'Yes') {
                        var career = entity.entity;
                        doCareer(session, career);
                    }
                    //If the user doesn't confirm their career choice, print out careers to choose from
                    else {
                    }
                }
            }
        } else if (skillEntity) {
            for(key in testSkillEntities) {
                // Get the Holiday at the current index in the loop
                var entity = testSkillEntities[key];
                // See if what the user said has the 'when' and the 'holiday' Entities
                if (entity.type == 'whichSkill') {
                    var skill = entity.entity;
                    testSkills(session, skill);
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

function doCareer (session, whichCareer) {
    //go through the list of careers and enumerate the skills applicable for the chosen input
    var careerList = careers.careerSkills;
    var career;
    var skillsList = "";
    console.log("Career: " + whichCareer);

    for(var i in careerList) {
        console.log("Career name:" + careerList.name);
        if(careerList[i].name.toLowerCase == whichCareer.toLowerCase) {
            career = careerList[i];
            break;
        }
    }
    var textResp = "These are the skills needed for a career as a " + whichCareer + ":";
    var skills = career.skills;
    for(var j in skills) {
        skillsList += '\n\n'+ skills[j];    
    }
    session.send(textResp + skillsList);
    session.beginDialog("/askToTakeTest");
}

bot.dialog('/askToTakeTest', [
    function(session) {
        builder.Prompts.text(session, "Which skill would you like to be quizzed on?");
    },
    function(session, results){
        var skillToTest = results.response;
        console.log("Response:" + results.response);
        if(skillToTest.toLowerCase == "Java".toLowerCase || skillToTest.toLowerCase == "Agile".toLowerCase) {
            doQuiz(javaQuestions);
        } else {
            session.endDialog("Sorry, this test is not yet available.");
            session.beginDialog("/help");
        }
    }
]);


var testSkills = function(session, whichSkill) {
    if ("Java".toLowerCase == whichSkill.toLowerCase) {
        doQuiz(session, javaQuestions);
    } else if ("Agile".toLowerCase == whichSkill.toLowerCase) {
        doQuiz(session, agileQuestions);
    }
};


function doQuiz (session, whichQuiz) {
    var score = 0;
    var questions = whichQuiz.questions;
    var questionsCopy = questions;
    var numQuestions = questionsCopy.length;
    var questionNum = 1;
    while (questionsCopy.length > 0) {
         var randomNum = getRandomInt(0, numQuestions);
         var currentQuestion = questionsCopy[randomNum];
         var description = currentQuestion.description;
         var answers = currentQuestion.answers;
         var numOfAnswers = answers.length;
         var answer = currentQuestion.answer;
         var explanation = currentQuestion.explanation;
         var areaOfFocus = currentQuestion.areaOfFocus;
         session.send("Question %i - %s", questionNum, description);
         var choices = "";
         while (numOfAnswers > 0) {
             for (key in answers) {
                 var choice = Object.keys(answers[key]);
                 
                 choices += ("\n\n" + choice[0] +  " - " + answers[key][choice[0]]);
                 numOfAnswers--;
             } 
         }
         // Prompt user to select an answer from the multiple choices
        //builder.Prompts.choice(session, choices);
        builder.Prompts.text(session, "Select the correct answer", "a|b|c");
        questionsCopy.splice(randomNum, 1);
        numQuestions = questionsCopy.length;
        questionNum++;
    }
    return score;
};

/**
 * Generates random integer between two numbers low (inclusive) and high (exclusive)
 * @param {*} low 
 * @param {*} high 
 */
var getRandomInt = function (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}
/**
 * @Description: This dialog is triggered when the user says 'bye'.  It stops
 * all dialog and respond to the user
 */
bot.dialog('/bye', function (session) {
    // end dialog with a cleared stack.  we may want to add an 'onInterrupted'
    // handler to this dialog to keep the state of the current
    // conversation by doing something with the dialog stack
    session.endDialog("Ok... See you later.");
}).triggerAction({matches: /^bye|Goodbye|Bye/i});
