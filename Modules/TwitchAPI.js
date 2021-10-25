const CONSTANTS = require('./../Util/CONSTANTS.js');
const WEBAPP = require('./../Modules/WebApp');

const express = require('express');
const FETCH = require('node-fetch');
const crypto = require('crypto');

const fs = require('fs');
const path = require('path');

const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const Datastore = require('nedb');

const TTV_JWK_URL = "https://id.twitch.tv/oauth2/keys";
const TTV_API_ROOT = "https://api.twitch.tv/helix";

const TTV_API_INFO = {
    //Ads
    "Start Commercial": {
        token_type: 'User',
        method: 'POST',
        url: '/channels/commercial',
        req_scope: null,
        resource: 'Ads'
    },
    //Analytics
    "Get Extension Analytics": {
        token_type: 'User',
        method: 'GET',
        url: '/analytics/extensions',
        req_scope: 'analytics:read:extensions',
        resource: 'Analytics'
    },
    "Get Game Analytics": {
        token_type: 'User',
        method: 'GET',
        url: '/analytics/games',
        req_scope: 'analytics:read:games',
        resource: 'Analytics'
    },
    //Bits
    "Get Bits Leaderboard": {
        token_type: 'User',
        method: 'GET',
        url: '/bits/leaderboard',
        req_scope: 'bits:read',
        resource: 'Bits'
    },
    "Get Cheermotes": {
        token_type: 'Any',
        method: 'GET',
        url: '/bits/cheermotes',
        req_scope: null,
        resource: 'Bits'
    },
    "Get Extension Transactions": {
        token_type: 'Any',
        method: 'GET',
        url: '/extensions/transactions',
        req_scope: null,
        resource: 'Bits'
    },
    //Channels
    "Get Channel Information": {
        token_type: 'Any',
        method: 'GET',
        url: '/channels',
        req_scope: null,
        resource: 'Channels'
    },
    "Modify Channel Information": {
        token_type: 'User',
        method: 'PATCH',
        url: '/channels',
        req_scope: 'channel:manage:broadcast',
        returns_raw: true,
        resource: 'Channels'
    },
    "Get Channel Editors": {
        token_type: 'User',
        method: 'GET',
        url: '/channels/editors',
        req_scope: 'channel:read:editors',
        resource: 'Channels'
    },
    //Channel Points
    "Create Custom Rewards": {
        token_type: 'User',
        method: 'POST',
        url: '/channel_points/custom_rewards',
        req_scope: 'channel:manage:redemptions',
        resource: 'Channel Points'
    },
    "Delete Custom Rewards": {
        token_type: 'User',
        method: 'DELETE',
        url: '/channel_points/custom_rewards',
        req_scope: 'channel:manage:redemptions',
        returns_raw: true,
        resource: 'Channel Points'
    },
    "Update Custom Rewards": {
        token_type: 'User',
        method: 'PATCH',
        url: '/channel_points/custom_rewards',
        req_scope: 'channel:manage:redemptions',
        resource: 'Channel Points'
    },
    "Get Custom Rewards": {
        token_type: 'User',
        method: 'GET',
        url: '/channel_points/custom_rewards',
        req_scope: 'channel:read:redemptions',
        resource: 'Channel Points'
    },
    "Get Custom Reward Redemption": {
        token_type: 'User',
        method: 'GET',
        url: '/channel_points/custom_rewards/redemptions',
        req_scope: 'channel:read:redemptions',
        resource: 'Channel Points'
    },
    "Update Redemption Status": {
        token_type: 'User',
        method: 'PATCH',
        url: '/channel_points/custom_rewards/redemptions',
        req_scope: 'channel:manage:redemptions',
        resource: 'Channel Points'
    },
    //Chat
    "Get Channel Emotes": {
        token_type: 'Any',
        method: 'GET',
        url: '/chat/emotes',
        req_scope: null,
        resource: 'Chat'
    },
    "Get Global Emotes": {
        token_type: 'Any',
        method: 'GET',
        url: '/chat/emotes/global',
        req_scope: null,
        resource: 'Chat'
    },
    "Get Emote Sets": {
        token_type: 'Any',
        method: 'GET',
        url: '/chat/emotes/set',
        req_scope: null,
        resource: 'Chat'
    },
    "Get Channel Chat Badges": {
        token_type: 'Any',
        method: 'GET',
        url: '/chat/badges',
        req_scope: null,
        resource: 'Chat'
    },
    "Get Global Chat Badges": {
        token_type: 'Any',
        method: 'GET',
        url: '/chat/badges/global',
        req_scope: null,
        resource: 'Chat'
    },
    //Clips
    "Create Clip": {
        token_type: 'User',
        method: 'POST',
        url: '/clips',
        req_scope: 'clips:edit',
        rate_limited: true,
        resource: 'Clips'
    },
    "Get Clip": {
        token_type: 'Any',
        method: 'GET',
        url: '/clips',
        req_scope: null,
        resource: 'Clips'
    },
    //Entitlements
    "Get Code Status": {
        token_type: 'Any',
        method: 'GET',
        url: '/entitlements/codes',
        req_scope: null,
        resource: 'Entitlements'
    },
    "Get Drops Entitlements": {
        token_type: 'Any',
        method: 'GET',
        url: '/entitlements/drops',
        req_scope: null,
        resource: 'Entitlements'
    },
    "Update Drops Entitlements": {
        token_type: 'Any',
        method: 'PATCH',
        url: '/entitlements/drops',
        req_scope: null,
        resource: 'Entitlements'
    },
    "Redeem Code": {
        token_type: 'App',
        method: 'GET',
        url: '/entitlements/code',
        req_scope: null,
        resource: 'Entitlements'
    },
    //Extensions
    "Get Extension Configuration Segment": {
        token_type: 'Extern',
        method: 'GET',
        url: '/extensions/configurations',
        req_scope: null,
        resource: 'Extensions'
    },
    "Set Extension Configuration Segment": {
        token_type: 'Extern',
        method: 'PUT',
        url: '/extensions/configurations',
        req_scope: null,
        resource: 'Extensions'
    },
    "Set Extension Required Configuration": {
        token_type: 'Extern',
        method: 'PUT',
        url: '/extensions/required_configuration',
        req_scope: null,
        resource: 'Extensions'
    },
    "Send Extension PubSub Message": {
        token_type: 'Extern',
        method: 'POST',
        url: '/extensions/pubsub',
        req_scope: null,
        resource: 'Extensions'
    },
    "Get Live Channels": {
        token_type: 'Any',
        method: 'GET',
        url: '/extensions/live',
        req_scope: null,
        resource: 'Extensions'
    },
    "Get Extension Secrets": {
        token_type: 'Extern',
        method: 'GET',
        url: '/extensions/jwt/secrets',
        req_scope: null,
        resource: 'Extensions'
    },
    "Create Extension Secret": {
        token_type: 'Extern',
        method: 'POST',
        url: '/extensions/jwt/secrets',
        req_scope: null,
        resource: 'Extensions'
    },
    "Send Extension Chat Message": {
        token_type: 'Extern',
        method: 'POST',
        url: '/extensions/chat',
        req_scope: null,
        resource: 'Extensions'
    },
    "Get Extensions": {
        token_type: 'Extern',
        method: 'GET',
        url: '/extensions',
        req_scope: null,
        resource: 'Extensions'
    },
    "Get Released Extensions": {
        token_type: 'Any',
        method: 'GET',
        url: '/extensions/released',
        req_scope: null,
        resource: 'Extensions'
    },
    "Get Extension Bits Products": {
        token_type: 'App',
        method: 'GET',
        url: '/bits/extensions',
        req_scope: null,
        resource: 'Extensions'
    },
    "Update Extension Bits Products": {
        token_type: 'App',
        method: 'PUT',
        url: '/bits/extensions',
        req_scope: null,
        resource: 'Extensions'
    },
    //EventSub
    "Create EventSub Subscription": {
        token_type: 'App',
        method: 'POST',
        url: '/eventsub/subscriptions',
        req_scope: null,
        resource: 'EventSub '
    },
    "Delete EventSub Subscription": {
        token_type: 'App',
        method: 'DELETE',
        url: '/eventsub/subscriptions',
        req_scope: null,
        returns_raw: true,
        resource: 'EventSub '
    },
    "Get EventSub Subscriptions": {
        token_type: 'App',
        method: 'GET',
        url: '/eventsub/subscriptions',
        req_scope: null,
        resource: 'EventSub '
    },
    //Games
    "Get Top Games": {
        token_type: 'Any',
        method: 'GET',
        url: '/games/top',
        req_scope: null,
        resource: 'Games'
    },
    "Get Games": {
        token_type: 'Any',
        method: 'GET',
        url: '/games',
        req_scope: null,
        resource: 'Games'
    },
    //Goals
    "Get Creator Goals": {
        token_type: 'User',
        method: 'GET',
        url: '/goals',
        req_scope: 'channel:read:goals',
        resource: 'Goals'
    },
    //Hype Train
    "Get Hype Train Events": {
        token_type: 'Any',
        method: 'GET',
        url: '/hypetrain/events',
        req_scope: 'channel:read:hype_train',
        resource: 'Hype Train'
    },
    //Moderation
    "Check AutoMod Status": {
        token_type: 'User',
        method: 'POST',
        url: '/moderation/enforcements/status',
        req_scope: 'moderation:read',
        resource: 'Moderation'
    },
    "Manage Held AutoMod Messages": {
        token_type: 'User',
        method: 'POST',
        url: '/moderation/automod/message',
        req_scope: 'moderator:manage:automod',
        returns_raw: true,
        resource: 'Moderation'
    },
    "Get Banned Events": {
        token_type: 'User',
        method: 'GET',
        url: '/moderation/banned/events',
        req_scope: 'moderation:read',
        resource: 'Moderation'
    },
    "Get Banned Users": {
        token_type: 'User',
        method: 'GET',
        url: '/moderation/banned',
        req_scope: 'moderation:read',
        resource: 'Moderation'
    },
    "Get Moderators": {
        token_type: 'User',
        method: 'GET',
        url: '/moderation/moderators',
        req_scope: 'moderation:read',
        resource: 'Moderation'
    },
    "Get Moderators Events": {
        token_type: 'User',
        method: 'GET',
        url: '/moderation/moderators/events',
        req_scope: 'moderation:read',
        resource: 'Moderation'
    },
    //Polls
    "Get Polls": {
        token_type: 'User',
        method: 'GET',
        url: '/polls',
        req_scope: 'channel:read:polls',
        resource: 'Polls'
    },
    "Create Poll": {
        token_type: 'User',
        method: 'POST',
        url: '/polls',
        req_scope: 'channel:manage:polls',
        resource: 'Polls'
    },
    "End Poll": {
        token_type: 'User',
        method: 'PATCH',
        url: '/polls',
        req_scope: 'channel:manage:polls',
        resource: 'Polls'
    },
    //Predictions
    "Get Predictions": {
        token_type: 'User',
        method: 'GET',
        url: '/predictions',
        req_scope: 'channel:read:predictions',
        resource: 'Predictions'
    },
    "Create Prediction": {
        token_type: 'User',
        method: 'POST',
        url: '/predictions',
        req_scope: 'channel:manage:predictions',
        resource: 'Predictions'
    },
    "End Prediction": {
        token_type: 'User',
        method: 'PATCH',
        url: '/predictions',
        req_scope: 'channel:manage:predictions',
        resource: 'Predictions'
    },
    //Schedule
    "Get Channel Stream Schedule": {
        token_type: 'Any',
        method: 'GET',
        url: '/schedule',
        req_scope: null,
        resource: 'Schedule'
    },
    "Get Channel iCalendar": {
        token_type: null,
        method: 'GET',
        url: '/schedule/icalendar',
        req_scope: null,
        MIME: 'text/calendar',
        resource: 'Schedule'
    },
    "Update Channel Stream Schedule": {
        token_type: 'User',
        method: 'PATCH',
        url: '/schedule/settings',
        req_scope: 'channel:manage:schedule',
        returns_raw: true,
        resource: 'Schedule'
    },
    "Create Channel Stream Schedule Segment": {
        token_type: 'User',
        method: 'POST',
        url: '/schedule/segment',
        req_scope: 'channel:manage:schedule',
        resource: 'Schedule'
    },
    "Update Channel Stream Schedule Segment": {
        token_type: 'User',
        method: 'PATCH',
        url: '/schedule/segment',
        req_scope: 'channel:manage:schedule',
        resource: 'Schedule'
    },
    "Delete Channel Stream Schedule Segment": {
        token_type: 'User',
        method: 'DELETE',
        url: '/schedule/segment',
        req_scope: 'channel:manage:schedule',
        returns_raw: true,
        resource: 'Schedule'
    },
    //Search
    "Search Categories": {
        token_type: 'Any',
        method: 'GET',
        url: '/search/categories',
        req_scope: null,
        resource: 'Search'
    },
    "Search Channels": {
        token_type: 'Any',
        method: 'GET',
        url: '/search/channels',
        req_scope: null,
        resource: 'Search'
    },
    //Streams
    "Get Stream Key": {
        token_type: 'User',
        method: 'GET',
        url: '/streams/key',
        req_scope: 'channel:read:stream_key',
        resource: 'Streams'
    },
    "Get Streams": {
        token_type: 'Any',
        method: 'GET',
        url: '/streams',
        req_scope: null,
        resource: 'Streams'
    },
    "Get Followed Streams": {
        token_type: 'User',
        method: 'GET',
        url: '/streams/followed',
        req_scope: 'user:read:follows',
        resource: 'Streams'
    },
    "Create Stream Marker": {
        token_type: 'User',
        method: 'POST',
        url: '/streams/markers',
        req_scope: 'user:edit:broadcast',
        resource: 'Streams'
    },
    "Get Stream Markers": {
        token_type: 'User',
        method: 'GET',
        url: '/streams/markers',
        req_scope: 'user:read:broadcast',
        resource: 'Streams'
    },
    //Subscriptions
    "Get Broadcaster Subscriptions": {
        token_type: 'User',
        method: 'GET',
        url: '/subscriptions',
        req_scope: 'channel:read:subscriptions',
        resource: 'Subscriptions'
    },
    "Check User Subscription": {
        token_type: 'User',
        method: 'GET',
        url: '/subscriptions',
        req_scope: 'user:read:subscriptions/user',
        resource: 'Subscriptions'
    },
    //Tags
    "Get All Stream Tags": {
        token_type: 'App',
        method: 'GET',
        url: '/tags/streams',
        req_scope: null,
        resource: 'Tags'
    },
    "Get Stream Tags": {
        token_type: 'User',
        method: 'GET',
        url: '/streams/tags',
        req_scope: null,
        resource: 'Tags'
    },
    "Replace Stream Tags": {
        token_type: 'User',
        method: 'PUT',
        url: '/streams/tags',
        req_scope: 'user:edit:broadcast',
        returns_raw: true,
        resource: 'Tags'
    },
    //Teams
    "Get Channel Teams": {
        token_type: 'Any',
        method: 'PUT',
        url: '/teams/channel',
        req_scope: null,
        resource: 'Teams'
    },
    "Get Teams": {
        token_type: 'Any',
        method: 'PUT',
        url: '/teams',
        req_scope: null,
        resource: 'Teams'
    },
    //Users
    "Get Users": {
        token_type: 'Any',
        method: 'GET',
        url: '/users',
        req_scope: null,
        resource: 'Users'
    },
    "Update Users": {
        token_type: 'User',
        method: 'PUT',
        url: '/users',
        req_scope: 'user:edit',
        resource: 'Users'
    },
    "Get Users Follows": {
        token_type: 'User',
        method: 'GET',
        url: '/users/follows',
        req_scope: null,
        resource: 'Users'
    },
    "Get User Block List": {
        token_type: 'User',
        method: 'GET',
        url: '/users/blocks',
        req_scope: 'user:read:blocked_users',
        resource: 'Users'
    },
    "Block User": {
        token_type: 'User',
        method: 'PUT',
        url: '/users/blocks',
        req_scope: 'user:manage:blocked_users',
        returns_raw: true,
        resource: 'Users'
    },
    "Unblock User": {
        token_type: 'User',
        method: 'DELETE',
        url: '/users/blocks',
        req_scope: 'user:manage:blocked_users',
        returns_raw: true,
        resource: 'Users'
    },
    "Get User Extensions": {
        token_type: 'User',
        method: 'GET',
        url: '/users/extensions/list',
        req_scope: 'user:read:broadcast',
        resource: 'Users'
    },
    "Get User Active Extensions": {
        token_type: 'User',
        method: 'GET',
        url: '/users/extensions',
        req_scope: null,
        resource: 'Users'
    },
    "Update User Extensions": {
        token_type: 'User',
        method: 'PUT',
        url: '/users/extensions',
        req_scope: 'user:edit:broadcast',
        resource: 'Users'
    },
    //Videos
    "Get Videos": {
        token_type: 'Any',
        method: 'GET',
        url: '/videos',
        req_scope: null,
        resource: 'Videos'
    },
    "Delete Videos": {
        token_type: 'User',
        method: 'DELETE',
        url: '/videos',
        req_scope: 'channel:manage:videos',
        resource: 'Videos'
    },
    //Webhooks
    "Get Webhook Subscriptions": {
        token_type: 'App',
        method: 'GET',
        url: '/webhooks/subscriptions',
        req_scope: null,
        resource: 'Webhooks'
    }
};
const TTV_EVENTSUB_TOPICS = {
    "channel.update": {
        version: '1',
        name: 'Channel Update',
        description: 'A broadcaster updates their channel properties e.g., category, title, mature flag, broadcast, or language.',
        conditions: ['broadcaster_user_id'],
        resource: 'Channel'
    },
    "channel.follow": {
        version: '1',
        name: 'Channel Follow',
        description: 'A specified channel receives a follow.',
        conditions: ['broadcaster_user_id'],
        resource: 'Channel'
    },
    "channel.subscribe": {
        version: '1',
        name: 'Channel Subscribe',
        description: 'A notification when a specified channel receives a subscriber. This does not include resubscribes.',
        conditions: ['broadcaster_user_id'],
        scope: 'channel:read:subscriptions',
        resource: 'Channel'
    },
    "channel.subscription.end": {
        version: '1',
        name: 'Channel Subscription End',
        description: 'A notification when a subscription to the specified channel ends.',
        conditions: ['broadcaster_user_id'],
        scope: 'channel:read:subscriptions',
        resource: 'Channel'
    },
    "channel.subscription.gift": {
        version: '1',
        name: 'Channel Subscription Gift',
        description: 'A notification when a viewer gives a gift subscription to one or more users in the specified channel.',
        conditions: ['broadcaster_user_id'],
        scope: 'channel:read:subscriptions',
        resource: 'Channel'
    },
    "channel.subscription.message": {
        version: '1',
        name: 'Channel Subscription Message',
        description: 'A notification when a user sends a resubscription chat message in a specific channel.',
        conditions: ['broadcaster_user_id'],
        scope: 'channel:read:subscriptions',
        resource: 'Channel'
    },
    "channel.cheer": {
        version: '1',
        name: 'Channel Cheer',
        description: 'A user cheers on the specified channel.',
        conditions: ['broadcaster_user_id'],
        scope: 'bits:read',
        resource: 'Channel'
    },
    "channel.raid": {
        version: '1',
        name: 'Channel Raid',
        description: 'A broadcaster raids another broadcaster’s channel.',
        conditions: ['from_broadcaster_user_id'],
        resource: 'Channel'
    },
    "channel.ban": {
        version: '1',
        name: 'Channel Ban',
        description: 'A viewer is banned from the specified channel.',
        conditions: ['broadcaster_user_id'],
        scope: 'moderation:read',
        resource: 'Channel'
    },
    "channel.unban": {
        version: '1',
        name: 'Channel Unban',
        description: 'A viewer is unbanned from the specified channel.',
        conditions: ['broadcaster_user_id'],
        scope: 'moderation:read',
        resource: 'Channel'
    },
    "channel.moderator.add": {
        version: '1',
        name: 'Channel Moderator Add',
        description: 'Moderator privileges were added to a user on a specified channel.',
        conditions: ['broadcaster_user_id'],
        scope: 'moderation:read',
        resource: 'Channel'
    },
    "channel.moderator.remove": {
        version: '1',
        name: 'Channel Moderator Remove',
        description: 'Moderator privileges were removed from a user on a specified channel.',
        conditions: ['broadcaster_user_id'],
        scope: 'moderation:read',
        resource: 'Channel'
    },
    "channel.channel_points_custom_reward.add": {
        version: '1',
        name: 'Channel Points Custom Reward Add',
        description: 'A custom channel points reward has been created for the specified channel.',
        conditions: ['broadcaster_user_id'],
        scope: ['channel:read:redemptions', 'channel:manage:redemptions'],
        resource: 'Channel'
    },
    "channel.channel_points_custom_reward.update": {
        version: '1',
        name: 'Channel Points Custom Reward Update',
        description: 'A custom channel points reward has been updated for the specified channel.',
        conditions: ['broadcaster_user_id', 'reward_id'],
        scope: ['channel:read:redemptions', 'channel:manage:redemptions'],
        resource: 'Channel'
    },
    "channel.channel_points_custom_reward.remove": {
        version: '1',
        name: 'Channel Points Custom Reward Remove',
        description: 'A custom channel points reward has been removed from the specified channel.',
        conditions: ['broadcaster_user_id', 'reward_id'],
        scope: ['channel:read:redemptions', 'channel:manage:redemptions'],
        resource: 'Channel'
    },
    "channel.channel_points_custom_reward_redemption.add": {
        version: '1',
        name: 'Channel Points Custom Reward Redemption Add',
        description: 'A viewer has redeemed a custom channel points reward on the specified channel.',
        conditions: ['broadcaster_user_id', 'reward_id'],
        scope: ['channel:read:redemptions', 'channel:manage:redemptions'],
        resource: 'Channel'
    },
    "channel.channel_points_custom_reward_redemption.update": {
        version: '1',
        name: 'Channel Points Custom Reward Redemption Update',
        description: 'A redemption of a channel points custom reward has been updated for the specified channel.',
        conditions: ['broadcaster_user_id', 'reward_id'],
        scope: ['channel:read:redemptions', 'channel:manage:redemptions'],
        resource: 'Channel'
    },
    "channel.poll.begin": {
        version: '1',
        name: 'Channel Poll Begin',
        description: 'A poll started on a specified channel.',
        conditions: ['broadcaster_user_id'],
        scope: ['channel:read:polls', 'channel:manage:polls'],
        resource: 'Channel'
    },
    "channel.poll.progress": {
        version: '1',
        name: 'Channel Poll Progress',
        description: 'Users participated in a Prediction on a specified channel.',
        conditions: ['broadcaster_user_id'],
        scope: ['channel:read:polls', 'channel:manage:polls'],
        resource: 'Channel'
    },
    "channel.poll.end": {
        version: '1',
        name: 'Channel Poll End',
        description: 'A Prediction ended on a specified channel.',
        conditions: ['broadcaster_user_id'],
        scope: ['channel:read:polls', 'channel:manage:polls'],
        resource: 'Channel'
    },
    "channel.prediction.begin": {
        version: '1',
        name: 'Channel Prediction Begin',
        description: 'A Prediction started on a specified channel.',
        conditions: ['broadcaster_user_id'],
        scope: ['channel:read:predictions', 'channel:manage:predictions'],
        resource: 'Channel'
    },
    "channel.prediction.progress": {
        version: '1',
        name: 'Channel Prediction Progress',
        description: 'Users participated in a Prediction on a specified channel.',
        conditions: ['broadcaster_user_id'],
        scope: ['channel:read:predictions', 'channel:manage:predictions'],
        resource: 'Channel'
    },
    "channel.prediction.lock": {
        version: '1',
        name: 'Channel Prediction Lock',
        description: 'A Prediction was locked on a specified channel.',
        conditions: ['broadcaster_user_id'],
        scope: ['channel:read:predictions', 'channel:manage:predictions'],
        resource: 'Channel'
    },
    "channel.prediction.end": {
        version: '1',
        name: 'Channel Prediction End',
        description: 'A Prediction ended on a specified channel.',
        conditions: ['broadcaster_user_id'],
        scope: ['channel:read:predictions', 'channel:manage:predictions'],
        resource: 'Channel'
    },
    "drop.entitlement.grant": {
        version: '1',
        name: 'Drop Entitlement Grant',
        description: 'An entitlement for a Drop is granted to a user.',
        conditions: ['organization_id', 'category_id', 'campaign_id'],
        resource: 'Channel'
    },
    "extension.bits_transaction.create": {
        version: '1',
        name: 'Extension Bits Transaction Create',
        description: 'A Bits transaction occurred for a specified Twitch Extension.',
        conditions: ['extension_client_id'],
        resource: 'Channel'
    },
    "channel.goal.begin": {
        version: '1',
        name: 'Goal Begin',
        description: 'Get notified when a broadcaster begins a goal.',
        conditions: ['broadcaster_user_id'],
        scope: 'channel:read:goals',
        resource: 'Channel'
    },
    "channel.goal.progress": {
        version: '1',
        name: 'Goal Progress',
        description: 'Get notified when progress (either positive or negative) is made towards a broadcaster’s goal.',
        conditions: ['broadcaster_user_id'],
        scope: 'channel:read:goals',
        resource: 'Channel'
    },
    "channel.goal.end": {
        version: '1',
        name: 'Goal End',
        description: 'Get notified when a broadcaster ends a goal.',
        conditions: ['broadcaster_user_id'],
        scope: 'channel:read:goals',
        resource: 'Channel'
    },
    "channel.hype_train.begin": {
        version: '1',
        name: 'Hype Train Begin',
        description: 'A Hype Train begins on the specified channel.',
        conditions: ['broadcaster_user_id'],
        scope: 'channel:read:hype_train',
        resource: 'Channel'
    },
    "channel.hype_train.progress": {
        version: '1',
        name: 'Hype Train Progress',
        description: 'A Hype Train makes progress on the specified channel.',
        conditions: ['broadcaster_user_id'],
        scope: 'channel:read:hype_train',
        resource: 'Channel'
    },
    "channel.hype_train.end": {
        version: '1',
        name: 'Hype Train End',
        description: 'A Hype Train ends on the specified channel.',
        conditions: ['broadcaster_user_id'],
        scope: 'channel:read:hype_train',
        resource: 'Channel'
    },
    "stream.online": {
        version: '1',
        name: 'Stream Online',
        description: 'The specified broadcaster starts a stream.',
        conditions: ['broadcaster_user_id'],
        resource: 'Stream'
    },
    "stream.offline": {
        version: '1',
        name: 'Stream Offline',
        description: 'The specified broadcaster stops a stream.',
        conditions: ['broadcaster_user_id'],
        resource: 'Stream'
    },
    "user.authorization.grant": {
        version: '1',
        name: 'User Authorization Grant',
        description: 'A user’s authorization has been granted to your client id.',
        conditions: ['client_id'],
        resource: 'User'
    },
    "user.authorization.revoke": {
        version: '1',
        name: 'User Authorization Revoke',
        description: 'A user’s authorization has been revoked for your client id.',
        conditions: ['client_id'],
        resource: 'User'
    },
    "user.update": {
        version: '1',
        name: 'User Update',
        description: 'A user has updated their account.',
        conditions: ['user_id'],
        resource: 'User'
    }
};

