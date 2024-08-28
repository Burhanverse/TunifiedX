import { Telegraf, Markup } from 'telegraf';
import LastFmNode from 'lastfmapi';
import { fetchSpotifyAlbumArt } from './src/spotify.mjs';
import { fetchYoutubeThumbnail } from './src/youtube.mjs';
import { getUserLastfmUsername, setUserLastfmUsername, unsetUserLastfmUsername } from './src/utils.mjs';
import dotenv from 'dotenv';
import moment from 'moment';

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);

const lastfm = new LastFmNode({
    api_key: process.env.LASTFM_API_KEY,
    secret: process.env.LASTFM_SECRET
});

let lastListenedTime = null;

bot.command('set', async (ctx) => {
    const username = ctx.message.text.split(' ')[1];
    if (!username) {
        return ctx.reply('Please provide a Last.fm username.');
    }
    await setUserLastfmUsername(ctx.from.id, username);
    ctx.reply(`Username set to ${username}`);
});

bot.command('unset', async (ctx) => {
    await unsetUserLastfmUsername(ctx.from.id);
    ctx.reply('Username unlinked.');
});

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
        const albumArt = await fetchSpotifyAlbumArt(track.album['#text']) || await fetchYoutubeThumbnail(track.url.split('/').pop());

        const response = `${ctx.from.first_name} is listening to:\n\n` +
            `**Song:** ${track.name}\n` +
            `**Artist:** ${track.artist['#text']}\n` +
            `**Album:** ${track.album['#text']}\n` +
            `**Last Listened:** ${lastListenedTime}`;

        const buttons = Markup.inlineKeyboard([
            Markup.button.url('Listen Now', track.url),
            Markup.button.url('About Artist', `https://www.google.com/search?q=${encodeURIComponent(track.artist['#text'] + ' artist bio')}`),
            Markup.button.url('Share Track', track.url)
        ]);

        if (albumArt) {
            ctx.replyWithPhoto({ url: albumArt }, { caption: response, ...buttons });
        } else {
            ctx.reply(response, buttons);
        }
    });
});

bot.command('flex', async (ctx) => {
    const username = await getUserLastfmUsername(ctx.from.id);
    if (!username) {
        return ctx.reply('You need to set your Last.fm username first using /set.');
    }

    lastfm.user.getTopArtists({ user: username, limit: 1 }, (err, artistData) => {
        if (err) return ctx.reply('Error fetching top artists.');
        lastfm.user.getTopTracks({ user: username, limit: 1 }, (err, trackData) => {
            if (err) return ctx.reply('Error fetching top tracks.');

            const topArtist = artistData.artist[0].name;
            const topTrack = trackData.track[0].name;
            ctx.reply(`${ctx.from.first_name} flexing:\n\nTop Artist: ${topArtist}\nTop Track: ${topTrack}`);
        });
    });
});

bot.launch();
console.log('Bot is running...');
