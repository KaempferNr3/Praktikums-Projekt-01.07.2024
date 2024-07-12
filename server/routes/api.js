const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(bodyParser.json());

const databankPath = path.join(__dirname, 'users.json');
const aesKeyStore = new Map();

// Generate RSA key pair
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
});

// Function to encrypt text using RSA public key
const encryptRSA = (text, key) => {
    const buffer = Buffer.from(text, 'utf8');
    const encrypted = crypto.publicEncrypt({
        key: key,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
    }, buffer);
    return encrypted.toString('hex');
};

// Function to decrypt text using RSA private key
const decryptRSA = (encryptedText, key) => {
    const buffer = Buffer.from(encryptedText, 'hex');
    const decrypted = crypto.privateDecrypt({
        key: key,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
    }, buffer);
    return decrypted.toString('utf8');
};

// Function to generate AES key
const generateAESKey = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Middleware to decrypt incoming RSA encrypted data
const decryptMiddleware = (req, res, next) => {
    if (req.method === 'POST' || req.method === 'GET') {
        if (req.body.data) {
            try {
                const decryptedData = decryptRSA(req.body.data, privateKey);
                req.body = JSON.parse(decryptedData);
            } catch (err) {
                return res.status(400).send('Invalid encrypted data');
            }
        }
    }
    next();
};

app.use(decryptMiddleware);

// Route to get the public key
app.get('/public-key', (req, res) => {
    res.send(publicKey.export({ type: 'pkcs1', format: 'pem' }));
});

// Route for client login
app.post('/login', (req, res) => {
    const { username, password, clientPublicKey } = req.body;

    // Validate user credentials
    const users = loadUsersFromFile(databankPath);
    const user = users.find(u => u.name === username && u.password === password);

    if (!user) {
        return res.status(401).send('Invalid username or password');
    }

    const aesKey = generateAESKey();
    const uniqueID = crypto.randomUUID();

    aesKeyStore.set(uniqueID, {
        key: aesKey,
        expiry: Date.now() + 10 * 60 * 1000 // 10 minutes from now
    });

    const encryptedAESKey = encryptRSA(aesKey, clientPublicKey);

    res.json({ aesKey: encryptedAESKey, uniqueID });
});

// Middleware to handle AES decryption based on unique ID
const aesDecryptMiddleware = (req, res, next) => {
    const { uniqueID, encryptedData } = req.body;

    const stored = aesKeyStore.get(uniqueID);
    if (!stored || stored.expiry < Date.now()) {
        return res.status(401).send('Session expired');
    }

    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(stored.key, 'hex'), Buffer.from(encryptedData.iv, 'hex'));
    let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    req.body = JSON.parse(decrypted);
    req.body.uniqueID = uniqueID;
    next();
};

app.use('/secure', aesDecryptMiddleware);

// Secure route example
app.post('/secure/data', (req, res) => {
    // Process secured data
    res.send('Data processed securely');
});

// Route to add a new user
app.post("/add-User", (req, res) => {
    let newUser = {
        name: req.body.name,
        createTime: new Date(),
        privileges: req.body.privileges || 'default',
        password: req.body.password || ''
    };

    let users = loadUsersFromFile(databankPath);
    users = insertSorted(users, newUser);
    saveUsersToFile(users, databankPath);
    res.send("User added");
});

// Route to get all users without privileges
app.get("/", (req, res) => {
    const users = loadUsersFromFile(databankPath);
    const usersWithoutPrivileges = users.map(user => ({
        name: user.name,
        createTime: user.createTime
    }));
    res.json({ users: usersWithoutPrivileges });
});

// Route to find a user
app.post("/find-User", (req, res) => {
    const users = loadUsersFromFile(databankPath);
    if (users.length === 0) {
        res.send("User not found");
        return;
    }

    let index = findInsertionIndex(users, req.body.user);
    res.send(users[index]);
});

// Route to delete a user
app.post("/delete-User", (req, res) => {
    const users = loadUsersFromFile(databankPath);
    let index = findInsertionIndex(users, req.body.user.name);

    if (
        users[index].name === req.body.user.name &&
        new Date(users[index].createTime).getTime() === new Date(req.body.user.createTime).getTime()
    ) {
        users.splice(index, 1);
        saveUsersToFile(users, databankPath);
        res.send(`User: "${req.body.user.name}" Deleted`);
    } else {
        res.send("User aren't equal");
    }
});

// Utility functions
const loadUsersFromFile = (filePath) => {
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8');
        const users = JSON.parse(data);
        users.forEach(user => {
            user.createTime = new Date(user.createTime);
        });
        return users;
    } else {
        fs.writeFileSync(filePath, JSON.stringify([]), 'utf-8');
        return [];
    }
};

const saveUsersToFile = (users, filePath) => {
    fs.writeFileSync(filePath, JSON.stringify(users), 'utf-8');
};

// Function to insert a user into a sorted array
const insertSorted = (sortedArray, newElement) => {
    const insertionIndex = findInsertionIndex(sortedArray, newElement.name);
    sortedArray.splice(insertionIndex, 0, newElement);
    return sortedArray;
};

// Function to find the insertion index for a new user
const findInsertionIndex = (sortedArray, name) => {
    let low = 0, high = sortedArray.length;
    while (low < high) {
        const mid = (low + high) >>> 1;
        if (sortedArray[mid].name < name) low = mid + 1;
        else high = mid;
    }
    return low;
};

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
