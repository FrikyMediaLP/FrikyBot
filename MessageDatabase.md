# MessageDatabase

# API Reference

| Resouce     | Endpoint                    | Description |
| ----------- | --------------------------- | ----------- |
| Streams     | [Get Streams](#get-streams) | Get information about active and previous Streams! <br><br> The response has a JSON payload\* with a `data` field containing an Array of Stream Objects.\*\* |
| Users       | [Get Users](#get-users)     | Get information about Users (Viewers and Chatters)! <br><br> The response has a JSON payload\* with a `data` field containing an Array of User Objects.\*\* |
| Games       | **TBD**						| - |
| Tags        | **TBD**						| - |
| Misc        | **TBD**						| - |


## Get Streams
Get information about active and previous Streams! <br><br> The response has a JSON payload\* with a `data` field containing an Array of Stream Objects.\*\*

#### Required Query String Parameters
none

#### Optional Query String Parameters
| Name     | Type    | Description |
| -------- |-------- | ----------- |
| `id`     | integer | Twitch Stream ID. You can specify up to 100 IDs. |

#### Response Fields
| Name     | Type    | Description |
| -------- |-------- | ----------- |
| **TBD**  |   -     |		-	   |


## Get Users
Get information about Users (Viewers and Chatters)! <br><br> The response has a JSON payload\* with a `data` field containing an Array of User Objects.\*\*

#### Required Query String Parameters
none

#### Optional Query String Parameters
| Name           | Type    | Description |
| -------------- |-------- | ----------- |
| `id`           | integer | Twitch User ID. You can specify up to 100 IDs.  |
| `login_name`   | string  | Twitch login-name. You can specify up to 100 Names. |
| `display_name` | string  | Twitch Display-name. You can specify up to 100 Names. |

#### Response Fields
| Name     | Type    | Description |
| -------- |-------- | ----------- |
| **TBD**  |   -     |		-	   |


\* Payload also contains the standard API Response `req` and `status` fields<br>
\*\* Data is refreshed every 60 secounds