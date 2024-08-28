import { promises as fs } from 'fs';

const USERS_FILE = './users.json';

async function readUsers() {
    try {
        const data = await fs.readFile(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading users file:', error);
        return {};
    }
}

async function writeUsers(users) {
    try {
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
    } catch (error) {
        console.error('Error writing users file:', error);
    }
}

export async function getUserLastfmUsername(userId) {
    const users = await readUsers();
    return users[userId] || null;
}

export async function setUserLastfmUsername(userId, username) {
    const users = await readUsers();
    users[userId] = username;
    await writeUsers(users);
}

export async function unsetUserLastfmUsername(userId) {
    const users = await readUsers();
    delete users[userId];
    await writeUsers(users);
}
