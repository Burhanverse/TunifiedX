import ytdl from '@distube/ytdl-core';

export async function fetchYoutubeThumbnail(videoId) {
    try {
        const info = await ytdl.getInfo(videoId);
        return info.videoDetails.thumbnails.pop().url;
    } catch (error) {
        console.error('Error fetching YouTube thumbnail:', error);
        return null;
    }
}
