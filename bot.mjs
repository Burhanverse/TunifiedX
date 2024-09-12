import { Telegraf, Markup } from 'telegraf';
import { fetchSpotifyAlbumArt } from './src/spotify.mjs';
import { getYouTubeAlbumArt } from './src/youtube.mjs';
import { getUserLastfmUsername, setUserLastfmUsername, unsetUserLastfmUsername } from './src/utils.mjs';
import dotenv from 'dotenv';
import moment from 'moment';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);

const LASTFM_API_URL = 'http://ws.audioscrobbler.com/2.0/';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const userCooldowns = new Map();
const userTrackNotFoundErrors = new Map();

// Utility function to fetch data from Last.fm API
async function fetchFromLastFm(method, params) {
    const url = new URL(LASTFM_API_URL);
    url.searchParams.append('api_key', process.env.LASTFM_API_KEY);
    url.searchParams.append('format', 'json');
    url.searchParams.append('method', method);
    for (const key in params) {
        url.searchParams.append(key, params[key]);
    }

    const response = await fetch(url);
    const data = await response.json();
    return data;
}

bot.command('set', async (ctx) => {
    const username = ctx.message.text.split(' ')[1];
    if (!username) {
        return ctx.reply('Please provide a Last.fm username like /set <username>.');
    }
    await setUserLastfmUsername(ctx.from.id, username);
    ctx.reply(`Username set to ${username}`);
});

bot.command('unset', async (ctx) => {
    const username = await getUserLastfmUsername(ctx.from.id);
    if (!username) {
        return ctx.reply('No username found to unlink. Use /set <username> first.');
    }
    await unsetUserLastfmUsername(ctx.from.id);
    ctx.reply('Username unlinked.');
});

bot.command('status', async (ctx) => {
    const userId = ctx.from.id;

    // Rate limiting
    const now = Date.now();
    const cooldown = userCooldowns.get(userId);
    if (cooldown && now < cooldown) {
        const timeLeft = ((cooldown - now) / 1000).toFixed(1);
        return ctx.reply(`Please wait ${timeLeft} seconds before using the command again.`, { reply_to_message_id: ctx.message.message_id });
    }
    userCooldowns.set(userId, now + 10000); // 10-second cooldown

    try {
        const username = await getUserLastfmUsername(userId);
        if (!username) {
            return ctx.reply('You need to set your Last.fm username first using /set.', { reply_to_message_id: ctx.message.message_id });
        }

        // Fetch recent track data
        const recentTrackData = await fetchFromLastFm('user.getRecentTracks', { user: username, limit: 1 });
        const recentTrack = recentTrackData.recenttracks.track[0];

        if (!recentTrack) {
            return ctx.reply('No recent tracks found.', { reply_to_message_id: ctx.message.message_id });
        }

        const trackName = recentTrack.name;
        const artistName = recentTrack.artist['#text'];
        const albumName = recentTrack.album['#text'] || 'Unknown Album';
        const isPlaying = recentTrack['@attr'] && recentTrack['@attr'].nowplaying === 'true';
        const status = isPlaying ? 'Playing' : 'Paused';

        // Fetch track info
        const trackInfoData = await fetchFromLastFm('track.getInfo', { artist: artistName, track: trackName, username });
        const trackInfo = trackInfoData.track;
        const playCount = trackInfo?.userplaycount || 'N/A';
        const lastPlayed = recentTrack.date ?
            moment.unix(recentTrack.date.uts).format('DD/MM/YYYY HH:mm:ss') :
            moment().format('DD/MM/YYYY HH:mm:ss');

        // Fetch album art from Spotify first, then YouTube (no fallback to default)
        let albumArt;
        try {
            albumArt = await fetchSpotifyAlbumArt(albumName);
        } catch (spotifyError) {
            console.error('Spotify album art error:', spotifyError);
        }

        if (!albumArt || !albumArt.includes('http')) {
            try {
                const youtubeAlbumArt = await getYouTubeAlbumArt(artistName, trackName);
                albumArt = youtubeAlbumArt;
            } catch (youtubeError) {
                console.error('YouTube album art error:', youtubeError);
            }
        }

        // Create response with track details
        const response = `<b>${ctx.from.first_name} ${ctx.from.last_name || ''} is Listening to:</b>\n\n` +
            `<b>Song:</b> ${trackName}\n` +
            `<b>Artist:</b> ${artistName}\n` +
            `<b>Album:</b> ${albumName}\n` +
            `<b>Play Count:</b> ${playCount}\n` +
            `<b>Status:</b> ${status}\n` +
            `<b>Last Played:</b> ${lastPlayed}`;

        const buttons = Markup.inlineKeyboard([
            Markup.button.url('Made by AquaMods', 'https://akuamods.t.me')
        ]);

        // Send track details without image if no album art was found
        if (albumArt && albumArt.includes('http')) {
            await ctx.replyWithPhoto(albumArt, {
                caption: response,
                parse_mode: 'HTML',
                ...buttons,
                reply_to_message_id: ctx.message.message_id // Reply to the user's command
            });
        } else {
            await ctx.replyWithHTML(response, {
                reply_markup: buttons,
                reply_to_message_id: ctx.message.message_id // Reply to the user's command
            });
        }

    } catch (error) {
        console.error('Error processing status command:', error);
        ctx.reply('An error occurred while processing your request.', { reply_to_message_id: ctx.message.message_id });
    }
});

bot.launch();
console.log('Bot is running...');