const UNNOFF_TTV_API_INFO = {
    'Get Channel Viewers': {
        token_type: null,
        resource: 'Undocumented'
    }
};

const MODULE_DETAILS = {
    name: 'TwitchAPI',
    description: 'Interface to the Twitch API to change Settings and Fetch Data.',
    picture: '/images/icons/twitch_colored.png'
};

class TwitchAPI extends require('./../Util/ModuleBase.js') {
    constructor(configJSON, logger, TwitchIRC) {
        if (logger && logger.identify && logger.identify() === "FrikyBotLogger") {
            logger.addSources({
                TwitchAPI: {
                    display: () => " TwitchAPI ".inverse.magenta
                }
            });
        }

        super(MODULE_DETAILS, configJSON, logger.TwitchAPI);
        
        this.Config.AddSettingTemplates([
            { name: 'ClientID', type: 'string', requiered: true, group: 0 },
            { name: 'Secret', type: 'string', private: true, requiered: true, group: 0 },
            { name: 'Claims', type: 'array', group: 3, default: ['picture', 'preferred_username'] },
            { name: 'Tokens_Dir', type: 'string', default: 'Tokens/' },
            { name: 'Log_Dir', type: 'string', default: 'Logs/' + MODULE_DETAILS.name + '/' },
            { name: 'Authenticator', type: 'config', requiered: true },
            { name: 'disabled_api_endpoints', type: 'array', selection: Object.getOwnPropertyNames(TTV_API_INFO), allow_empty: true, default: [] },
            { name: 'log_api_calls', type: 'boolean', default: true },
            { name: 'disabled_eventsub_topics', type: 'array', selection: Object.getOwnPropertyNames(TTV_EVENTSUB_TOPICS), allow_empty: true, default: ['drop.entitlement.grant', 'extension.bits_transaction.create', 'user.authorization.grant', 'user.authorization.revoke', 'user.update'] },
            { name: 'EventSub_Secret', type: 'string', private: true, requiered: true, default_func: () => this.regenerateEventSubSecret(false) },
            { name: 'EventSub_max_Timeout', type: 'number', default: 5, min: 1 }
        ]);
        this.Config.options = {
            groups: [{ name: 'Your Application' }, { name: 'User Login' }, { name: 'Authenticatior' }, { name: 'Twitch Api Settings' }, { name: 'EventSub Topics' }]
        };
        this.Config.Load();
        this.Config.FillConfig();

        //Ready
        this.addReadyRequirement(() => {
            let cfg = this.Config.GetConfig();
            if (cfg['ClientID'] === "") return false;
            if (cfg['Secret'] === "") return false;
            return true;
        });

        this.TwitchIRC = TwitchIRC;
        this.WebAppInteractor = null;

        //API Stuff
        this.RateLimits = null;
        this.AppAccessToken = null;
        this.UserAccessToken = null;
        this.EventSubs = [];
        this.EventSubs_Duplicates = [];
        this.EventSubs_Extern_Callback = [];

        //Logging
        this.API_LOG;
        this.Settings_LOG;

        //STATS
        this.STAT_API_CALLS = 0;
        this.STAT_API_CALLS_PER_10 = 0;

        this.STAT_MINUTE_TIMER = setInterval(() => {
            this.STAT_API_CALLS_PER_10 = 0;
        }, 600000);
        
        //Displayables
        this.addDisplayables([
            { name: 'API Access', value: () => this.UserAccessToken ? 'FULL' : this.AppAccessToken ? 'LIMITED' : 'NONE' },
            { name: 'User Token Created at', value: () => this.UserAccessToken ? this.UserAccessToken['created_at'] : '-' },
            { name: 'User Token Expires at', value: () => this.UserAccessToken ? this.UserAccessToken['expires_at'] : '-' },
            { name: 'App Token Created at', value: () => this.AppAccessToken ? this.AppAccessToken['created_at'] : '-' },
            { name: 'App Token Expires at', value: () => this.AppAccessToken ? this.AppAccessToken['expires_at'] : '-' },
            { name: 'Total API Calls', value: () => this.STAT_API_CALLS },
            { name: 'API Calls Per 10 Min', value: () => this.STAT_API_CALLS_PER_10 },
            { name: 'API Endpoints', value: Object.getOwnPropertyNames(TTV_API_INFO) },
            {
                name: 'Active EventSubs', value: () => {
                    let whs = [];
                    for (let wh of this.EventSubs) whs.push(wh.type);
                    return whs;
                }
            },
            { name: 'Broken EventSubs', value: () => this.GetMissingEventSubs() }
        ]);
    }

