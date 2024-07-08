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
    let smallestValue = Number.MAX_SAFE_INTEGER;
    let inputString = req.body.user;
    let tempLevenshtein = 0;
    let indexOfElementWithLowestLevenshtein = 0;

    for(let i = 0;i < users.length;i++ ){
        tempLevenshtein = levenshtein.get(users[i] , inputString);

        if(smallestValue > tempLevenshtein){
            smallestValue = tempLevenshtein;
            indexOfElementWithLowestLevenshtein = i;
        }
    }
    res.status(200).json(users [indexOfElementWithLowestLevenshtein]);
})
router.post("/delete-User" , (res,req) =>{
    delete users[req.body.userIndex];
    res.sendStatus(200);
})
module.exports = router;