const express = require("express");
const levenshtein = require("fast-levenshtein");
const router = express.Router();
const users = [];
const filesys = require('fs');
const pathForDataBank = require('../Databank');
const usersFilePath = pathForDataBank.join(__dirname, 'users.json');
users = loadUsersFromFile(usersFilePath);



router.post("/add-User", (req, res) => {
    let str = req.body.user;
    
    if (str.length === 0) {
        res.send("User rejected");
    } else {
        tempCreateTime = new Date();
        insertElementByName(users, { name : str, createTime : tempCreateTime });
        console.log("added user: " + users[users.length - 1].name);
        res.sendStatus(200);
    }
});

router.get("/" , (req,res) => {
    res.json({ users })
});
router.post("/find-User" , (req,res) =>{
    console.log(req.body.user)
    console.log('finding user...')
    let smallestValue = Number.MAX_SAFE_INTEGER;
    let inputString = req.body.user;
    let tempLevenshtein = 0;
    let indexOfElementWithLowestLevenshtein = 0;
    console.log(inputString);
    for(let i = 0;i < users.length;i++ ){
        tempLevenshtein = levenshtein.get(users[i].name , inputString);

        if(smallestValue > tempLevenshtein){
            smallestValue = tempLevenshtein;
            indexOfElementWithLowestLevenshtein = i;
        }
    }
    res.json(users[indexOfElementWithLowestLevenshtein]);
    console.log(users[indexOfElementWithLowestLevenshtein]);
})


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
    } else {
        sendString = "User aren't equal";
        console.log("Couldn't delete user");
    }
    res.send(sendString);
});

module.exports = router;
/**
 * Inserts a new element into a sorted array of objects based on the `name` property, maintaining the array's sorted order.
 * @param {Array} sortedArray - An array of objects sorted in ascending order based on the `name` property.
 * @param {Object} newElement - The object to be inserted into the array.
 * @returns {Array} - The updated sorted array with the new element inserted.
 */
function findInsertionIndex(sortedArray, newName) {
    let left = 0;
    let right = sortedArray.length - 1;
    newName = newName.toLowerCase();

    while (left <= right) {
        const middle = Math.floor((left + right) / 2);
        const middleElement = sortedArray[middle];
        const middleName = middleElement.name.toLowerCase();

        if (middleName === newName) {
            return middle;
        } else if (middleName < newName) {
            left = middle + 1;
        } else {
            right = middle - 1;
        }
    }

    return left;
}

/**
 * Inserts a new element into a sorted array of objects based on the `name` property, maintaining the array's sorted order.
 * @param {Array} sortedArray - An array of objects sorted in ascending order based on the `name` property.
 * @param {Object} newElement - The object to be inserted into the array.
 * @returns {Array} - The updated sorted array with the new element inserted.
 */
function insertElementByName(sortedArray, newElement) {
    console.log(newElement);
    if (sortedArray.length === 0) {
        sortedArray.push(newElement);
        return sortedArray;
    }

    const newName = newElement.name.toLowerCase();
    const insertionIndex = findInsertionIndex(sortedArray, newName);
    sortedArray.splice(insertionIndex, 0, newElement);

    return sortedArray;
}



const loadUsersFromFile = (filePath) => {
    if (filesys.existsSync(filePath)){
        filesys.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    }else{
        filesys.writeFileSync(filePath, JSON.stringify([]), 'utf-8')
        return [];
    }
};

const saveUsersToFile = (users, filePath) => {
    filesys.writeFileSync(filePath, JSON.stringify([]), 'utf-8');
    return [];
};