const express = require('express');
const crypto = require('crypto');
const filesys = require('fs');
const path = require('path');
const app = express();
const router = express.Router();
const databankPath = path.join(__dirname, '../Databank/users.json');

app.use(express.json());

// Generate RSA key pair
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
});

let aesKeys = new Map();
const AES_KEY_EXPIRATION_TIME = 10 * 60 * 1000; // 10 minutes

// Function to encrypt text using RSA public key
const encryptRSA = (text) => {
    const buffer = Buffer.from(text, 'utf8');
    const encrypted = crypto.publicEncrypt({
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
    }, buffer);
    return encrypted.toString('hex');
}

// Function to decrypt text using RSA private key
const decryptRSA = (encryptedText) => {
    const buffer = Buffer.from(encryptedText, 'hex');
    const decrypted = crypto.privateDecrypt({
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
    }, buffer);
    return decrypted.toString('utf8');
}

// Function to generate an AES key
const generateAESKey = () => {
    return crypto.randomBytes(32).toString('hex'); // 256-bit key
}

// Middleware to decrypt incoming RSA data
const decryptMiddleware = (req, res, next) => {
    if (req.method === 'POST' || req.method === 'GET') {
        if (req.body.data) {
            req.body.data = decryptRSA(req.body.data);
        }
    }
    next();
}

// Function to encrypt data using AES
const encryptAES = (text, aesKey) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(aesKey, 'hex'), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

// Function to decrypt data using AES
const decryptAES = (encryptedText, aesKey) => {
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedTextBuffer = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(aesKey, 'hex'), iv);
    let decrypted = decipher.update(encryptedTextBuffer, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

// Middleware to handle AES decryption
const aesDecryptMiddleware = (req, res, next) => {
    const { uniqueID, data } = req.body;
    const aesKey = aesKeys.get(uniqueID);
    if (!aesKey) {
        return res.status(401).send('Session expired');
    }
    req.body.data = decryptAES(data, aesKey);
    next();
}

router.use('/add-User', decryptMiddleware, aesDecryptMiddleware);
router.use('/find-User', decryptMiddleware, aesDecryptMiddleware);
router.use('/delete-User', decryptMiddleware, aesDecryptMiddleware);

// Route to add a new user
router.post("/add-User", (req, res) => {
    let { name, privileges, password } = JSON.parse(req.body.data);
    let newUser = {
        name,
        createTime: new Date(),
        privileges: privileges || 'default',
        password: password || ''
    };

    users = insertSorted(users, newUser);
    saveUsersToFile(users, databankPath);
    res.send("User added");
});

// Route to get all users without privileges
router.get("/", (req, res) => {
    const usersWithoutPrivileges = users.map(user => ({
        name: user.name,
        createTime: user.createTime
    }));
    res.json({ users: usersWithoutPrivileges });
});

// Route to find a user
router.post("/find-User", (req, res) => {
    if (users.length === 0) {
        res.send("User not found");
        return;
    }

    let { user } = JSON.parse(req.body.data);
    let index = findInsertionIndex(users, user);
    res.send(users[index]);
});

// Route to delete a user
router.post("/delete-User", (req, res) => {
    let { user } = JSON.parse(req.body.data);
    user.createTime = new Date(user.createTime);
    let index = findInsertionIndex(users, user.name);
    let sendString = "";

    if (users[index].name === user.name && users[index].createTime.getTime() === user.createTime.getTime()) {
        users.splice(index, 1);
        sendString = `User: "${user.name}" Deleted`;
        saveUsersToFile(users, databankPath);
    } else {
        sendString = "User not found";
    }
    res.send(sendString);
});

// Route to get the public key
router.get("/public-key", (req, res) => {
    res.send(publicKey.export({ type: 'pkcs1', format: 'pem' }));
});

// Route to authenticate and provide AES key and unique ID
router.post("/authenticate", (req, res) => {
    let { username, password } = JSON.parse(req.body.data);

    // Perform authentication (add your logic)
    let authenticated = true;

    if (authenticated) {
        let aesKey = generateAESKey();
        let uniqueID = crypto.randomBytes(16).toString('hex');
        aesKeys.set(uniqueID, aesKey);

        // Set a timeout to remove the AES key after expiration time
        setTimeout(() => {
            aesKeys.delete(uniqueID);
        }, AES_KEY_EXPIRATION_TIME);

        res.json({ aesKey, uniqueID });
    } else {
        res.status(401).send("Authentication failed");
    }
});

// Load users from the databank
let users = loadUsersFromFile(databankPath);

app.use('/api', router);
app.listen(3000, () => {
    console.log("Server is running on port 3000");
});

// Function to insert a user into a sorted array
function insertSorted(sortedArray, newElement) {
    const insertionIndex = findInsertionIndex(sortedArray, newElement.name);
    sortedArray.splice(insertionIndex, 0, newElement);
    return sortedArray;
}

// Function to find the insertion index for a new user
function findInsertionIndex(sortedArray, name) {
    let low = 0, high = sortedArray.length;
    while (low < high) {
        const mid = (low + high) >>> 1;
        if (sortedArray[mid].name < name) low = mid + 1;
        else high = mid;
    }
    return low;
}

// Function to load users from a file
const loadUsersFromFile = (filePath) => {
    if (filesys.existsSync(filePath)) {
        const data = filesys.readFileSync(filePath, 'utf-8');
        const users = JSON.parse(data);
        users.forEach(user => {
            user.createTime = new Date(user.createTime);
        });
        return users;
    } else {
        filesys.writeFileSync(filePath, JSON.stringify([]), 'utf-8');
        return [];
    }
};

// Function to save users to a file
const saveUsersToFile = (users, filePath) => {
    filesys.writeFileSync(filePath, JSON.stringify(users), 'utf-8');
};