    //////////////////////////////////////////////////////////////////////
    //                          SETUP
    //////////////////////////////////////////////////////////////////////

    async Init(WebInter) {
        let cfg = this.Config.GetConfig();

        //File Structure Check
        const DIRS = [cfg.Tokens_Dir, cfg.Tokens_Dir + "AppAccess/", cfg.Tokens_Dir + "UserAccess/", cfg.Log_Dir];
        for (let dir of DIRS) {
            if (!fs.existsSync(path.resolve(dir))) {
                try {
                    fs.mkdirSync(path.resolve(dir));
                } catch (err) {
                    return Promise.reject(err);
                }
            }
        }
        
        //Add API
        this.WebAppInteractor = WebInter;
        this.setAPI(WebInter);

        //Create Class Functions
        this.CreateTTVApiFunctions();

        //Init Logging Database
        this.API_LOG = new Datastore({ filename: path.resolve(cfg.Log_Dir + 'API_Logs.db'), autoload: true });
        this.TOKEN_LOG = new Datastore({ filename: path.resolve(cfg.Log_Dir + 'Token_Logs.db'), autoload: true });
        this.EVENTSUB_LOG = new Datastore({ filename: path.resolve(cfg.Log_Dir + 'EventSub_Logs.db'), autoload: true });
        this.Settings_LOG = new Datastore({ filename: path.resolve(cfg.Log_Dir + 'Settings_Logs.db'), autoload: true });

        this.addLog('Twitch API Calls', this.API_LOG);
        this.addLog('Token Updates', this.TOKEN_LOG);
        this.addLog('EventSub Events', this.EVENTSUB_LOG);
        this.addLog('Settings Changes', this.Settings_LOG);

        //Check Config
        if (!this.isReady()) return Promise.resolve();
        
        //Checking Tokens
        this.Logger.warn("Checking Access Tokens...");
        try {
            await this.updateAppAccessToken();
            this.Logger.info("App Access Token found!".green);
        } catch (err) {

        }

        try {
            await this.updateUserAccessToken();
            this.Logger.info("User Access Token found!".green);
        } catch (err) {
            this.Logger.warn("User Access Token not found! Only Basic API access available!");
        }

        //EventSubs
        try {
            await this.updateEventSubs();
        } catch (err) {
            if (err.message === 'not deployed') this.Logger.warn("Server currently not set to be deployed. Change WebApp Hostname when its actually deployed!");
            else this.Logger.warn("EventSub Error: " + err.message);
        }

        return Promise.resolve();
    }
    setAPI(WebInter) {
        let api_router = express.Router();
        //Tokens
        api_router.route('/')
            .get(async (req, res) => {
                if (!this.isEnabled()) return res.status(503).json({ err: 'Twitch API is disabled' });
                if (typeof req.query['type'] === 'string') req.query['type'] = [req.query['type']];

                let data = [];

                for (let type of req.query['type'] || ['app', 'user']) {
                    let tkn_data = {
                        type: type,
                        state: 'unavailable',
                        data: null
                    };

                    if (type === 'app') {
                        try {
                            if (this.AppAccessToken) {
                                tkn_data.state = 'available';
                                tkn_data.data = this.getAppTokenStatus();
                            }
                        } catch (err) {

                        }
                    }
                    else if (type === 'user') {
                        try {
                            if (this.UserAccessToken) {
                                tkn_data.state = 'available';
                                tkn_data.data = await this.getUserTokenStatus();
                            }
                        } catch (err) {

                        }
                    }
                    else {
                        return res.json({ err: 'invalid Type ' + type });
                    }

                    data.push(tkn_data);
                }
                
                return res.json({ data: data });
            })
            .patch(async (req, res) => {
                if (!this.isEnabled()) return res.status(503).json({ err: 'Twitch API is disabled' });
                if (typeof req.body['type'] === 'string') req.body['type'] = [req.body['type']];

                let data = {};

                for (let type of req.body['type'] || ['app', 'user']) {
                    let tkn_data = {
                        state: 'unavailable',
                        data: null
                    };

                    if (type === 'app') {
                        try {
                            await this.updateAppAccessToken();
                            tkn_data.data = this.getAppTokenStatus();
                            if (this.AppAccessToken) tkn_data.state = 'available';
                        } catch (err) {

                        }
                    }
                    else if (type === 'user') {
                        try {
                            await this.updateUserAccessToken();
                            tkn_data.data = await this.getUserTokenStatus();
                            if (this.UserAccessToken) tkn_data.state = 'available';
                        } catch (err) {

                        }
                    }
                    else {
                        return res.json({ err: 'invalid Type ' + type });
                    }

                    data[type] = tkn_data;
                }

                //Logging
                if (this.Settings_LOG) {
                    this.Settings_LOG.insert({
                        endpoint: '/api/TwitchAPI/token',
                        method: 'PATCH',
                        body: req.body,
                        time: Date.now()
                    });
                }

                return res.json({ data });
            })
            .delete(async (req, res) => {
                if (!this.isEnabled()) return res.status(503).json({ err: 'Twitch API is disabled' });
                if (typeof req.query['type'] === 'string') req.query['type'] = [req.query['type']];

                let data = [];

                for (let type of req.query['type'] || ['app', 'user']) {
                    let tkn_data = {
                        type: type,
                        state: 'failed'
                    };

                    if (type === 'app') {
                        //App
                        try {
                            await this.removeAppAccessToken();
                            data.app.state = this.AppAccessToken ? 'failed' : 'deleted';
                        } catch (err) {

                        }
                    }
                    else if (type === 'user') {
                        //User
                        try {
                            await this.removeUserAccessToken();
                            data.user.state = this.UserAccessToken ? 'failed' : 'deleted';
                        } catch (err) {

                        }
                    }
                    else {
                        return res.json({ err: 'invalid Type ' + type });
                    }

                    data.push(tkn_data);
                }

                //Logging
                if (this.Settings_LOG) {
                    this.Settings_LOG.insert({
                        endpoint: '/api/TwitchAPI/token',
                        method: 'DELETE',
                        query: req.query,
                        time: Date.now()
                    });
                }

                return res.json({ data: data });
            });
        
        WebInter.addAuthAPIRoute('/TwitchAPI/token', { user_level: 'staff' }, api_router);
        //Scopes
        WebInter.addAuthAPIEndpoint('/TwitchAPI/Scopes', { user_level: 'staff' }, 'GET', (request, response) => {
            if (!this.isEnabled()) return response.status(503).json({ err: 'Twitch API is disabled' });

            let cfg = this.Config.GetConfig();
            
            response.json({
                data: {
                    scopes: this.GetScopes(),
                    claims: cfg.Claims
                }
            });
        });
        //Settings
        WebInter.addAuthAPIEndpoint('/settings/TwitchAPI/Application', { user_level: 'staff' }, 'POST', async (req, res) => {
            if (!this.isEnabled()) return res.status(503).json({ err: 'Twitch API is disabled' });

            const prechangeID = this.Config.GetConfig()['ClientID'];
            const prechangeSecret = this.Config.GetConfig()['Secret'];

            //Change Setting
            let error = this.Config.UpdateSetting('ClientID', req.body['ClientID']);
            if (error !== true) return res.json({ err: error });

            error = this.Config.UpdateSetting('Secret', req.body['Secret']);
            if (error !== true) {
                //Reset Change
                this.Config.UpdateSetting('ClientID', prechangeID);
                return res.json({ err: error });
            }

            //Request App Access (check if info is correct)
            try {
                let newToken = await this.getAppAccessToken();
                this.Logger.warn("Requested a new App Access Token!");

                //SAVE NEW
                if (newToken && newToken.access_token) {
                    this.setExtraTokenDetails(newToken);
                    this.saveToken(newToken, "AppAccess");
                    this.AppAccessToken = newToken;
                }
            } catch (err) {
                this.Config.UpdateSetting('ClientID', prechangeID);
                this.Config.UpdateSetting('Secret', prechangeSecret);
                return res.json({ err: 'TwitchDev Application Information invalid' });
            }

            //Check User Token or revoke
            try {
                await this.updateAppAccessToken();
            } catch (err) {

            }
            
            //Logging
            if (this.Settings_LOG) {
                this.Settings_LOG.insert({
                    endpoint: '/api/settings/TwitchAPI/Application',
                    method: 'POST',
                    body: req.body,
                    time: Date.now()
                });
            }

            return res.json({
                msg: 'Application Info successfully changed',
                ClientID: this.Config.GetConfig()['ClientID'],
                Secret: this.Config.GetConfig()['Secret'],
                usertoken: this.UserAccessToken !== null
            });
        });
        WebInter.addAuthAPIEndpoint('/settings/TwitchAPI/Endpoints/:endpoint', { user_level: 'staff' }, 'PUT', async (req, res) => {
            if (!this.isEnabled()) return res.status(503).json({ err: 'Twitch API is disabled' });

            const endpoint = req.params.endpoint;
            const mode = req.query.mode;
            const unoff = req.query.unoff == 'true' || req.query.unoff == true;
            
            //Find Current Disabled API Endpoints
            let disabled_api_endpoints = this.Config.GetConfig()['disabled_api_endpoints'].slice(0);

            let new_off = Object.getOwnPropertyNames(TTV_API_INFO).filter(elt => disabled_api_endpoints.find(name => name === elt));
            let new_unoff = Object.getOwnPropertyNames(UNNOFF_TTV_API_INFO).filter(elt => disabled_api_endpoints.find(name => name === elt));
            
            if (endpoint === 'all') {
                //Set/Remove multiple Entries
                if (mode === 'toggle') {
                    if (unoff) {
                        if (new_unoff.length == 0) new_unoff = Object.getOwnPropertyNames(UNNOFF_TTV_API_INFO);
                        else new_unoff = [];
                    } else {
                        if (new_off.length == 0) new_unoff = Object.getOwnPropertyNames(TTV_API_INFO);
                        else new_off = [];
                    }
                } else if (mode === 'enable') {
                    if (unoff) new_unoff = [];
                    else new_off = [];
                } else if (mode === 'disable') {
                    if (unoff) new_unoff = Object.getOwnPropertyNames(UNNOFF_TTV_API_INFO);
                    else new_off = Object.getOwnPropertyNames(TTV_API_INFO);
                } else {
                    return res.json({ err: 'Mode not found or not supported.' });
                }
                
                disabled_api_endpoints = new_off.concat(new_unoff);
            } else {
                if (!endpoint || (!TTV_API_INFO[endpoint] && !UNNOFF_TTV_API_INFO[endpoint])) return res.json({ err: 'Endpoint not found or not supported.' });

                //Set/Remove One Entry
                let index = -1;
                disabled_api_endpoints.find((elt, idx) => {
                    if (elt === endpoint) {
                        index = idx;
                        return true;
                    }
                    return false;
                });

                //Toggle Enable/Disable
                if (mode === 'toggle') {
                    if (index >= 0) disabled_api_endpoints.splice(index, 1);
                    else disabled_api_endpoints.push(endpoint);
                } else if (mode === 'enable') {
                    if (index >= 0) disabled_api_endpoints.splice(index, 1);
                } else if (mode === 'disable') {
                    if (index < 0) disabled_api_endpoints.push(endpoint);
                } else {
                    return res.json({ err: 'Mode not found or not supported.' });
                }
            }
            
            //Logging
            if (this.Settings_LOG) {
                this.Settings_LOG.insert({
                    endpoint: '/api/settings/TwitchAPI/Endpoints/:endpoint',
                    method: 'PUT',
                    params: req.params,
                    query: req.query,
                    time: Date.now()
                });
            }

            //Update Config
            this.Config.UpdateSetting('disabled_api_endpoints', disabled_api_endpoints);

            if (endpoint === 'all') {
                if (unoff) return res.json({ state: new_unoff.length === 0 });
                else return res.json({ state: new_off.length === 0 });
            }
            else return res.json({ state: this.Config.GetConfig()['disabled_api_endpoints'].find(elt => elt === endpoint) === undefined });
        });
        WebInter.addAuthAPIEndpoint('/settings/TwitchAPI/EventSub/:topic', { user_level: 'staff' }, 'PUT', async (req, res) => {
            if (!this.isEnabled()) return res.status(503).json({ err: 'Twitch API is disabled' });

            const topic = req.params.topic;
            const mode = req.query.mode;

            //Find Current Disabled API Endpoints
            let disabled_eventsub_topics = this.Config.GetConfig()['disabled_eventsub_topics'].slice(0);
            let new_dis = Object.getOwnPropertyNames(TTV_EVENTSUB_TOPICS).filter(elt => disabled_eventsub_topics.find(name => name === elt));
            
            if (topic === 'all') {
                //Set/Remove multiple Entries
                if (mode === 'toggle') {
                    if (new_dis.length == 0) new_dis = Object.getOwnPropertyNames(TTV_EVENTSUB_TOPICS);
                    else new_dis = [];
                } else if (mode === 'enable') {
                    new_dis = [];
                } else if (mode === 'disable') {
                    new_dis = Object.getOwnPropertyNames(TTV_EVENTSUB_TOPICS);
                } else {
                    return res.json({ err: 'Mode not found or not supported.' });
                }
            } else {
                //Set/Remove One Entry
                let index = -1;
                disabled_eventsub_topics.find((elt, idx) => {
                    if (elt === topic) {
                        index = idx;
                        return true;
                    }
                    return false;
                });

                if (mode === 'toggle') {
                    if (index < 0) new_dis.push(topic);
                    else new_dis.splice(index, 1);
                } else if (mode === 'enable') {
                    if (index >= 0) new_dis.splice(index, 1);
                } else if (mode === 'disable') {
                    if (index < 0) new_dis.push(topic);
                } else {
                    return res.json({ err: 'Mode not found or not supported.' });
                }
            }

            //Update Config
            this.Config.UpdateSetting('disabled_eventsub_topics', new_dis);

            if (topic === 'all') return res.json({ state: new_dis.length === 0 });
            else return res.json({ state: this.Config.GetConfig()['disabled_eventsub_topics'].find(elt => elt === topic) === undefined });
        });
        WebInter.addAuthAPIEndpoint('/settings/TwitchAPI/misc', { user_level: 'staff' }, 'PUT', (req, res) => {
            if (!this.isEnabled()) return response.status(503).json({ err: 'Twitch API is disabled' });

            const setting = req.body.setting;
            const mode = req.body.mode;
            
            let cfg = this.Config.GetConfig();
            let new_value = cfg[setting];

            if (new_value === undefined) return res.json({ err: 'Setting not found!' });
            
            //Mode Manipulation of the current Value
            if (mode === 'toggle') new_value = new_value === false;
            else if (mode === 'set') new_value = req.body.value;
            else return res.json({ err: 'Mode not found!' });
            
            //Logging
            if (this.Settings_LOG) {
                this.Settings_LOG.insert({
                    endpoint: '/api/settings/TwitchAPI/misc',
                    method: 'PUT',
                    body: req.body,
                    time: Date.now()
                });
            }

            //Change Setting
            let error = this.Config.UpdateSetting(setting, new_value);
            if (error !== true) return res.json({ err: error });
            else return res.json({ state: new_value });
        });
        //Util
        WebInter.addAuthAPIEndpoint('/TwitchAPI/FindChannel', { user_level: 'staff' }, 'GET', async (req, res) => {
            if (!this.isEnabled()) return response.status(503).json({ err: 'Twitch API is disabled' });

            let channels = [];

            //Fetch Data
            try {
                if (req.query.channel) {
                    let channelsData = (await this.SearchChannels({ query: req.query.channel, first: 5 })).data;
                    
                    //Restructure Data
                    for (let channel of channelsData) {
                        channels.push({
                            id: channel.id,
                            display_name: channel.display_name,
                            login: channel.broadcaster_login,
                            img: channel.thumbnail_url,
                            is_live: channel.is_live
                        });
                    }
                }
            } catch (err) {

            }

            //Send Data
            res.json({ data: channels });
        });

        //EventSub
        WebInter.addAuthAPIEndpoint('/TwitchAPI/EventSub', { user_level: 'admin' }, 'GET', async (req, res) => {
            if (!this.isEnabled()) return response.status(503).json({ err: 'Twitch API is disabled' });

            let topic = req.query['topic'];
            
            //Fetch Data
            try {
                if(topic === 'all') {
                    await this.updateEventSubs();
                } else {
                    await this.updateEventSub(topic);
                }

                res.json({ data: this.EventSubs });
                return Promise.resolve();
            } catch (err) {
                console.log(err);
                res.json({ err: err.message });
                return Promise.resolve();
            }
            
            res.sendStatus(500);
        });
        WebInter.addAPIEndpoint('/TwitchAPI/EventSub/master', 'POST', async (req, res) => this.WEBHOOK_MASTER_CALLBACK(req, res));
    }
    CreateTTVApiFunctions() {
        for (let api_endpoint in TTV_API_INFO) {
            let name = this.trimString(api_endpoint);
            if (this[name] !== undefined) name += "_RAW";
            
            this[name] = async (querry_params, body, raw, extern_jwt) => {
                return this.AccessTwitchNewAPI(api_endpoint, querry_params, body, raw || TTV_API_INFO[api_endpoint].returns_raw, extern_jwt);
            };
        }
    }

