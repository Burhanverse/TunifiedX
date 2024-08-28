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

        const track = data.track[0];
        const trackName = track.name;
        const artistName = track.artist['#text'];
        const albumName = track.album['#text'] || 'Unknown Album';
        const playCount = track.playcount || 'N/A';

        // Check if the track is currently playing
        const lastPlayed = track.date ? 
            moment.unix(track.date.uts).format('DD/MM/YYYY HH:mm:ss') : 
            moment().format('DD/MM/YYYY HH:mm:ss');  // Use current time for now playing

        const albumArt = await fetchSpotifyAlbumArt(albumName);
        const songLinkId = track.mbid || track.url.split('/').pop();

        const response = `<b>${ctx.from.first_name} ${ctx.from.last_name ? ctx.from.last_name : ''} is Listening to:</b>\n\n` +
            `<b>Song:</b> ${trackName}\n` +
            `<b>Artist:</b> ${artistName}\n` +
            `<b>Album:</b> ${albumName}\n` +
            `<b>Play Count:</b> ${playCount}\n` +
            `<b>Last Played:</b> ${lastPlayed}`;

        const buttons = Markup.inlineKeyboard([
            Markup.button.url('Listen Now', `https://song.link/s/${songLinkId}`),
            Markup.button.url(`About ${artistName.split(",")[0]}`, `https://www.google.com/search?q=${encodeURIComponent(artistName + ' artist bio')}`)
        ], [
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

bot.launch();
console.log('Bot is running...');
