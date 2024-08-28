import { Telegraf, Markup } from 'telegraf';
import LastFmNode from 'lastfmapi';
import { fetchSpotifyAlbumArt } from './src/spotify.mjs';
import { getUserLastfmUsername } from './src/utils.mjs';
import dotenv from 'dotenv';
import moment from 'moment';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);

const lastfm = new LastFmNode({
    api_key: process.env.LASTFM_API_KEY,
    secret: process.env.LASTFM_SECRET
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

bot.command('status', async (ctx) => {
    const username = await getUserLastfmUsername(ctx.from.id);
    if (!username) {
        return ctx.reply('You need to set your Last.fm username first using /set.');
    }

    lastfm.user.getRecentTracks({ user: username, limit: 1 }, async (err, data) => {
        if (err || data.track.length === 0) {
            return ctx.reply('No recent tracks found.');
        }

        const recentTrack = data.track[0];
        const trackName = recentTrack.name;
        const artistName = recentTrack.artist['#text'];
        const albumName = recentTrack.album['#text'] || 'Unknown Album';
        const trackMbid = recentTrack.mbid;

        // Determine if the track is currently playing
        const isPlaying = recentTrack['@attr'] && recentTrack['@attr'].nowplaying === 'true';
        const status = isPlaying ? 'Playing' : 'Paused';

        lastfm.track.getInfo({
            artist: artistName,
            track: trackName,
            username: username,
            mbid: trackMbid
        }, async (err, trackInfo) => {
            if (err || !trackInfo) {
                return ctx.reply('Could not fetch track info.');
            }

            const playCount = trackInfo.userplaycount || 'N/A';
            const lastPlayed = recentTrack.date ? 
                moment.unix(recentTrack.date.uts).format('DD/MM/YYYY HH:mm:ss') : 
                moment().format('DD/MM/YYYY HH:mm:ss');  // Use current time for now playing

            const albumArt = await fetchSpotifyAlbumArt(albumName);
            const songLinkId = trackInfo.mbid || trackInfo.url.split('/').pop();

            const response = `<b>${ctx.from.first_name} ${ctx.from.last_name ? ctx.from.last_name : ''} is Listening to:</b>\n\n` +
                `<b>Song:</b> ${trackName}\n` +
                `<b>Artist:</b> ${artistName}\n` +
                `<b>Album:</b> ${albumName}\n` +
                `<b>Play Count:</b> ${playCount}\n` +
                `<b>Status:</b> ${status}\n` +
                `<b>Last Played:</b> ${lastPlayed}`;

            const buttons = Markup.inlineKeyboard([
                Markup.button.url('Made by AquaMods', 'https://akuamods.t.me')
            ]);

            if (albumArt.includes('http')) {
                ctx.replyWithPhoto({ url: albumArt }, { caption: response, parse_mode: 'HTML', ...buttons });
            } else {
                const imagePath = path.join(__dirname, albumArt);
                ctx.replyWithPhoto({ source: imagePath }, { caption: response, parse_mode: 'HTML', ...buttons });
            }
        });
    });
});

bot.launch();
console.log('Bot is running...');
