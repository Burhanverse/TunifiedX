import SpotifyWebApi from 'spotify-web-api-node';
import dotenv from 'dotenv';

dotenv.config();

// Initialize the Spotify API client
const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

async function getSpotifyToken() {
    try {
        const data = await spotifyApi.clientCredentialsGrant();
        spotifyApi.setAccessToken(data.body['access_token']);
    } catch (error) {
        console.error('Error getting Spotify token:', error);
        throw error;
    }
}

export async function fetchSpotifyAlbumArt(artistName, trackName) {
    // Ensure we have a valid token
    if (!spotifyApi.getAccessToken()) {
        await getSpotifyToken();
    }

    try {
        const response = await spotifyApi.searchTracks(`track:${trackName} artist:${artistName}`);
        const tracks = response.body.tracks.items;

        if (tracks.length > 0) {
            const track = tracks[0];
            if (track.album && track.album.images.length > 0) {
                return track.album.images[0].url;
            }
        }
    } catch (error) {
        console.error('Error fetching album art from Spotify:', error);
    }
}