    //////////////////////////////////////////////////////////////////////
    //                  TWTICH AUTHORIZATION
    //////////////////////////////////////////////////////////////////////
    
    // APP ACCESS
    async getAppAccessToken() {
        let cfg = this.Config.GetConfig();

        let URL = "https://id.twitch.tv/oauth2/token?";
        URL += "client_id=" + cfg.ClientID;
        URL += "&client_secret=" + cfg.Secret;
        URL += "&grant_type=client_credentials";
        URL += "&scope=";

        for (let scope of this.GetScopes()) {
            URL += scope + "+";
        }

        URL = URL.substring(0, URL.length - 1);
        
        let options = {
            method: "POST"
        };
        
        return FETCH(URL, options)
            .then(data => data.json())
            .then(json => {
                if (json && json.access_token) {
                    return Promise.resolve(json);
                } else {
                    return Promise.reject(json);
                }
            })
            .catch(err => Promise.reject(err));
    }
    async updateAppAccessToken() {
        let cfg = this.Config.GetConfig();

        //Current is still valid?
        if (this.AppAccessToken && this.AppAccessToken.access_token) {
            try {
                await this.CheckAccessToken(this.AppAccessToken.access_token)
                return Promise.resolve(this.AppAccessToken);
            } catch (err) {
                this.AppAccessToken = null;
                return this.updateAppAccessToken();
            }
        }
        
        //Check Old Tokens
        let oldTokens = this.readTokensFromFile("AppAccess");

        for (let token of oldTokens) {
            //Is still valid?
            try {
                await this.CheckAccessToken(token.access_token);
                this.AppAccessToken = token;
                return Promise.resolve(token);
            } catch (err1) {
                if (err1.message === 'Endpoint is disabled.') continue;
                if (err1.message === 'TWITCHDOWN') return Promise.resolve(token);

                //Invalid -> DELETE
                try {
                    //REVOKE
                    let resp = await this.revoke(token.access_token);

                    if (resp != "200 OK") {
                        this.Logger.warn("Revoking App Access Token failed: " + resp.message);
                    } else {
                        this.Logger.warn("Revoked App Access Token:" + resp);

                        //Logs
                        if (this.TOKEN_LOG) {
                            this.TOKEN_LOG.insert({
                                type: 'app',
                                method: 'revoke',
                                token: token.access_token,
                                time: Date.now()
                            });
                        }
                    }

                    //Delete OLD
                    this.Logger.warn("Deleting Old App Access Token!");
                    fs.unlinkSync(cfg.Tokens_Dir + "AppAccess/" + token.access_token + ".json");
                } catch (err) {
                    this.Logger.error("Revoking/Deleting Old App Access Token FAILED! - " + err.message);
                    continue;
                }
            }
        }
        
        try {
            //GET NEW
            let newToken = await this.getAppAccessToken();
            this.Logger.warn("Requested a new App Access Token!");
            
            //Logs
            if (this.TOKEN_LOG) {
                this.TOKEN_LOG.insert({
                    type: 'app',
                    method: 'request',
                    token: newToken.access_token,
                    time: Date.now()
                });
            }

            //SAVE NEW
            this.setExtraTokenDetails(newToken);
            this.saveToken(newToken, "AppAccess");
            this.AppAccessToken = newToken;
            return Promise.resolve(newToken);
        } catch (err) {
            return Promise.reject(err);
        }
    }
    async removeAppAccessToken() {
        let cfg = this.Config.GetConfig();
    
        try {
            //REVOKE
            let tkn = this.AppAccessToken.access_token;
            let resp = await this.revoke(tkn);
            this.Logger.warn("Revoked App Access Token:" + resp);

            if (resp != "200 OK") 
                return Promise.reject(new Error('Revoking failed!'));

            this.AppAccessToken = null;

            //Delete OLD
            this.Logger.warn("Deleting Old App Access Token!");
            fs.unlinkSync(cfg.Tokens_Dir + "AppAccess/" + tkn + ".json");
            return Promise.resolve();
        } catch (err) {
            return Promise.reject(err);
        }
    }

