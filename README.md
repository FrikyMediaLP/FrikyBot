# FrikyBot 
My new main Twitch Bot build with the New Twitch API (helix is the new kraken :D )

## Getting Started
This Twitch Bot is powered by Node.js - so you need to install Node in order to use my Bot.
After installing Node, open the server.js File using Node and visit ``http://localhost:1337/``! You can interact with the Bot through the hosted [Website](#website) and [API](#api).

## Installing
As mentioned before, you need to install [Node.js](https://nodejs.org) and the followong NPM-Modules:
* ``npm install express``
* ``npm install tmi.js``
* ``npm install request``
* ``npm install colors``

## Deployment
Use the config.json File to set YOUR Twitch Account Details and the Packages you´d like to use. Default Directory of the Config File is the Desktop, but you can change this in the server.js File (``CONFIG_PATH``).

````
{
	"TwitchIRC": {
		"Username": "YOUR USERNAME",
		"OAuth": "oauth:YOUR Oauth",
		"Channel": "CHANNEL TO JOIN"
	},
	"TwitchNewAPI": {
		"Client_ID": "YOUR CLIENTID",
		"Client_Redirect_Uri": "YOUR REDIRECT",
		"Client_Secret": "YOUR SECRET"
	},
	"Packages": {
		"PACKAGE NAME": CONFIG OBEJECT
	}
}
````

## Feature Overview
This Twitch Bot is big, complex and combines all my old versions from .3 and .5 aswell as the IRC side. With this mix of different styles, i might not have ended up with a completly consistent style, but i tried my best and ended up with the following concepts:
* [Website](#website) - Controlling and Visualization of Data and Overlays
* [TwitchIRC](#twitchirc) - Twitch Chat Interface
* [TwitchNewAPI](#twitchnewapi) - The New Twitch API (helix)
* [Packages](#packages) - Additional Features in a compact form
* [API](#api) - API to controll/access Bot Data 

## Website
The hosted Website is main interface of this Twitch Bot. URL: ``http://localhost:1337/``

### Page Overview

 * [index.html](http://localhost:1337/) - Main Menu and Access to all other Websites

 * [options.html](http://localhost:1337/options) - Options for Admins/Broadcaster to change Bot Settings, get exsclusive Data or interact with the stream

 * [Bot.html](http://localhost:1337/bot) - Current Bot Status

 * [Login.html](http://localhost:1337/login) - Login with your TwitchAccount or as Staff Member
 ...
 * [packages.html](http://localhost:1337/packages) - Overview of all currently installed Packages 


## TwitchIRC
This part handles all interactions with the Twitch Chat aka [TMI (Twitch Messaging Interface)](https://github.com/tmijs). 

The most important Event Handlers are allready implemented, but more can be added ([docs](https://github.com/tmijs/docs)) or removed if unused. Use the Event Handlers in the lower part of the server.js File to change the behaviour of Events. 

## TwitchNewAPI
Interface with all other Twitch Data - getting Subs, Usernames AND MUCH MORE! Most importand part of the Bot! CUrrently not implemented enough (still stuck with the basics, getting, setting, revokin Tokens).

In the Future, (allmost) all helix Endpoints will be supported. (aswell as kraken, due to unfished Endpoints on Twitch´s side)

## Packages
Packages are a easy and neat way to add Features to the Bot. Just add Folder based on the Package.js File and install it using the Config.json File. See Default Packages like ``MessageDatabase`` for reference.
Packages can (dont have to) even be controlled through the [API](#api) and/or a Website (supplied in an additionall ´´html´´ Folder inside the Package Folder - contents will be coppied to the public Folder on Bot Startup).

### Supported Packages

 * will add if 100% complete, currently none is

## API
The API compliments the Website to add all necessary functionality to run this Bot. 

#### MAIN ROOT URL: ``http://localhost:1337/api/``

Packages API root URLs are Based on Packagename. So the root URL for API Calls to the Package ``MessageDatabase`` is ``http://localhost:1337/api/MessageDatabase/``. 
Endpoints can be set to be password protected (not yet implemented tho)

## Updates

Take a look at the [Trello]() Page to see upcomming Features and Updates
 
## Built With
* [Node.js](https://nodejs.org) - Server
* [tmi.js](https://github.com/tmijs) - Twitch Chat / Twitch Messaging Interface

## Authors
* **Tim Klenk** - [FrikyMediaLP](https://github.com/FrikyMediaLP)