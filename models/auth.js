'use strict'

const mongoose = require('mongoose');
const User = require('../models/user');

function signUp(req, res){
    const user = new User({
        
    });
}

function signIn(req, res){

}

module.exports = {
    signUp,
    signIn
}