    // USER ACCESS
    generateUserAccessLinkCode(scopes = [], claims = []) {
        let cfg = this.Config.GetConfig();
        let port = this.Config.parent.GetConfigJSON()['WebApp']['Port'];

        let query = "https://id.twitch.tv/oauth2/authorize";
        query += "?client_id=" + cfg.ClientID;
        query += "&redirect_uri=http://localhost:" + port + "/Twitch-redirect";
        query += "&response_type=code";
        query += "&scope=";

        for (let scope of scopes) {
            query += scope + "+";
        }
        
        query += "openid";

        if (claims && claims.length > 0) {
            let obj = {};
            for (let claim of claims) {
                obj[claim] = null;
            }
            query += "&claims=" + JSON.stringify({ id_token: obj });
        }

        query += "&force_verify=true"

        return query;
    }
    generateUserAccessLinkToken(scopes = [], claims = []) {
        let cfg = this.Config.GetConfig();
        let port = this.Config.parent.GetConfigJSON()['WebApp']['Port'];

        let query = "https://id.twitch.tv/oauth2/authorize"
        query += "?client_id=" + cfg.ClientID;
        query += "&redirect_uri=http://localhost:" + port + "/Twitch-redirect";
        query += "&response_type=" + (scopes.length > 0 ? 'token+' : '') + "id_token";
        query += "&scope=openid";
        
        for (let scope of scopes) query += "%20" + scope;
        
        if (claims && claims.length > 0) {
            let obj = {};
            for (let claim of claims) {
                obj[claim] = null;
            }
            query += "&claims=" + JSON.stringify({ id_token: obj });
        }

        query += "&force_verify=true";

        return query;
    }

    async getUserAccessToken(code) {
        let cfg = this.Config.GetConfig();
        let port = this.Config.parent.GetConfigJSON()['WebApp']['Port'];

        let URL = "https://id.twitch.tv/oauth2/token";
        URL += "?client_id=" + cfg.ClientID;
        URL += "&client_secret=" + cfg.Secret;
        URL += "&code=" + code;
        URL += "&grant_type=authorization_code";
        URL += "&redirect_uri=http://localhost:" + port + "/Twitch-redirect";

        let options = {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            }
        };

