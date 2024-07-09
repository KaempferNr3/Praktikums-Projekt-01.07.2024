const express = require("express");
const levenshtein = require("fast-levenshtein");
const router = express.Router();
const users = [];
router.post("/add-User" , (req,res) => {
    let str = req.body.user ;
    if(str.length === 0){
        res.send("User rejected");
    }else{
        tempCreateTime = new  Date();
        console.log(users.push({name : req.body.user , createTime : tempCreateTime }));
        console.log("added user: " + users[users.length-1].name);
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
        tempLevenshtein = levenshtein.get(users[i] , inputString);

        if(smallestValue > tempLevenshtein){
            smallestValue = tempLevenshtein;
            indexOfElementWithLowestLevenshtein = i;
        }
    }
    res.send(users[indexOfElementWithLowestLevenshtein]);
    console.log(users[indexOfElementWithLowestLevenshtein]);
})


router.post("/delete-User" , (res,req) =>{
    delete users[req.body.userIndex];
    res.sendStatus(200);
})
module.exports = router;