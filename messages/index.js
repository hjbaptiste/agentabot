//--------------------------------
//- AgentaBot Get your skills up -
//--------------------------------

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
        session.send("I'm sorry, I didn't understand \'%s\'.", session.message.text);
        session.beginDialog('/help');
    },
    function (session) {
        session.beginDialog('/testSkill');
    }
]);


/**
 * Description: Mapping the intents to a dialog
 */
luisIntents.matches(/\b(agenta|Agenta|Agenta|Hi|Yo|Hello)\b/i, '/wakeAgenta')
    .matches('TestMySkill', '/testSkill');
    bot.dialog('/wakeAgenta', function(session) {
        // Clear user data in the session
        session.userData.careerInTest = "";
        session.userData.randomNum = 0;
        session.userData.correctAnswer = "";
        session.userData.explanation = "";
        session.userData.areaOfFocus = "";
        session.userData.score = "";
        session.userData.questionNum = 0;
        session.send("Hi! I\'m Agenta, the Skills Assessment Bot.");
        // "Push" the help dialog onto the dialog stack to let the user know how the bot can help
        session.beginDialog('/help');
        session.endDialog();
    }
);

/**
 * @Descripton: Informs the uer what functions that can be performed.
 */
bot.dialog('/help', function(session) {
        session.endDialog("I can help assess your proficiency in various areas of technology.  You can say:\n\n\"I want to pursue a career as a Software Developer\" or \n\n\"I would like to test my Java skills\"");
    }
);

/**
 * @Description: This is the main dialog that is called
 */
bot.dialog('/testSkill', [
    function (session, args) {
        //Show user that we're processing their request by sending the typing indicator
        session.sendTyping();
        // Get the list of Entities returned from LUIS
        var testSkillEntities = args.entities;
        // See if what the user said has the 'typeCareer' and the 'typeSkill' Entities
        var careerEntity = builder.EntityRecognizer.findEntity(testSkillEntities, 'typeCareer');
        var skillEntity = builder.EntityRecognizer.findEntity(testSkillEntities, 'typeSkill');
        if (careerEntity) {
            var whichCareerEntity = builder.EntityRecognizer.findEntity(testSkillEntities, 'whichCareer');
            var career = whichCareerEntity.entity;
            if (whichCareerEntity) {
                session.userData.careerInTest = career;
                session.beginDialog('/confirm', "Career");
            }
        } else if (skillEntity) {
            var whichSkillEntity = builder.EntityRecognizer.findEntity(testSkillEntities, 'whichSkill');
            var skill = whichSkillEntity.entity;
            if (whichSkillEntity) {
                
                session.conversationData.skill = skill;
                session.beginDialog('/testSkills', {skill: skill}); 
            }
        } else {
            // If neither Entity was returned then inform the user and call the 'help' dialog
            session.send("I'm sorry, I didn't understand that.");
            session.beginDialog('/help');
        }
    },
    function (session) {
        //var percentScore = (session.userData.questionNum/session.userData.score) * 100;
        var percentScore = Math.round((100 - (session.userData.whichQuiz.questions.length / session.userData.score) * 100) * 100) / 100;
            session.endConversation("You've scored %s on your  %s Quiz.", percentScore, session.conversationData.skill.toUpperCase());

            // TODO: This can be extended to provide the user's level of profiency in the technology area.
            // Somehing like 'Beginner', 'Moderate', 'Expert'.  If the user is not an 'Expert' then
            // the bot can search for classes related to the technology on the learning portal of the company
            // and ask the user if he/she wants the bot to register them for any courses that the user is
            // interested in.  The bot can also present and email the user additional links to tutorials 
            // that the user can take to help build their skills   
    }
]);

bot.dialog('/confirm', [
    function(session, args) {
        var topic = args;
        console.log("Topic:" + topic);
        if(topic == "Career") {
            session.send("Great! Sounds like you're interested in a career in %s.", session.userData.careerInTest);
            builder.Prompts.confirm(session, "Is that correct?");
        }
    },
    function(session, results) {
        var whichCareer_confirm = session.message.text;
        //If the user confirms their career choice, move forward
        if (whichCareer_confirm.toLowerCase() == 'Yes'.toLowerCase()) {
            doCareer(session, session.userData.careerInTest);
        }
        //If the user doesn't confirm their career choice, print out careers to choose from
        else {
            session.send("I'm sorry, I didn't understand that.");
            session.beginDialog('/help');
        }
    }
]);

/**
 * @Description: This function determines the career that the user wants to pursue and matches
 * it to a matrix of skills that are needed for that career forward to the user to a dialog
 * that asks the user which skill they would like to take a quiz on.
 *  
 * @param {*} session 
 * @param {*} whichCareer 
 */