        return new Promise(async (resolve, reject) => {
            FETCH(URL, options)
                .then(data => {
                    //console.log(data.headers);
                    return data.json();
                })
                .then(json => {
                    if (json && json.access_token) {
                        resolve(json);
                    } else {
                        reject(json);
                    }
                })
                .catch(err => reject(err));
        });
    }
    async createUserAccessToken(code, scopes) {
        return new Promise(async (resolve, reject) => {
            try {
                //GET NEW
                let newToken = await this.getUserAccessToken(code);

                if (!newToken || !newToken.access_token || !newToken.id_token) {
                    reject(new Error("Token was not created properly!"));
                    return;
                }

                //Check JWT
                let idUser;
                try {
                    idUser = await this.VerifyTTVJWT(newToken.id_token);
                } catch (err) {
                    //JWT Validation failed
                    return Promise.reject(err);
                }

                //Logs
                if (this.TOKEN_LOG) {
                    this.TOKEN_LOG.insert({
                        type: 'user',
                        method: 'request',
                        user: idUser,
                        scope: newToken.scope,
                        token: newToken.access_token,
                        time: Date.now()
                    });
                }

                //SAVE NEW
                this.Logger.warn(idUser.preferred_username + " just logged in as Bot API User!");

                this.setExtraTokenDetails(newToken);
                this.saveToken(newToken, "UserAccess");
                this.UserAccessToken = newToken;

                //Delete Old
                if (this.UserAccessToken && this.UserAccessToken.access_token !== newToken.access_token) {
                    let cfg = this.Config.GetConfig();

                    //Logs
                    if (this.TOKEN_LOG) {
                        this.TOKEN_LOG.insert({
                            type: 'user',
                            method: 'remove',
                            token: this.UserAccessToken.access_token,
                            time: Date.now()
                        });
                    }

                    this.Logger.warn("Deleting Old User Access Token!");
                    try {
                        fs.unlinkSync(cfg.Tokens_Dir + "UserAccess/" + this.UserAccessToken.access_token + ".json");
                    } catch (err) {

                    }
                }

                this.UserAccessToken = newToken;
                resolve(newToken);
            } catch (err) {
                reject(err);
            }
        });
    }
    async updateUserAccessToken() {
        let cfg = this.Config.GetConfig();

        //Current is still valid?
        if (this.UserAccessToken && this.UserAccessToken.access_token) {
            try {
                await this.CheckAccessToken(this.UserAccessToken.access_token)
                return Promise.resolve(this.UserAccessToken);
            } catch (err) {
                this.UserAccessToken = null;
                return this.updateUserAccessToken();
            }
        }

        //Get all old Tokens
        let oldTokens = this.readTokensFromFile("UserAccess");
        
        for (let token of oldTokens) {
            //Is still valid?
            try {
                await this.CheckAccessToken(token.access_token);
                this.UserAccessToken = token;
                return Promise.resolve(token);
            } catch (err) {
                if (err.message === 'Endpoint is disabled.' || err.message === 'TWITCHDOWN') continue;

                //REFRESHABLE?
                try {
                    let resp = await this.refresh(token);
                    if (resp.error || !resp.access_token) {
                        //Logs
                        if (this.TOKEN_LOG) {
                            this.TOKEN_LOG.insert({
                                type: 'user',
                                method: 'remove',
                                token: token.access_token,
                                time: Date.now()
                            });
                        }

                        this.Logger.error("Refresh Error: " + resp.message);
                        this.Logger.warn("Deleting Old User Access Token!");
                        fs.unlinkSync(cfg.Tokens_Dir + "UserAccess/" + token.access_token + ".json");
                        continue;
                    }
                    this.Logger.info("Refreshed User Access Token!");

                    //Logs
                    if (this.TOKEN_LOG) {
                        this.TOKEN_LOG.insert({
                            type: 'user',
                            method: 'refresh',
                            token: resp.access_token,
                            prev_token: token.access_token,
                            time: Date.now()
                        });
                    }

                    //set new Token
                    this.setExtraTokenDetails(resp);
                    this.saveToken(resp, "UserAccess");
                    this.UserAccessToken = resp;
                    
                    //Delete Old Token
                    if (resp.access_token !== undefined && resp.access_token !== token.access_token) {
                        this.Logger.warn("Deleting Old User Access Token!");
                        fs.unlinkSync(cfg.Tokens_Dir + "UserAccess/" + token.access_token + ".json");
                    }
                    
                    return Promise.resolve(this.UserAccessToken);
                } catch (err1) {
                    this.Logger.error("Refreshing Old User Access Token Failed: " + err1.message);
                }
            }
        }

        //ASK FOR NEW LOGIN
        if (!this.UserAccessToken) return Promise.reject(new Error("Pls log in again"));
    }
    async removeUserAccessToken() {
        let cfg = this.Config.GetConfig();

        try {
            //Delete Old Token
            this.Logger.warn("Deleting Old User Access Token!");
            fs.unlinkSync(cfg.Tokens_Dir + "UserAccess/" + this.UserAccessToken.access_token + ".json");
            this.UserAccessToken = null;
            return Promise.resolve();
        } catch (err) {
            return Promise.reject(err);
        }
    }

    //Token Settings
    async revoke(token) {
        let cfg = this.Config.GetConfig();

        //ONLY APP ACCESS AND OAuth
        return FETCH("https://id.twitch.tv/oauth2/revoke?client_id=" + cfg.ClientID + "&token=" + token, { method: "POST" })
            .then(async (data) => {
                if (data.status == 200 && data.statusText == "OK") {
                    return Promise.resolve("200 OK");
                } else {
                    return data.json();
                }
            })
            .then(json => Promise.resolve(json))
            .catch(err => Promise.reject(err));
    }
    async refresh(token) {
        let cfg = this.Config.GetConfig();

        //Only UserAccess Token
        if (!token || !token.refresh_token) {
            return Promise.reject(new Error("No Token found."));
        }

        let querry = "?grant_type=refresh_token";
        querry += "&refresh_token=" + encodeURI(token.refresh_token);
        querry += "&client_id=" + cfg.ClientID;
        querry += "&client_secret=" + cfg.Secret;

        return FETCH("https://id.twitch.tv/oauth2/token" + querry, { method: "POST" })
            .then(data => data.json())
            .then(json => {
                if (json.error) {
                    return Promise.reject(json);
                } else {
                    return Promise.resolve(json);
                }
            })
            .catch(err => Promise.reject(err));
    }
    async OIDCUserInfoEndpoint(oauth) {
        return await this.request("https://id.twitch.tv/oauth2/userinfo", {
            headers: {
                'Authorization': 'Bearer ' + oauth
            }
        }, json => {
            return json;
        });
    }
    async CheckAccessToken(token) {
        let cfg = this.Config.GetConfig();

        //No Scopes/No Params -> using Stream Endpoint
        try {
            let resp = await this.request("https://api.twitch.tv/helix/streams?first=1", {
                headers: {
                    'Client-ID': cfg.ClientID,
                    'Authorization': "Bearer " + token
                }
            }, json => {
                return json;
                });
            
            if (resp && resp.data) {
                return Promise.resolve(true);
            } else {
                return Promise.reject(new Error("No Data Fetched -> Token may be invalid!"));
            }
        } catch (err) {
            return Promise.reject(err);
        }
    }
    async VerifyTTVJWT(token) {
        return new Promise((resolve, reject) => {
            let client = jwksClient({ jwksUri: TTV_JWK_URL });
            function getKey(header, callback) {
                client.getSigningKey(header.kid, function (err, key) {
                    var signingKey = key.publicKey || key.rsaPublicKey;
                    callback(null, signingKey);
                });
            }
            jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, user) => {
                if (err) return reject(err);
                else return resolve(user);
            });
        });
    }
    
    setExtraTokenDetails(token) {
        //Add created_at
        let date = new Date();
        token.created_at = date.toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });

        //Add expires_at
        date = new Date(Date.now() + (token.expires_in * 1000));
        token.expires_at = date.toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });
    }
    saveToken(token, type) {
        if (!token || !token.access_token) return;

        let cfg = this.Config.GetConfig();

        try {
            fs.writeFileSync(path.resolve(cfg.Tokens_Dir + type + "/" + token.access_token + ".json"), JSON.stringify(token, null, 4));
        } catch (err) {
            this.Logger.error(err.message);
        }

    }
    readTokensFromFile(type) {
        let cfg = this.Config.GetConfig();

        let files = [];
        let tokens = [];

        try {
            files = fs.readdirSync(cfg.Tokens_Dir + type + "/");
        } catch (err) {
            console.log(err);
        }

        for (let file of files) {
            try {
                let s = fs.readFileSync(path.resolve(cfg.Tokens_Dir + type + "/" + file));
                tokens.push(JSON.parse(s));
            } catch(err) {
                console.log(err);
            }
        }

        return tokens;
    }

    //Token UTIL
    getClaims() {
        let cfg = this.Config.GetConfig();
        let output = {

        };

        for (let key in cfg.Claims) {
            output[key] = null;
        }

        return { userinfo: output };
    }
    GetScopes() {
        let output = [];

        if (this.UserAccessToken) {
            output = this.UserAccessToken.scope.filter(scope => scope !== "openid");
        }

        return output;
    }
    async getUserTokenStatus() {
        if (!this.UserAccessToken) return Promise.resolve({});

        let user;

        try {
            user = await this.OIDCUserInfoEndpoint(this.UserAccessToken.access_token);
        } catch (err) {
            return Promise.reject(err);
        }
        
        if (!user) return Promise.resolve({});

        //Check Token
        try {
            await this.updateUserAccessToken();

            return Promise.resolve({
                sub: user.sub,
                preferred_username: user.preferred_username,
                picture: user.picture,
                iat: Math.floor(new Date(this.UserAccessToken.created_at).getTime() / 1000),
                exp: Math.floor(new Date(this.UserAccessToken.expires_at).getTime() / 1000),
                scopes: this.GetScopes()
            });
        } catch (err) {
            return Promise.resolve({});
        }
    }
    async getAppTokenStatus() {
        if (!this.AppAccessToken) return Promise.resolve({});

        //Check Token
        try {
            await this.CheckAccessToken(this.AppAccessToken.access_token);

            return Promise.resolve({
                iat: Math.floor(new Date(this.AppAccessToken.created_at).getTime() / 1000),
                exp: Math.floor(new Date(this.AppAccessToken.expires_at).getTime() / 1000),
            });
        } catch (err) {
            return Promise.resolve({});
        }
    }

    //////////////////////////////////////////////////////////////////////
    //                  TWITCH API - HELIX
    //////////////////////////////////////////////////////////////////////
    // - Query Parameters in form: { name: value }
    //      Value can be an array -> contents will be connected like this: 
    //       -> ?name=value0&name=value1&...
    // - Body Parameters in JSON form
    //////////////////////////////////////////////////////////////////////

    getQueryStringFromQueryParameters(Query_Parameters = {}) {
        let querry = "";

        for (let param in Query_Parameters) {
            if (Array.isArray(Query_Parameters[param])) {
                for (let value of Query_Parameters[param]) {
                    if (value !== undefined && value !== null)
                        querry += "&" + param + "=" + value;
                }

            } else {
                querry += "&" + param + "=" + Query_Parameters[param];
            }
        }
        if (querry == "") {
            return "";
        } else {
            return "?" + querry.substring(1);
        }
    }
    async AccessTwitchNewAPI(endpoint_name, querry_params, body, RETURN_RAW = false, extern_jwt, RETRYS = 3) {
        let cfg = this.Config.GetConfig();
        if (!this.isEnabled() || !this.isReady()) return Promise.reject(new Error('TwitchAPI is disabled.'));
        if (cfg['disabled_api_endpoints'].find(elt => elt === endpoint_name)) return Promise.reject(new Error('Endpoint is disabled.'));

        const ENDPOINT = TTV_API_INFO[endpoint_name];
        //Endpoint not found
        if (!ENDPOINT) return Promise.reject(new Error('Endpoint not found!'));
        //Needed Scope not found
        if (ENDPOINT.req_scope !== null && (!this.UserAccessToken || this.UserAccessToken.scope.find(elt => elt === ENDPOINT.req_scope) === undefined)) return Promise.reject(new Error('No Scope Access!'));
        
        let TOKEN_TYPE;
        let TOKEN_OBJECT;

        //Find and Select Token
        if (ENDPOINT.token_type == "App" || ENDPOINT.token_type == "Any") {
            //APP ACCESS
            if (!this.AppAccessToken && ENDPOINT.token_type != "Any") return Promise.reject(new Error("App Access Token NOT Available!"));
            TOKEN_TYPE = "App";
            TOKEN_OBJECT = this.AppAccessToken;
        }
        if ((ENDPOINT.token_type == "User" || ENDPOINT.token_type == "Any") && !TOKEN_OBJECT) {
            if (!this.UserAccessToken && ENDPOINT.token_type != "Any") return Promise.reject(new Error("User Access Token NOT Available!"));
            TOKEN_TYPE = "User";
            TOKEN_OBJECT = this.UserAccessToken;
        }
        if (ENDPOINT.token_type == "Extern" && !TOKEN_OBJECT) {
            TOKEN_TYPE = extern_jwt;
        }
        if (ENDPOINT.token_type === null) TOKEN_OBJECT = { access_token: 'None needed' };

        if (!TOKEN_OBJECT) return Promise.reject(new Error("No Access Token Available!"));
        
        //ADD TO STATS
        this.STAT_API_CALLS++;
        this.STAT_API_CALLS_PER_10++;

        if (this.API_LOG && cfg['log_api_calls']) {
            this.API_LOG.insert({
                endpoint: endpoint_name,
                token: TOKEN_TYPE,
                querry_params: querry_params,
                time: Date.now()
            });
        }
        
        //Start Fetch
        const OPTIONS = {
            method: ENDPOINT.method,
            headers: {
                'Authorization': 'Bearer ' + TOKEN_OBJECT.access_token,
                'Client-ID': cfg.ClientID,
                "Content-Type": ENDPOINT.MIME || "application/json"
            },
            body: JSON.stringify(body)
        };
        const ENDPOINT_URL = ENDPOINT.url + this.getQueryStringFromQueryParameters(querry_params);
        
        return FETCH(TTV_API_ROOT + ENDPOINT_URL, OPTIONS)
            .then(async data => {
                if (RETURN_RAW) {
                    return data.text();
                } else {
                    return data.json();
                }
            })
            .then(async data => {
                //Retry / Auto Update
                if (data instanceof Object && data.error == "Unauthorized" && data.message == "Invalid OAuth token") {
                    if (RETRYS > 0) {
                        this.Logger.info("Retry Accessing Twitch API: " + endpoint_name);
                        return this.AccessTwitchNewAPI(endpoint_name, querry_params, body, RETURN_RAW, extern_jwt, RETRYS - 1);
                    } else if (RETRYS == 0) {
                        //Auto Update Token
                        try {
                            if (TOKEN_TYPE == "User") {
                                await this.updateUserAccessToken();
                            } else if (TOKEN_TYPE == "App") {
                                await this.updateAppAccessToken();
                            }

                            return this.AccessTwitchNewAPI(endpoint_name, querry_params, body, RETURN_RAW, extern_jwt, RETRYS - 1);
                        } catch (err) {
                            console.log(err);
                            return Promise.reject(new Error("Unauthorized - OAuth Token invalid, outdated or missing!"));
                        }
                    } else {
                        return Promise.reject(new Error("Unauthorized - OAuth Token invalid, outdated or missing!"));
                    }
                }

                if (data.error) return Promise.reject(new Error(data.status + ": " + data.error + " - " + data.message));
                return Promise.resolve(data);
            })
            .catch(err => Promise.reject(err));
    }

    //EventSub
    async CreateEventSubSubscription(type) {
        if (!TTV_EVENTSUB_TOPICS[type]) return Promise.reject(new Error('Topic not supported!'));

        //Get Condition
        let condition;
        try {
            condition = await this.getEventSubTopiCondition(type);
        } catch (err) {

        }

        let cfg = this.Config.GetConfig();
        let body = {
            type,
            version: TTV_EVENTSUB_TOPICS[type].version,
            condition,
            transport: {
                method: 'webhook',
                secret: cfg['EventSub_Secret'],
                callback: 'https://' + this.WebAppInteractor.GetHostname() + '/api/TwitchAPI/EventSub/master'
            }
        };

        this.Logger.info("Requesting EventSub " + type + " " + JSON.stringify(condition));
        return this.CreateEventSubSubscription_RAW({}, body);
    }
    async updateEventSub(topic) {
        //Topic Info exists?
        if (!TTV_EVENTSUB_TOPICS[topic]) return Promise.reject(new Error('EventSub Topic not supported!'));
        
        //Requiered Scope is available?
        if (TTV_EVENTSUB_TOPICS[topic].scope) {
            let found = false;
            let current_scopes = this.GetScopes();
            let eventsub_scopes = TTV_EVENTSUB_TOPICS[topic].scope;
            if (!(eventsub_scopes instanceof Array)) eventsub_scopes = [eventsub_scopes];

            for (let scope of eventsub_scopes) {
                if (!current_scopes.find(elt => elt === scope)) found = true;
            }

            if (!found) return Promise.reject(new Error("Missing Scope."));
        }

        let cfg = this.Config.GetConfig();
        let cur_hostname = this.WebAppInteractor.GetHostname();

        //Get WebHook Status
        let webhook_status = [];
        try {
            webhook_status = (await this.GetEventSubSubscriptions({ status: 'enabled' })).data;
        } catch (err) {
            return Promise.reject(err);
        }
        
        let webhook = webhook_status.find(elt => elt.type === topic);

        if (webhook) {
            let old_host = webhook.transport.callback.substring(8, webhook.transport.callback.indexOf('/api/TwitchAPI/'));
            if (cfg['disabled_eventsub_topics'].find(elt => elt === topic) || old_host !== cur_hostname) {
                //Disabled -> remove and revoke
                let idx = -1;
                this.EventSubs.find((elt, index) => {
                    if (elt.type === topic) {
                        idx = index;
                        return true;
                    }
                    return false;
                });
                if (idx >= 0) this.EventSubs.splice(idx, 1);

                //Delete - Hostname invalid
                try {
                    await this.DeleteEventSubSubscription({ id: webhook.id });
                } catch (err) {
                    this.Logger.warn("EventSub " + webhook.type + " couldnt be removed! Error: " + err.message);
                }

                if (old_host === cur_hostname) return Promise.resolve();
            } else {
                //WebHook still valid
                return Promise.resolve(webhook);
            }
        }

        if (cur_hostname === 'localhost') return Promise.reject(new Error('not deployed'));

        //Create New - this just returns the status of your request, this does not indicate that the EventSub was created successfully!
        await this.CreateEventSubSubscription(topic).catch(err => err);
        return this.awaitWebHookSetup(topic);
    }
    async updateEventSubs(ignore_deploy = false) {
        let cfg = this.Config.GetConfig();
        let cur_hostname = this.WebAppInteractor.GetHostname();
        let new_webhooks = [];

        //Skip when not deployed
        if (!ignore_deploy) {
            if (cur_hostname === 'localhost') return Promise.reject(new Error('not deployed'));
            try {
                await this.request('http://' + cur_hostname + "/api/identify");
            } catch (err) {
                return Promise.reject(new Error('not deployed'));
            }
        }

        //Get WebHook Status
        let webhook_status = [];
        try {
            webhook_status = (await this.GetEventSubSubscriptions({ status: 'enabled' })).data;
        } catch (err) {
            return Promise.reject(err);
        }

        let current_scopes = this.GetScopes();

        //Check current
        //Get EventSubs from Twitch - check Hostname - remove from this.WebHooks - Delete when invalid or disabled
        for (let webhook of webhook_status) {

            let found = false;

            //Requiered Scope is available?
            if (TTV_EVENTSUB_TOPICS[webhook.type].scope) {
                let eventsub_scopes = TTV_EVENTSUB_TOPICS[webhook.type].scope;
                if (!(eventsub_scopes instanceof Array)) eventsub_scopes = [eventsub_scopes];

                for (let scope of eventsub_scopes) {
                    if (!current_scopes.find(elt => elt === scope)) found = true;
                }
            }
            
            let old_host = webhook.transport.callback.substring(8, webhook.transport.callback.indexOf('/api/TwitchAPI/'));
            
            //Disabled or invalid
            if (found || cfg['disabled_eventsub_topics'].find(elt => elt === webhook.type) || old_host !== cur_hostname) {
                let idx = -1;
                this.EventSubs.find((elt, index) => {
                    if (elt.type === topic) {
                        idx = index;
                        return true;
                    }
                    return false;
                });
                if (idx >= 0) this.EventSubs.splice(idx, 1);

                //Delete
                try {
                    this.Logger.warn("Removing EventSub: " + webhook.type);
                    await this.DeleteEventSubSubscription({ id: webhook.id });
                } catch (err) {
                    this.Logger.warn("EventSub " + webhook.type + " couldnt be removed! Error: " + err.message);
                }

                //Just continue
                if (old_host === cur_hostname) continue;
            } else {
                new_webhooks.push(webhook);
            }
        }

        this.EventSubs = new_webhooks;
        
        //Create missing
        //list of TTV_EVENTSUB_TOPICS without the this.WebHooks Elements
        for (let topic in TTV_EVENTSUB_TOPICS) {
            if (this.EventSubs.find(elt => elt.type === topic)) continue;
            if (cfg['disabled_eventsub_topics'].find(elt => elt === topic)) continue;
            
            //Requiered Scope is available?
            if (TTV_EVENTSUB_TOPICS[topic].scope) {
                let found = true;
                let eventsub_scopes = TTV_EVENTSUB_TOPICS[topic].scope;
                if (!(eventsub_scopes instanceof Array)) eventsub_scopes = [eventsub_scopes];

                for (let scope of eventsub_scopes) {
                    if (!current_scopes.find(elt => elt === scope)) found = false;
                }
                
                if (!found) continue;
            }

            try {
                await this.CreateEventSubSubscription(topic);
                await this.awaitWebHookSetup(topic);
            } catch (err) {
                return Promise.reject(err);
            }
        }

        return Promise.resolve(this.EventSubs);
    }

    async WEBHOOK_MASTER_CALLBACK(req, res) {
        let cfg = this.Config.GetConfig();

        let stats = {
            type: req.headers['twitch-eventsub-message-type'],
            retry: req.headers['twitch-eventsub-message-retry'],
            topic: req.headers['twitch-eventsub-subscription-type'],
            status: "failed",
            time: Date.now()
        };
        
        //Check Signature
        let original = req.headers['twitch-eventsub-message-id'] + req.headers['twitch-eventsub-message-timestamp'] + req.rawBody.toString();
        let signature = crypto.createHmac('sha256', cfg['EventSub_Secret']).update(original).digest('hex');

        //Signature Missmatch
        if ('sha256=' + signature !== req.headers['twitch-eventsub-message-signature']) {
            stats.status = "signature-missmatch";
            //Logs
            if (this.EVENTSUB_LOG) this.EVENTSUB_LOG.insert(stats);
            return res.sendStatus(403);
        }

        //Duplicate
        if (this.EventSubs_Duplicates.find(elt => elt === req.headers['twitch-eventsub-message-id'])) {
            stats.status = "duplicate";
            //Logs
            if (this.EVENTSUB_LOG) this.EVENTSUB_LOG.insert(stats);
            return res.sendStatus(200);
        }

        this.EventSubs_Duplicates.push(req.headers['twitch-eventsub-message-id']);
        stats.status = "success";

        if (req.headers['twitch-eventsub-message-type'] === 'webhook_callback_verification') {
            //Respone Challenge
            res.send(req.body.challenge);
            this.EventSubs.push(req.body.subscription);
            this.Logger.info("EventSub " + req.headers['twitch-eventsub-subscription-type'] + " created!");
        } else if (req.headers['twitch-eventsub-message-type'] === 'notification') {
            res.sendStatus(200);

            //Type specific
            for (let callback of this.EventSubs_Extern_Callback.filter(elt => elt.topic === req.body.subscription.type)) {
                callback.func(JSON.parse(JSON.stringify(req.body)));
            }

            //Resouce specific
            let startWith = req.body.subscription.type.split('.')[0];
            for (let callback of this.EventSubs_Extern_Callback.filter(elt => elt.topic === startWith + ".all")) {
                callback.func(JSON.parse(JSON.stringify(req.body)));
            }
            
            //all
            for (let callback of this.EventSubs_Extern_Callback.filter(elt => elt.topic === "all")) {
                callback.func(JSON.parse(JSON.stringify(req.body)));
            }
        } else if (req.headers['twitch-eventsub-message-type'] === 'revocation') {
            try {
                this.Logger.warn("EventSub " + req.headers['twitch-eventsub-subscription-type'] + " got revoked! Trying to create a new one!");
                await this.CreateEventSubSubscription(req.body.subscription.type, req.body.subscription.version, req.body.subscription.condition);
            } catch (err) {
                this.Logger.warn("WebHook " + webhook.type + " V" + webhook.version + " couldnt be created!");
            }
            res.sendStatus(200);
        }
        
        //Logs
        if (this.EVENTSUB_LOG) this.EVENTSUB_LOG.insert(stats);
        return Promise.resolve();
    }

    async getEventSubTopiCondition(topic) {
        if (!TTV_EVENTSUB_TOPICS[topic]) return Promise.reject(new Error('Topic not supported!'));
        let conditions = {};
        
        for (let condition of TTV_EVENTSUB_TOPICS[topic].conditions || []) {
            if (condition === 'broadcaster_user_id' || condition === 'from_broadcaster_user_id') {
                try {
                    let user = (await this.GetUsers({ login: this.TwitchIRC.getChannel().substring(1) })).data[0];
                    conditions[condition] = user.id;
                } catch (err) {
                    console.log(err);
                }
            } else if (condition === 'client_id') {
                conditions['client_id'] = this.getClientID();
            }
        }
        
        return Promise.resolve(conditions);
    }
    regenerateEventSubSecret(updateConfig = true) {
        let scrt = crypto.randomBytes(32).toString('hex');
        if (updateConfig) this.Config.UpdateSetting('EventSub_Secret', scrt);
        return scrt;
    }
    async awaitWebHookSetup(topic) {
        let cfg = this.Config.GetConfig();
        let max_tries = cfg['EventSub_max_Timeout'] || 3;

        return new Promise((resolve, reject) => {
            let tries = 1;
            let interwahl;

            interwahl = setInterval(() => {
                let wh = this.EventSubs.find(elt => elt.type === topic);
                if (wh !== undefined) {
                    clearInterval(interwahl);
                    resolve(wh);
                } else if (tries > max_tries) {
                    clearInterval(interwahl);
                    reject(new Error('timeout'));
                }

                tries++;
            }, 1000);
        });
    }

    //////////////////////////////////////////////////////////////////////
    //                  TWITCH API - NON HELIX
    //////////////////////////////////////////////////////////////////////
    
    async GetChannelViewers(channel_name) {
        let cfg = this.Config.GetConfig();
        if (this.isEnabled() !== true) return Promise.reject(new Error('TwitchAPI is disabled.'));
        if (cfg['disabled_api_endpoints'].find(elt => elt === 'Get Channel Viewers')) return Promise.reject(new Error('Endpoint is disabled.'));

        //ADD TO STATS
        this.STAT_API_CALLS++;
        this.STAT_API_CALLS_PER_10++;

        if (this.API_LOG && cfg['log_api_calls']) {
            this.API_LOG.insert({
                endpoint: 'Channel Badges',
                token: 'NONE',
                querry_params: { channel_name },
                time: Date.now()
            });
        }

        return new Promise(async (resolve, reject) => {
            let output = null;
            try {
                await this.request("http://tmi.twitch.tv/group/user/" + channel_name + "/chatters", {}, json => {
                    output = json.badge_sets;
                });
                resolve(output);
            } catch (err) {
                reject(err);
            }
        });
    }
    
    /////////////////////////////////////////////////
    //                  UTIL
    /////////////////////////////////////////////////
    
    getClientID() {
        let cfg = this.Config.GetConfig();
        return cfg.ClientID;
    }
    GetIdentifier() {
        return 'ttv_auth';
    }
    GetEndpointSettings() {
        let out = {
            Official: {},
            UnOfficial: {}
        };

        //Official
        for (let api in TTV_API_INFO) {
            out.Official[api] = {
                enabled: true,
                resource: TTV_API_INFO[api].resource || 'Unknown',
                token_type: TTV_API_INFO[api].token_type || 'Unknown',
                req_scope: TTV_API_INFO[api].req_scope || 'Unknown'
            };
        }

        //UnOfficial
        for (let api in UNNOFF_TTV_API_INFO) {
            out.UnOfficial[api] = {
                enabled: true,
                resource: UNNOFF_TTV_API_INFO[api].resource || 'Unknown',
                token_type: UNNOFF_TTV_API_INFO[api].token_type || 'Unknown'
            };
        }

        //Disabled?
        for (let api of this.Config.GetConfig()['disabled_api_endpoints']) {
            if (out.Official[api]) out.Official[api].enabled = false;
            if (out.UnOfficial[api]) out.UnOfficial[api].enabled = false;
        }

        return out;
    }
    GetEventSubSettings() {
        let out = {};
        
        for (let topic in TTV_EVENTSUB_TOPICS) {
            out[topic] = {
                name: TTV_EVENTSUB_TOPICS[topic].name,
                enabled: true,
                scope: TTV_EVENTSUB_TOPICS[topic].scope,
                version: TTV_EVENTSUB_TOPICS[topic].version,
                resource: TTV_EVENTSUB_TOPICS[topic].resource || 'Unknown'
            };
        }

        //Disabled?
        for (let topic of this.Config.GetConfig()['disabled_eventsub_topics']) {
            if (out[topic]) out[topic].enabled = false;
        }

        return out;
    }

    AddEventSubCallback(topic, source = "UNKNOWN", func) {
        if (this.EventSubs_Extern_Callback.find(elt => elt.source === source && elt.topic === topic)) return false;
        this.EventSubs_Extern_Callback.push({ source, topic, func });
        return true;
    }
    RemoveEventSubCallback(topic, source = "UNKNOWN") {
        let idx = -1;
        this.EventSubs_Extern_Callback.find((elt, index) => {
            if (elt.source === source && elt.topic === topic) {
                idx = index;
                return true;
            }
            return false;
        });
        
        if (idx >= 0) return false;
        this.EventSubs_Extern_Callback.splice(idx, 1);
        return true;
    }
    GetEventSubCallbacks(source = "UNKNOWN") {
        return this.EventSubs_Extern_Callback.filter(elt => elt.source === source);
    }
    
    GetActiveEventSubs() {
        return this.EventSubs;
    }
    GetMissingEventSubs() {
        let cfg = this.Config.GetConfig();
        return Object.getOwnPropertyNames(TTV_EVENTSUB_TOPICS).filter(elt => !cfg['disabled_eventsub_topics'].find(elt2 => elt2 === elt)).filter(elt => !this.EventSubs.find(elt2 => elt2.type === elt));
    }
    
    async request(URL, options, callback, raw) {
        return FETCH(URL, options)
            .then(async (data) => {
                for (let symbol of Object.getOwnPropertySymbols(data)) {
                    if (symbol.toString() == "Symbol(Response internals)") {

                        //HERE HEADERS - TWITCH RATELIMIT CHECK
                        //console.log(data[symbol]);
                        this.RateLimits = data[symbol];
                    }
                }

                if (raw) return data.text().then(callback);
                return data.json().then(callback);
            })
            .catch(err => {
                this.Logger.warn("TWITCH API SERVICE IS DOWN!");
                return Promise.reject(new Error('TWITCHDOWN'));
            });
    }
    trimString(str) {
        return str.split(" ").join("");
    }
}

