# FrikyBot 
FrikyBot is the Twitch Chat Bot and WebInterface by FrikyMediaLP. This Bot will combine Features from many diffrent Twitch Bots/Websites/... into one experience.

The Scope has changed A LOT tho! For now, this Bot is (mostly) focused to be used by myself alone until most is done! But at some point a full propper Release to be used and/or run on multiple custom servers by anyone. This will take a while, but tipps and insight is ALWAYS welcome :) I´m still lerning much about all of this :D

Note: This is a Hobby, nothing professionell or any good and thats great! So keep that in mind, when given critic about any "uncommon" workflows :D

## Getting Started
This Twitch Bot is powered by Node.js using the Express NPM Module to host a localhost Server and the tmi.js NPM Module to Interface the Twitch Chat.

All dependancies are:
* [express](https://www.npmjs.com/package/express) - hosting the Server
* [node-fetch](https://www.npmjs.com/package/node-fetch) - to use fetch() like in the Browser
* [colors](https://www.npmjs.com/package/colors) - coloring the Console Output
* [tmi.js](https://www.npmjs.com/package/tmi.js) - Twitch IRC Interface
* [nedb](https://www.npmjs.com/package/nedb) - Database Manager

Using the Config.json File in the main Directory custom Packages and Login Settings can be set. The Config File can also be created using the console based "Setup Wizard".

Almost everything is done using the WebInterface. Head over to ``http://localhost:8080/`` and use to Docs/Guide(soon) how to set up everything from there!

The server.js File is the main start of the Bot, run this using node and have fun :)

## TwitchIRC
This part handles all interactions with the Twitch Chat using [TMI (Twitch Messaging Interface)](https://github.com/tmijs). 

## TwitchAPI
Interface with the Twitch API - This ONLY uses HELIX!!! So many things arent avaiable yet until Twitch themself are done.

## DataCollection
DataCollection is used as an Interface between a HUGE Collection of multiple Dataset from many diffrent Packages to make the DataCollection more streamlined.

## Packages
Packages use the Core Modules (e.g. TwitchIRC and TwitchAPI) to create Features for the Bot. Everyting is based around these and one of the best/most complicated Features of the Bot.

## Updates
Take a look at the [Trello](https://trello.com/b/yjQ75foa/frikybot) Page, the official [Twitter](https://twitter.com/FrikyBot) Account or the [FrikyBot News](https://frikybot.de/News) to see upcomming Features and Updates.

## Authors
* **Tim Klenk** - [FrikyMediaLP](https://github.com/FrikyMediaLP)
