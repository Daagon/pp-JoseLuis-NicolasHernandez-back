'use strict'

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const dataSchema = Schema({
    name: {type: String, required: true},
    email: String,
    phoneNum: Number,
    password: {type: String, required: true},
    age: {type: Number, required:true},
    gender: {type: String, enum: ['male', 'female']},
    hobby: {type: String, required: true},
    registrationDate: {type: Number, required:true}
});

module.exports = mongoose.model('usrdata', dataSchema);