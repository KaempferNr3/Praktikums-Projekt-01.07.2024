const express = require('express');
const levenshtein = require("fast-levenshtein");
const router = express.Router();
const filesys = require('fs');
const pathForDataBank = require('../Databank/users.json');
const usersFilePath = pathForDataBank.join(__dirname, 'users.json');
let users = loadUsersFromFile(usersFilePath);

router.post("/add-User", (req, res) => {
    let str = req.body.user;
    let newUser = {
        name: str,
        createTime: new Date(),
        privileges: req.body.privileges || 'user' // Default to 'user' if not provided
    };
    users = insertSorted(users, newUser); 
    saveUsersToFile(users, usersFilePath);
    res.send("User added");
});

router.get("/", (req, res) => {
    // Send users without privileges
    const usersWithoutPrivileges = users.map(user => ({
        name: user.name,
        createTime: user.createTime
    }));
    res.json({ users: usersWithoutPrivileges });
});

router.post("/find-User", (req, res) => {
    console.log(req.body.user);
    console.log('finding user...');
    let index = findInsertionIndex(users, req.body.user);
    if (index !== -1 && users[index].name === req.body.user) {
        res.send("User found");
    } else {
        res.send("User not found");
    }
});

router.post("/delete-User", (req, res) => {
    let sendString = "";
    req.body.user.createTime = new Date(req.body.user.createTime);
    console.log("user is : " + req.body.user);
    console.log("deleting User");
    let index = findInsertionIndex(users, req.body.user.name);
    console.log(req.body.user);
    if (
        users[index].name === req.body.user.name &&
        users[index].createTime.getTime() === req.body.user.createTime.getTime()
    ) {
        users.splice(index, 1);
        sendString = "User: \"" + req.body.user.name + "\" Deleted";
        console.log("Deleted User");
        saveUsersToFile(users, usersFilePath);
    } else {
        sendString = "User aren't equal";
        console.log("Couldn't delete user");
    }
    res.send(sendString);
});

module.exports = router;

/**
 * Inserts a new element into a sorted array of objects based on the `name` property, maintaining the array's sorted order.
 * @param {Array} sortedArray - The sorted array of objects.
 * @param {Object} newElement - The new element to insert.
 * @returns {Array} - The updated sorted array with the new element inserted.
 */
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
        return JSON.parse(data);
    } else {
        filesys.writeFileSync(filePath, JSON.stringify([]), 'utf-8');
        return [];
    }
};

const saveUsersToFile = (users, filePath) => {
    filesys.writeFileSync(filePath, JSON.stringify(users), 'utf-8');
};