import ytdl from '@distube/ytdl-core';
import dotenv from 'dotenv';

dotenv.config();

export async function getYouTubeAlbumArt(artist, track) {
    const searchString = `${artist} ${track}`;
    try {
        // Search on YouTube for the track
        const videoInfo = await ytdl.getInfo(`ytsearch1:${searchString}`);
        const videoDetails = videoInfo.videoDetails;

        if (videoDetails && videoDetails.thumbnails && videoDetails.thumbnails.length > 0) {
            // Return the highest resolution thumbnail available
            return videoDetails.thumbnails[videoDetails.thumbnails.length - 1].url;
        }

        return null;
    } catch (error) {
        console.error('YouTube Music API error:', error);
        return null;
    }
}
