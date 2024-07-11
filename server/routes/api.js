const express = require('express');
const levenshtein = require("fast-levenshtein");
const router = express.Router();
const filesys = require('fs');
const path = require('path');
const databankPath = path.join(__dirname, '../Databank/users.json');
const NodeRSA = require('node-rsa');
const crypto = require('crypto');

const loadAndValidateRSAKeys = (filePath) => {
    if (filesys.existsSync(filePath)) {
        const data = filesys.readFileSync(filePath, 'utf-8');
        const json = JSON.parse(data);
        if (json.rsaKeys && json.rsaKeys.publicKey && json.rsaKeys.privateKey) {
            const testKey = new NodeRSA();
            try {
                testKey.importKey(json.rsaKeys.publicKey, 'public');
                testKey.importKey(json.rsaKeys.privateKey, 'private');
                return json.rsaKeys;
            } catch (error) {
                console.log('Invalid RSA keys found, generating new ones.');
            }
        }
    }


    const newKeys = generateRSAKeys();
    saveRSAKeys(filePath, newKeys);
    return newKeys;
};
    


const saveRSAKeys = (filePath, rsaKeys) => {
    if (filesys.existsSync(filePath)) {
        const data = filesys.readFileSync(filePath, 'utf-8');
        const json = JSON.parse(data);
        json.rsaKeys = rsaKeys;
        filesys.writeFileSync(filePath, JSON.stringify(json), 'utf-8');
    } else {
        const json = { rsaKeys, users: [] };
        filesys.writeFileSync(filePath, JSON.stringify(json), 'utf-8');
    }

};
    
const generateRSAKeys = () => {
    const key = new NodeRSA({ b: 1024 });
    const publicKey = key.exportKey('public');
    const privateKey = key.exportKey('private');
    return { publicKey, privateKey };
};
    
    const rsaKeys = loadAndValidateRSAKeys(databankPath);
    
function decrypt(text, encryptedAESKey) {
    // Decrypt the AES key using the RSA private key
    const decryptedAESKey = new NodeRSA(rsaKeys.privateKey).decrypt(encryptedAESKey, 'utf8');
    
    // Decrypt the text using the decrypted AES key
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(decryptedAESKey, 'hex'), Buffer.from('your-iv', 'hex'));
    let decrypted = decipher.update(text, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
    
const decryptMiddleware = (req, res, next) => {
    if (req.body.encryptedData && req.body.encryptedAESKey) {
        try {
            const decryptedData = decrypt(req.body.encryptedData, req.body.encryptedAESKey);
            req.body = JSON.parse(decryptedData);
        } catch (error) {
            return res.status(400).send('Invalid encrypted data');
        }
    }
    next();
};



router.use('/add-User', decryptMiddleware);
router.use('/find-User', decryptMiddleware);
router.use('/delete-User', decryptMiddleware);
router.use('/', decryptMiddleware);

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

router.get("/", (req, res) => {
    const usersWithoutPrivileges = users.map(user => ({
        name: user.name,
        createTime: user.createTime
    }));
    res.json({ users: usersWithoutPrivileges });
});

router.post("/find-User", (req, res) => {
    if (users.length === 0) {
        res.send("User not found");
        return;
    }

    let index = findInsertionIndex(users, req.body.user);
    console.log(index)
    console.log(users[index])
    console.log(req.body.user)
    res.send(users[index]); // A users[index].name can deviate from a req.body.user. This behavior is wanted. 
});

router.post("/delete-User", (req, res) => {
    let sendString = "";
    console.log(req.body.user)
    req.body.user.createTime = new Date(req.body.user.createTime);
    console.log(req.body.user.createTime)
    let index = findInsertionIndex(users, req.body.user.name);
    if (
        users[index].name === req.body.user.name &&
        users[index].createTime.getTime() === req.body.user.createTime.getTime()
    ) {
        users.splice(index, 1);
        sendString = "User: \"" + req.body.user.name + "\" Deleted";
        saveUsersToFile(users, databankPath);
    } else {
        sendString = "User aren't equal";
    }
    res.send(sendString);
});

module.exports = router;

router.get("/public-key", (req, res) => {
    res.send(rsaKey.publicKey);
});


function insertSorted(sortedArray, newElement) {
    const insertionIndex = findInsertionIndex(sortedArray, newElement.name);
    sortedArray.splice(insertionIndex, 0, newElement);
    return sortedArray;
}

function findInsertionIndex(sortedArray, name) {
    let low = 0, high = sortedArray.length;
    while (low < high) {
        const mid = (low + high) >>> 1;
        if (sortedArray[mid].name < name) low = mid + 1;
        else high = mid;
    }
    return low;
}

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

const saveUsersToFile = (users, filePath) => {
    filesys.writeFileSync(filePath, JSON.stringify(users), 'utf-8');
};

let users = loadUsersFromFile(databankPath);