const express = require('express');
const levenshtein = require("fast-levenshtein");
const router = express.Router();
const filesys = require('fs');
const path = require('path');
const crypto = require('crypto');
const databankPath = path.join(__dirname, '../Databank/users.json');

// Generate RSA key pair
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
});

// Function to encrypt text using RSA public key
const encrypt = (text) => {
    const buffer = Buffer.from(text, 'utf8');
    const encrypted = crypto.publicEncrypt({
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
    }, buffer);
    return encrypted.toString('hex');
}

// Function to decrypt text using RSA private key
const decrypt = (encryptedText) => {
    const buffer = Buffer.from(encryptedText, 'hex');
    const decrypted = crypto.privateDecrypt({
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
    }, buffer);
    return decrypted.toString('utf8');
}

// Middleware to decrypt incoming data
const decryptMiddleware = (req, res, next) => {
    if (req.method === 'POST' || req.method === 'GET') {
        if (req.body.data) {
            req.body.data = decrypt(req.body.data);
        }
    }
    next();
}

const stringTest = "my name is jeff";
const encryptedString = encrypt(stringTest);
console.log(encryptedString);
console.log(decrypt(encryptedString));

// Apply decrypt middleware to specific routes
router.use('/add-User', decryptMiddleware);
router.use('/find-User', decryptMiddleware);
router.use('/delete-User', decryptMiddleware);
router.use('/', decryptMiddleware);

// Route to add a new user
router.post("/add-User", (req, res) => {
    let str = req.body.name;

    let newUser = {
        name: str,
        createTime: new Date(),
        privileges: req.body.privileges || 'default',
        password: req.body.password || ''
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

    let index = findInsertionIndex(users, req.body.user);
    console.log(index);
    console.log(users[index]);
    console.log(req.body.user);
    res.send(users[index]); // A users[index].name can deviate from a req.body.user. This behavior is wanted.
});

// Route to delete a user
router.post("/delete-User", (req, res) => {
    let sendString = "";
    console.log(req.body.user);
    req.body.user.createTime = new Date(req.body.user.createTime);
    console.log(req.body.user.createTime);
    let index = findInsertionIndex(users, req.body.user.name);
    if (
        users[index].name === req.body.user.name &&
        users[index].createTime.getTime() === req.body.user.createTime.getTime()
    ) {
        users.splice(index, 1);
        sendString = `User: "${req.body.user.name}" Deleted`;
        saveUsersToFile(users, databankPath);
    } else {
        sendString = "User aren't equal";
    }
    res.send(sendString);
});

// Route to get the public key
router.get("/public-key", (req, res) => {
    res.send(publicKey.export({ type: 'pkcs1', format: 'pem' }));
});

module.exports = router;

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

// Load users from the databank
let users = loadUsersFromFile(databankPath);


//chat gpt may know about decryption and encryption
