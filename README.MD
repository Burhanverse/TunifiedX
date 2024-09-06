<div align="center">
  <img src="https://github.com/Burhanverse/assets/blob/main/TunifiedX.png" width="260" height="260">
</div>
<h1 align="center">TunifiedX (Inspired by <a href="https://github.com/kawaiiDango/lastfmrobot">lastfmrobot</a>)
</h1> 
### Prerequisites & Setup:

- Node.js v20+ installed.
- Telegram Bot API token.
- Last.FM client installed in your phone for scrobbling tracks (it is recommanded to use pano scrobbler if you are on Android).
- Last.fm API key, Shared secret.
- Spotify Client ID & Client Secret.

1\. Download and install [Node.js](https://nodejs.org/en/download/).

2\. Clone the repository:
```bash
    git clone https://github.com/Burhanverse/TunifiedX.git
    cd TunifiedX
```
3\. Install dependencies:
```bash
    npm install
```
4\. Create a `.env` file in the root directory with the environment variables as in `.env.example`.

5\.Start the bot:
```bash
    npm start
```
- Updates to latest source from github, clean installs module as speciefied in package-lock.json and then starts the bot.

OR for normal startup of the bot,
```bash
    node bot.mjs
```