function doCareer (session, whichCareer) {
    //go through the list of careers and enumerate the skills applicable for the chosen input
    var careerList = careers.careerSkills;
    var career;
    var skillsList = "";
    var found = false;
    console.log("Career: " + whichCareer);

    for(var i in careerList) {
        console.log("Career name:" + careerList.name);
        if(careerList[i].name.toLowerCase() == whichCareer.toLowerCase()) {
            career = careerList[i];
            found = true;
            break;
        }
    }

    if(found == false) {
        session.send("Sorry, a quiz is not yet available on this topic.");
        session.beginDialog("/help");
    }

    var textResp = "Here are a few skills I can quiz you on related to a " + whichCareer + ".";
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
        if(skillToTest.toLowerCase() == "Java".toLowerCase() || skillToTest.toLowerCase() == "Agile".toLowerCase()) {
            session.beginDialog("/testSkills", {skill:skillToTest});
        } else {
            session.endDialog("I'm sorry, but I don't have a quiz for this skill yet.");
            session.beginDialog("/help");
        }
    }
]);


bot.dialog('/testSkills', function(session, args) {
    var whichSkill = args.skill;
    session.userData.score = 0;
    if ("Java".toLowerCase() == whichSkill.toLowerCase()) {
        var javaQuestionsCopy = javaQuestions;
        session.userData.whichQuiz = javaQuestionsCopy;
        //session.conversationData.whichQuiz = javaQuestions;
        session.beginDialog('/doQuiz');
        //doQuiz(session, javaQuestions);
    } else if ("Agile".toLowerCase() == whichSkill.toLowerCase()) {
        var agileQuestionsCopy = agileQuestions;
        session.userData.whichQuiz = agileQuestionsCopy;
        //session.conversationData.whichQuiz = agileQuestions;
        session.beginDialog('/doQuiz');
        //doQuiz(session, agileQuestions);
    }
});

/**
 * @Description: Displays a set of questions and captures user's responses to those questions
 * based on the test the user indicated they would like to take.  the questions are presented
 * in a random order each time a test is executed.  It grades each the answer to each question
 * and provides an explanation and also encourages the user as they proceed.
 */
bot.dialog('/doQuiz', [
    function (session) {  
        var questionsCopy = session.userData.whichQuiz.questions;
        var questionNum = session.userData.questionNum;
        questionNum > 0 ? questionNum = questionNum : questionNum = 1;
        if (questionsCopy.length > 0) {
            var numQuestions = questionsCopy.length;
            var randomNum = getRandomInt(0, numQuestions);
            session.dialogData.randomNum = randomNum;
            var currentQuestion = questionsCopy[randomNum];
            var description = currentQuestion.description;
            var answers = currentQuestion.answers;
            var numOfAnswers = answers.length;
            session.send("Question %i - %s", questionNum, description);
            var choices = "";
            while (numOfAnswers > 0) {
                for (key in answers) {
                    var choice = Object.keys(answers[key]);
                    
                    choices += ("\n\n" + choice[0] +  " - " + answers[key][choice[0]]);
                    numOfAnswers--;
                } 
            }
            session.dialogData.correctAnswer = currentQuestion.answer;
            session.dialogData.explanation = currentQuestion.explanation;
            session.dialogData.areaOfFocus = currentQuestion.areaOfFocus;
            builder.Prompts.text(session, choices);  
        } 
    },
    function (session, results) {
        var questionsCopy = session.userData.whichQuiz.questions;
        if(results.response) {
            //Show user that we're processing their request by sending the typing indicator
            session.sendTyping();
            if (session.dialogData.correctAnswer.toLowerCase() == results.response.toLowerCase()) {
                session.send("correct answer is %s.\n\nExplanation: %s", session.dialogData.correctAnswer, session.dialogData.explanation);
                session.send("Great job!");
                session.userData.score++;
            } else {
                session.send("correct answer is %s.\n\nExplanation: %s", session.dialogData.correctAnswer, session.dialogData.explanation);
                session.send("That's ok! It's part of learning.");
            }
            var questionNum = session.userData.questionNum;
           /// questionNum++;
            //session.userData.questionNum = questionNum;
            session.userData.questionNum++;
            questionsCopy.splice(session.dialogData.randomNum, 1);
            if (questionsCopy.length <= 0) {
                session.endDialog();
            }
            session.replaceDialog('/doQuiz');
            
        } else {
            session.replaceDialog('/doQuiz', "Sorry, I don't understand. Let's start over.");
        }  
    }
]);


/**
 * Generates random integer between two numbers low (inclusive) and high (exclusive)
 * @param {*} low 
 * @param {*} high 
 */
var getRandomInt = function (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
};
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
