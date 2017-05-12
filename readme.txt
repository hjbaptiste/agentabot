Agentabot 
------------------------------------
How to Run
1) content.html
Bot is deployed to Azure (michelle usi's account)
Open the content.html in browser and start chatting!
2) emulator
Clone the code from https://github.com/hjbaptiste/agentabot.git
Run!
3) Facebook
Look for Agenta (need to add Michelle Usi as friend as she owns)
4) Skype (not Skype for Business)
Search for Agenta or click on the Add to Skype button on the html

------------------------------------
File Structure

Assie_Luis.json: export of the NLP used to understand user's request

The following are in the messages directory
agenta.js: THE BOT (this might be named index.js)
careerSkills.json: data set -  listing of careers and associated skills
agileQuiz.json: test questions for Agile topic
javaQuiz.json: test questions for Java skill

------------------------------------
Usage and Features

Assessmnent bot provides test questions for IT related skills. 

User can start a conversation with the bot by saying Hi / Hi Agenta / Agenta
User can exit at any time by saying 'bye'
The bot recognizes by keyword whether the topic is 'career' or a 'skill' 
and starts appropriate conversation flow. When the topic is a career, the bot asks guiding 
questions to help user select a skill for assessment. The assessment is a multiple-choice 
question quiz and the bot provides instant feedback on each response, including 
explanation for questions answered incorrectly and encouraging words along the way :)
Just to keep user engaged and guessing, questions are given in a random order even when 
the same quiz is repeated.

At the end, the bot gives cummulative score 
[and refernce to useful learning material - to be developed]



-------------------------------