import { Telegraf, Markup } from 'telegraf';
import LastFmNode from 'lastfmapi';
import { fetchSpotifyAlbumArt } from './src/spotify.mjs';
import { getUserLastfmUsername, setUserLastfmUsername, unsetUserLastfmUsername } from './src/utils.mjs';
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
        const lastPlayed = track.date ? moment.unix(track.date.uts).format('LLL') : 'Now Playing';
        const albumArt = await fetchSpotifyAlbumArt(track.album['#text']);

        const response = `${ctx.from.first_name} ${ctx.from.last_name ? ctx.from.last_name : ''} is listening to:\n\n` +
            `**Song:** ${track.name}\n` +
            `**Artist:** ${track.artist['#text']}\n` +
            `**Album:** ${track.album['#text']}\n`

        const buttons = Markup.inlineKeyboard([
            Markup.button.url('Listen Now', track.url),
            Markup.button.url('About Artist', `https://www.google.com/search?q=${encodeURIComponent(track.artist['#text'] + ' artist bio')}`)
        ],
        [
            Markup.button.url('Made by AquaMods', 'https://akuamods.t.me')
        ]);

        if (albumArt.includes('http')) {  // If album art is a URL
            ctx.replyWithPhoto({ url: albumArt }, { caption: response, ...buttons });
        } else {  // If album art is the fallback default.png
            const imagePath = path.join(__dirname, albumArt);
            ctx.replyWithPhoto({ source: imagePath }, { caption: response, ...buttons });
        }
    });
});

bot.launch();
console.log('Bot is running...');
