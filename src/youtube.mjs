import ytdl from '@distube/ytdl-core';
import dotenv from 'dotenv';

dotenv.config();

export async function getYouTubeAlbumArt(artist, track) {
    const searchString = `${artist} ${track}`;
    try {
        const videoInfo = await ytdl.getInfo(`ytsearch1:${searchString}`);
        const videoDetails = videoInfo.videoDetails;

        return {
            albumArtUrl: videoDetails.thumbnails[0].url
        };

    } catch (error) {
        console.error('YouTube Music API error:', error);
        return null;
    }
}
