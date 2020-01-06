# DataCollection

# Datasets

| Resouce     | Dataset             | Description |
| ----------- | ------------------- | ----------- |
| Streams     | [Streams](#streams) | Dataset contains information about a Stream including sent messages, played games and even viewers who didnt even chat |
| Users       | [Users](#users)  |  | Dataset contains information about a Users Profile, their sent messages, used commands, visited streams and much more |
| Leaderboards| [Leaderboards](#leaderboards)| Dataset contains information about a certain Type of Data (e.g. Emote, Message-count, Command-types, ...) sorted highest to lowsers by their individual parameters |
| Games       | **TBD**				| - |
| Misc        | **TBD**				| - |


## Users

Dataset contains information about a Users Profile, their sent messages, used commands, visited streams and much more

Most Data is only collected if the Channel is live. Offline Message are **only COUNTED** - **not processed** into commands/emotes/... and they **are not be ReRecordable**!

#### User Dataset Details

| Name         | Type    | Description |
| ------------ |-------- | ----------- |
| `username`   | string  | Username of the User |
|`display-name`| string  | Display-Name of the User (equals `username` if none was set) |
|    `bio`     | string  | User Description set in the Twitch User Profile |
|`profile_image_url`| string  | User Profile Picture URL |
|    `ID`      | integer | Twitch User ID |
| `messages`   | Object  | User Messages Object containing the `total`-Messages Integer value, the `curve` Array with Tuples of MessageCount at a Timestamp and all collected Messages stored in the `raw` Array (not always sorted by time)|
| `emotes`     | Object  | User Emotes Object containing the `total`-Emotes Integer value, the `curve` Array with Tuples of EmoteCount at a Timestamp and and the `top` Array with EmoteNames and their usage |
| `commands`   | Object  | User Commands Object containing the `total`-Commands Integer value, the `curve` Array with Tuples of CommandCount at a Timestamp and and the `top` Array with CommandNames and their usage |
| `Special`    | Object  | Used for Future extra Stats like Coins, Pols, ... |
| `createdAt`  | integer | UNIX Timestamp of the Creation Date of the Userfile (used for File Auto-Merging) |


## Streams

Dataset contains information about a Stream including sent messages, played games and even viewers who didnt even chat

This Data is only collected if the Channel is live. Offline Message are only collected in the Users Dataset.

#### Stream Dataset Details

| Name      | Type    | Description |
| --------- |-------- | ----------- |
| `titles`    | Array   | Containing Objects with a `text` and `time` attribute - Basically a collection of all used Titles, sorted by time |
| `date`      | integer | UNIX Timestamp of the Stream Starttime (time in ms) |
| `messages`  | Object  | Stream Messages Object containing the `total`-Messages Integer value, the `curve` Array with Tuples of MessageCount at a Timestamp, the `top` Array with Usernames and their MessageCount, and all collected Messages stored in the `raw` Array (sorted by time)|
| `emotes`    | Object  | Stream Emotes Object containing the `total`-Emotes Integer value, the `curve` Array with Tuples of EmoteCount at a Timestamp and and the `top` Array with EmoteNames and their usage |
| `commands`  | Object  | User Commands Object containing the `total`-Commands Integer value, the `curve` Array with Tuples of CommandCount at a Timestamp and and the `top` Array with CommandNames and their usage |
| `viewers`   | Object  | Object containing a `total` and `curve` attribute. `total` is an Array with all Viewers/Chatters who visited the stream. `curve` is an Array containung Objects of the Viewercount at a given time |
| `games`     | Array   | Containing Objects with a `id` and `time` attribute - Basically a collection of all played Games, sorted by time |
| `twitchID`  | integer | Twitch Stream ID |

## Leaderboards

Dataset contains information about a certain Type of Data (e.g. Emote, Message-count, Command-types, ...) sorted highest to lowsers by their individual parameters

This Data is only collected if the Channel is live. Offline Message are only collected in the Users Dataset.

#### Leaderboard Dataset Details

| Name        | Type    | Description |
| ------------|-------- | ----------- |
|   `name`	  | string  | Name of the Leaderboard |
|`description`| string  | Detailed Description about the Leaderbaord. only used for Hovers|
|`html_description`| string  | Detailed Description about the Leaderbaord with HTML Tag capabilities. Used ON the Leaderboards Page|
|   `data`    | Array   | Sorted Array of Objects containing a `name` and a `value` Parameter |