class Authenticator extends WEBAPP.Authenticator {
    constructor(logger, parentConfigObj, TwitchAPI) {
        super("TTV Auth.", logger, parentConfigObj.GetConfig()['Authenticator']);
        
        //Config
        this.Config.AddSettingTemplates([
            { name: 'show_auth_message', type: 'boolean', default: false },
            { name: 'UserDB_File', type: 'string', default: CONSTANTS.FILESTRUCTURE.DATA_STORAGE_ROOT + "Auth/User" },
            { name: 'Userlevels', type: 'array', typeArray: 'string', default: ['viewer', 'subscriber', 'moderator', 'staff', 'admin'] },
            { name: 'Claims', type: 'array', default: ['picture', 'preferred_username'] }
        ]);

        parentConfigObj.AddChildConfig(this.Config);
        this.Config.Load();
        this.Config.FillConfig();

        //Ready
        this.addReadyRequirement(() => {
            if (!this.TwitchAPI) return false;

            if (!this.TwitchAPI.isEnabled()) return false;
            if (!this.TwitchAPI.isReady()) return false;

            if (!this.UserDatabase) return false;
            if (this.HAS_ADMIN_USER === false) return false;

            if (!this.Config.ErrorCheck()) return false;
            return true;
        });

        //Init
        this.HAS_ADMIN_USER = false;
        this.TwitchAPI = TwitchAPI;
    }

