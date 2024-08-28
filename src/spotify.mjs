import fetch from 'node-fetch';
import { Buffer } from 'buffer';

let token;

async function getSpotifyToken(clientId, clientSecret) {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
        },
        body: 'grant_type=client_credentials'
    });

    const data = await response.json();
    token = data.access_token;
}

export async function fetchSpotifyAlbumArt(albumName) {
    if (!token) {
        await getSpotifyToken(process.env.SPOTIFY_CLIENT_ID, process.env.SPOTIFY_CLIENT_SECRET);
    }

    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(albumName)}&type=album`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const data = await response.json();

    // Check if data.albums and data.albums.items exist before accessing
    if (data.albums && data.albums.items.length > 0) {
        return data.albums.items[0].images[0].url;
    } else {
        // Return the path to the default image if no album art is found
        return '/assets/default.png';
    }
}
