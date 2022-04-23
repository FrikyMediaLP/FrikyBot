# FrikyBot 
FrikyBot is the Twitch Chat Bot and WebInterface by FrikyMediaLP. This Bot will combine Features from many diffrent Twitch Bots/Websites/... into one experience.

The Scope has changed A LOT tho! For now, this Bot is (mostly) focused to be used by myself alone until most is done! But at some point a public Release to run on multiple custom servers by anyone is desired. This will take a while, but tipps and insight is ALWAYS welcome :) I´m still lerning much about all of this :D

Note: This is a Hobby, nothing professionell or any good and thats great! So keep that in mind, when given critic about any "uncommon" workflows :D

## Getting Started
This Twitch Bot is powered by Node.js using the Express NPM Module to host a localhost Server and the tmi.js (will be replaced soon) NPM Module to Interface the Twitch Chat.

All dependancies are:
* [express](https://www.npmjs.com/package/express) - hosting the Server
* [body-parser](https://www.npmjs.com/package/body-parser) - RAW Express Body Data Access
* [ws](https://www.npmjs.com/package/ws) - WebSocket Capabilities
* [bcrypt](https://www.npmjs.com/package/bcrypt) - Hashing and random Generator
* [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken) - Login Token creation / verification
* [jwks-rsa](https://www.npmjs.com/package/jwks-rsa) - JWT extern signature usage
* [node-fetch](https://www.npmjs.com/package/node-fetch) - to use fetch() like in the Browser, this requieres v^2.6.5
* [tmi.js](https://www.npmjs.com/package/tmi.js) - Twitch IRC Interface
* [nedb](https://www.npmjs.com/package/nedb) - Database Manager (to be replaced with MongoDB "soon")
* [colors](https://www.npmjs.com/package/colors) - coloring the Console Output

After starting the bot(execute the server.js file) navigate to http://localhost:8080/login and use the token displayed in the Bot-Console to gain Admin privileges.

Then youre able to access the Web-Setup at http://localhost:8080/settings/setup and customize your bot the way you want.

Some features (like Twitch EventSubs) need an https / SSL secured domain. This can be done by deploying the bot to a custom domain or using proxys like ngrok.

## Modules
Modules are the base code interfacing with different Services and simplifying their usage.

### TwitchIRC
This part handles all interactions with the Twitch Chat using [TMI (Twitch Messaging Interface)](https://github.com/tmijs) (soon replaced by a custom IRC Client). 

### TwitchAPI
Interface with the Twitch API - This ONLY uses HELIX!!! So many things arent avaiable yet until Twitch themself are done.

### WebApp
The WebApp is hosting the Website and Authentication Service of the bot. Enabling TCP, Websocket connections as well as hosting/uploading files and APIs.

## Packages
Packages use the Core Modules (e.g. TwitchIRC and TwitchAPI) to create Features for the Bot. Everyting is based around these and one of the best and most complicated Features of the Bot.

These are some Packages currently available:

### Alerts
An advanced Alerts-System with shareable Overlay settings, Alerts for Chat Events (e.g. HypeTrains, Predictions, ...) and a deep Alert-Trigger-System powered by custom Profiles which can be easily switched to.

### Chat Moderation
Moderating is hard! Every chat has its own culture, its own memes and jokes - so a automated moderationt tool needs to be deeply tuneable. This is my shot at it - but as said, as chat culture changes so must the bot.

### CommandHandler
Commands are probably THE most used Chatbot feature, period. Making it familiar but also improving it is the goal. With more controll over Userlevels and Command Variables this CommandHandler is probably the most powerfull and expandable using other Packages.

### Docs
This Package is mainly hosted by the "official" FrikyBot providing Documentations and Guides when programming your own Packages and Modules. Or Troubleshooting stuff I messed up ;D

### NewsFeed
Aswell as Docs this might only be hosted by the "official" Frikybot embedding News and Changelogs on Social Media and Bot-Instances.

### Stats
Collecting Data from your Streams and visualizing them in a neat format. Not only cool to inspire competition for users to be at the top, but also to analyse your Stream Statistics.

### Planned Packages
* CustomChat: A custom Chat Client with multi-Channel support and MANY MAYOR Moderator Quality-of-Life Imporovements.
* Chat Miscs: A collection of the best Chat Games, Coin Systems and managing of Polls, Predictions, ChannelPoints, ... .
* Broadcaster Misc: A collection of Tools used by Streamers. E.g. Timers Overlays, Sponsor Overlay Generators and Chat Response, Life-response in Chat activity, ...
* Twitter / Discord Integrations: Mainly used for Stream Alerts and Commands
* many more

## Updates
Follow the official [Twitter](https://twitter.com/FrikyBot) Account or take a look at the [FrikyBot News](https://frikybot.de/News) to see upcomming Features and Updates.

## Authors
* **Tim Klenk** - [FrikyMediaLP](https://github.com/FrikyMediaLP)