    //API
    async Init(webInt) {
        this.UserDatabase = new Datastore({ filename: path.resolve(this.Config.GetConfig()['UserDB_File'] + ".db"), autoload: true });

        //Check Admin is set
        try {
            await this.UpdateAdminCheck();
        } catch (err) {

        }

        //Add API
        this.setAPI(webInt);
        return Promise.resolve();
    }
    setAPI(webInt) {
        if (!webInt) return;
        
        //Settings API
        let router = express.Router();
        router.get('/user', async (req, res, next) => {
            let user_ids;

            if (typeof (req.query.user_id) === 'string') {
                user_ids = [req.query.user_id];
            } else if (req.query.user_id instanceof Array) {
                user_ids = req.query.user_id;
            } else {
                res.json({ err: 'IDs wrong format.' });
                return Promise.resolve();
            }

            try {
                let users = await this.GetUsers({ user_id: user_ids });
                res.json({ data: users });
            } catch (err) {
                res.json({ err: 'getting users failed.' });
            }
            return Promise.resolve();
        });
        router.post('/user', async (req, res, next) => {
            if ((!req.body.user_id && !req.body.user_name) || !req.body.user_level) {
                res.status(400).send('user id or user level not supplied.');
                return Promise.resolve();
            }

            //Userlevel Check
            if (!this.CompareUserlevels((res.locals.user || {}).user_level, req.body.user_level, true)) {
                res.status(401).send('Users with same or higher Userlevel cant be removed.');
                return Promise.resolve();
            }

            //Add User
            try {
                let new_user = await this.addUser(req.body.user_id, req.body.user_name, req.body.user_level, res.locals.user.sub, res.locals.user.preferred_username);
                res.json({ new_user: new_user });
            } catch (err) {
                res.json({ err: err.message });
            }
            return Promise.resolve();
        });
        router.delete('/user', async (req, res, next) => {
            if (!req.body.user_id) {
                res.status(400).send('user id not supplied.');
                return Promise.resolve();
            }

            //Get Userlevel
            let target_ul;
            try {
                let users = await this.GetUsers({ user_id: req.body.user_id + "" });

                if (!users || users.length == 0) {
                    res.status(404).send('User not found!');
                    return Promise.resolve();
                }

                for (let user of users) {
                    if (user.user_id === req.body.user_id + "") {
                        target_ul = user.user_level;
                    }
                }
            } catch (err) {
                res.status(500).send('Internal Error.');
                return Promise.resolve();
            }

            //Userlevel Check
            if (!this.CompareUserlevels((res.locals.user || {}).user_level, target_ul, true)) {
                res.status(401).send('Users with same or higher Userlevel cant be removed.');
                return Promise.resolve();
            }
            
            //Remove User
            try {
                let cnt = await this.removeUser(req.body.user_id, res.locals.user.sub, res.locals.user.preferred_username);
                res.json({ deleted: cnt });
            } catch (err) {
                res.json({ err: err.message });
            }
            return Promise.resolve();
        });
        router.put('/user', async (req, res, next) => {
            if (!req.body.user_id || !req.body.user_level) {
                res.status(400).send('user id or user level not supplied.');
                return Promise.resolve();
            }

            //Get Userlevel
            let target_ul;
            try {
                let users = await this.GetUsers({ user_id: req.body.user_id + "" });

                if (!users || users.length == 0) {
                    res.status(404).send('User not found!');
                    return Promise.resolve();
                }

                for (let user of users) {
                    if (user.user_id === req.body.user_id + "") {
                        target_ul = user.user_level;
                    }
                }
            } catch (err) {
                res.status(500).send('Internal Error.');
                return Promise.resolve();
            }

            //Userlevel Check
            if (!this.CompareUserlevels((res.locals.user || {}).user_level, target_ul, true)) {
                res.status(401).send('Users with same or higher Userlevel cant be editted.');
                return Promise.resolve();
            } else if (!this.CompareUserlevels((res.locals.user || {}).user_level, req.body.user_level, true)) {
                res.status(401).send('Users with same a lower Userlevel cant set higher Userlevels.');
                return Promise.resolve();
            } 

            //Edit User
            try {
                let cnt = await this.updateUser(req.body.user_id, req.body.user_name, req.body.user_level, res.locals.user.sub, res.locals.user.preferred_username);
                res.json({ upt_user: cnt });
            } catch (err) {
                console.log(err);
                res.json({ err: 'user edit failed.' });
            }
            return Promise.resolve();
        });

        router.post('/state', async (req, res) => {
            if (req.body.state !== true && req.body.state !== false) return res.status(400).json({ err: 'not a valid state'});
            this.setEnable(req.body.state === true);
            return res.json({ state: this.isEnabled() });
        });
        
        webInt.addAuthAPIRoute('/settings/TwitchAPI/ttvauth', { user_level: 'staff' }, router);

        //Login using Twitch
        webInt.addAuthAPIEndpoint('/TwitchAPI/login', { user_level: 'staff' }, 'POST', async (req, res) => {
            if (!this.isEnabled()) return res.json({ err: 'TTV Auth. is disabled.' });
            if (!this.TwitchAPI) return res.json({ err: 'Twitch API is not available.' });
            if (!this.TwitchAPI.isEnabled()) return res.json({ err: 'Twitch API is disabled.' });
            
            //Check JWT
            try {
                let user = await this.TwitchAPI.VerifyTTVJWT(req.body['id_token']);
                return res.json({ user });
            } catch (err) {
                //JWT Validation failed
                return res.json({ err: err.message });
            }

        });
        webInt.addAPIEndpoint('/TwitchAPI/login/user', 'POST', (req, res) => {
            if (!this.isEnabled()) return res.json({ err: 'TTV Auth. is disabled.' });
            if (!this.TwitchAPI) return res.json({ err: 'Twitch API is not available.' });
            if (!this.TwitchAPI.isEnabled()) return res.json({ err: 'Twitch API is disabled.' });
            
            let cfg = this.Config.GetConfig();

            return res.json({
                data: this.TwitchAPI.generateUserAccessLinkToken(req.body.scopes, req.body.claims || cfg['Claims'])
            });
        });
        webInt.addAuthAPIEndpoint('/TwitchAPI/login/bot', { user_level: 'admin' }, 'POST', (req, res) => {
            if (!this.isEnabled()) return res.json({ err: 'TTV Auth. is disabled.' });
            if (!this.TwitchAPI) return res.json({ err: 'Twitch API is not available.' });
            if (!this.TwitchAPI.isEnabled()) return res.json({ err: 'Twitch API is disabled.' });

            let claims = req.body['claims'] || this.TwitchAPI.getClaims();
            let scopes = req.body['scopes'] || this.TwitchAPI.GetScopes();

            res.send({
                data: this.TwitchAPI.generateUserAccessLinkCode(scopes, claims)
            });
        });
    }

    //Authentication - Base
    async AuthorizeRequest(headers = {}, method = {}, user) {
        //Fetch User Data
        if (!user) {
            try {
                user = await this.AuthenticateUser(headers);
            } catch (err) {
                return Promise.reject(err);
            }
        }

        //Check User and Method
        return this.AuthenticateUser(user, method);
    }
    async AuthenticateUser(headers = {}) {
        if (!this.TwitchAPI) return Promise.reject(new Error('Twitch API is not available.'));

        const header = headers['authorization'];
        const token_type = header && header.split(" ")[0];
        const token = header && header.split(" ")[1];
        
        let user;

        //Check JWT
        try {
            if (token_type === 'OAuth') {
                user = await this.TwitchAPI.OIDCUserInfoEndpoint(token);
            } else {
                user = await this.TwitchAPI.VerifyTTVJWT(token);
            }
        } catch (err) {
            //JWT Validation failed
            return Promise.reject(err);
        }
       
        //Check Database
        try {
            let db_users = await this.GetUsers({ user_id: [user.sub] });

            if (db_users.length > 0) user.user_level = db_users[0].user_level;
            else user.user_level = this.GetUserlevels()[0];
            return Promise.resolve(user);
        } catch (err) {
            //Database Error
            return Promise.reject(err);
        }
    }
    async AuthorizeUser(user = {}, method = {}) {
        let cfg = this.Config.GetConfig();

        //Check Method
        for (let meth in method) {
            try {
                if (meth === 'user_id') {
                    await this.Auth_UserID(user.sub, method[meth]);
                } else if (meth === 'user_level') {
                    await this.Auth_UserLevel(user.user_level, method[meth], method.user_level_cutoff === true);
                } else {
                    return Promise.reject(new Error('Unknown Authorization Method!'));
                }
            } catch (err) {
                return Promise.reject(err);
            }
        }

        if (cfg.show_auth_message === true)
            this.Logger.warn("Authenticated User: (" + user.sub + ") " + user.preferred_username);

        return Promise.resolve(user);
    }

    async Auth_UserID(user_id, target_id) {
        //Check UserID
        if (user_id === target_id) {
            return Promise.resolve();
        } else {
            return Promise.reject(new Error('User ID doesnt match!'));
        }
    }
    async Auth_UserLevel(user_level, target_level, cutoff) {
        //Check Userlevel
        if (!this.CompareUserlevels(user_level, target_level, cutoff)) {
            return Promise.reject(new Error("Userlevel doesnt match"));
        }

        return Promise.resolve();
    }

    //User Auth Database
    async GetUsers(params = {}) {
        if (!this.UserDatabase) return Promise.reject(new Error('User Database not available.'));
 
        let query = { $and: [] };

        //Query Parse
        for (let param in params) {
            let sub_query = {};
            if (param === 'user_id' || param === 'user_name' || param === 'user_level' || param === 'added_by') {
                if (params[param] instanceof Array) {
                    let temp = [];

                    for (let value of params[param]) {
                        temp.push({ [param]: "" + value });
                    }

                    sub_query = { $or: temp };
                } else {
                    sub_query = { [param]: "" + params[param] };
                }
            } else {
                return Promise.reject(new Error('Parameter invalid.'));
            }

            query.$and.push(sub_query);
        }
        
        //Access Database
        return new Promise((resolve, reject) => {
            this.UserDatabase.find(query, (err, docs) => {
                if (err || !docs) return reject(new Error("User Database Error."));

                let users = [];

                for (let doc of docs) {
                    users.push({
                        user_id: doc.user_id,
                        user_name: doc.user_name,
                        user_level: doc.user_level,
                        added_by: doc.added_by,
                        added_at: doc.added_at
                    });
                }

                return resolve(users);
            });
        });
    }
    async addUser(user_id, user_name, user_level, added_by_id = "UNKNOWN_ID", added_by = "UNKNOWN") {
        if (!this.UserDatabase) return Promise.reject(new Error('User Database not available.'));

        //Input Check
        if (typeof user_level !== 'string') return Promise.reject(new Error('User Level not found'));
        
        try {
            //User already asigned?
            let users = await this.GetUsers({ user_id: user_id });
            if (users.length > 0) return Promise.reject(new Error('User already asigned'));

            //Get Other information
            users = await this.fetchUserInfo([user_id], [user_name]);

            for (let user of users) {
                if (user.id == user_id || user.login == user_name || user.display_name == user_name) {
                    user_id = user.id;
                    user_name = user.login;
                    break;
                }
            }
        } catch (err) {
            return Promise.reject(err);
        }

        //Info Check
        if (!user_id || !user_name || !user_level) return Promise.reject(new Error("User Info not found"));
        if (!added_by_id) added_by_id = "UNKNOWN_ID";
        if (!added_by) added_by = "UNKNOWN";
        
        //Add User to Database
        return new Promise((resolve, reject) => {
            this.UserDatabase.insert({ user_id: user_id, user_name: user_name, user_level: user_level, added_by: added_by, added_by_id: added_by_id, added_at: Math.floor(Date.now() / 1000) }, (err, newDocs) => {
                if (err) return reject(new Error("User Database Error"));
                if (newDocs == 0) return reject(new Error("User couldnt be inserted"));

                this.Logger.warn('Added ' + user_id + '(' + user_name + ') User Authorization as ' + user_level + ' by ' + added_by_id + '(' + added_by + ')');
                if (user_level === 'admin') this.HAS_ADMIN_USER = true;

                return resolve({
                    added_at: newDocs.added_at,
                    added_by: newDocs.added_by,
                    added_by_id: newDocs.added_by_id,
                    user_id: newDocs.user_id,
                    user_level: newDocs.user_level,
                    user_name: newDocs.user_name
                });
            });
        });
    }
    async removeUser(user_id, removed_by_id, removed_by) {
        if (!this.UserDatabase) return Promise.reject(new Error('User Database not available.'));

        if (!user_id) return Promise.reject(new Error("User Info not found"));

        //Add User to Database
        return new Promise((resolve, reject) => {
            this.UserDatabase.remove({ user_id: user_id + "" }, (err, numRemoved) => {
                if (err) return reject(new Error("User Database Error"));
                if (numRemoved == 0) return reject(new Error("User couldnt be removed"));

                this.Logger.warn('Removed ' + user_id + ' User Authorization by ' + removed_by_id + '(' + removed_by + ')');
                this.UpdateAdminCheck();

                return resolve(numRemoved > 0);
            });
        });
    }
    async updateUser(user_id, user_name, user_level, changed_by_id, changed_by) {
        if (!this.UserDatabase) return Promise.reject(new Error('User Database not available.'));

        //Input Check
        if (typeof user_level !== 'string') return Promise.reject(new Error('User Level not found'));

        try {
            //Get Other information
            let users = await this.fetchUserInfo([user_id], [user_name]);

            for (let user of users) {
                if (user.id == user_id || user.login == user_name || user.display_name == user_name) {
                    user_id = user.id;
                    user_name = user.login;
                    break;
                }
            }
        } catch (err) {
            return Promise.reject(err);
        }

        //Info Check
        if (!user_id || !user_name || !user_level) return Promise.reject(new Error("User Info not found"));

        //Update User to Database
        return new Promise((resolve, reject) => {
            this.UserDatabase.update({ user_id: user_id + "" }, { user_id, user_name, user_level, added_by: changed_by, added_by_id: changed_by_id, added_at: Math.floor(Date.now() / 1000) }, (err, numReplaced) => {
                if (err) return reject(new Error("User Database Error"));
                if (numReplaced == 0) return reject(new Error("User couldnt be updated"));

                this.Logger.warn('Updated ' + user_id + '(' + user_name + ') User Authorization to ' + user_level + ' by ' + changed_by_id + '(' + changed_by + ')');

                return resolve(numReplaced > 0);
            });
        });
    }
    
    //UTIL
    GetUserlevels() {
        let cfg = this.Config.GetConfig();
        return cfg.Userlevels ? cfg.Userlevels : [];
    }
    GetUserLevelIndex(user_level) {
        let userlevel_index = -1;

        this.GetUserlevels().find((element, index) => {
            if (element === user_level) {
                userlevel_index = index;
                return true;
            }

            return false;
        });

        return userlevel_index;
    }
    CompareUserlevels(current, target, cutoff = false) {
        let target_index = this.GetUserLevelIndex(target);
        let current_index = this.GetUserLevelIndex(current);
        
        let rel_index = 0;

        if (target_index === -1) return false;

        rel_index = current_index - target_index;
        
        if (rel_index < 0) return false;
        if (cutoff === true && rel_index === 0 && current_index !== this.GetUserlevels().length-1) return false;
        
        return true;
    }
    
    async UpdateAdminCheck() {
        return this.GetUsers({ user_level: 'admin' })
            .then(users => { if (users.length > 0) this.HAS_ADMIN_USER = true; });
    }
    async fetchUserInfo(ids = [], names = []) {
        if (!this.TwitchAPI) return Promise.reject(new Error('Twitch API is not available.'));

        let query = {
            id: ids,
            login: names
        };

        if (query.id.length == 0) delete query.id;
        if (query.login.length == 0) delete query.login;
        if (!query.id && !query.login) return Promise.reject(new Error('User not supplied'));
        
        //Fetch Data
        try {
            let resp = await this.TwitchAPI.GetUsers(query);

            if (resp && resp.data && resp.data.length > 0) {
                return Promise.resolve(resp.data);
            } else {
                return Promise.reject(new Error('User not found'));
            }
        } catch (err) {
            return Promise.reject(err);
        }
    }
}

module.exports.TwitchAPI = TwitchAPI;
module.exports.Authenticator = Authenticator;