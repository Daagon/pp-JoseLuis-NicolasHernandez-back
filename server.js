'use strict'
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
var path = require('path');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Config = require('./configs/config');
const Data = require("./models/usersData");
const { isRegExp } = require('util');
const crypto = require('crypto'), algorithm = 'aes-256-ctr';

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.set('key', Config.key);
app.use(express.static(path.join(__dirname, 'public')));


let usuario = {nombre:'', apellido:''};
let respuesta = {error: false, codigo: 200, mensaje: ''};

//DATOS DEL AUTOR:
//Por el lado del servidor, está todo lo que me pidieron. Todas las consultas hechas y andando. De igual forma, cada ruta funciona adecuadamente
//y al momento de hacer peticiones, como lo solicitaron, me pide una autenticación. Utilicé ARC para poder hacer las peticiones (ejemplo: POST, DELETE)
//y poder poner el token de autenticación.
//La ruta de /api/newuser se encarga de crear y popular la báse de datos. Está hecha la conexión, pero cuando usted lo abra, solo va a tener que
//activar su servidor de mongodb y crear/activar la base de datos packnpack y todo funcionaría adecuadamente. Espero haberlo hecho correctamente
//segun sus especificaciones.
//Autor: José Luis Nicolás Hernández


mongoose.connect('mongodb://localhost/packnpack', (err, res) =>{
    if(err) {
        return console.log('Error al conectar a la base de datos: ' + err);
    }
    console.log('Conexión a la base de datos establecida...');
});

function encrypt(text, pass) {
    try {
        var cipher = crypto.createCipher(algorithm, pass);
        var crypted = cipher.update(text, 'utf8', 'hex');
        crypted += cipher.final('hex');
        return crypted;
    }
    catch (err) {
        if (debug) console.log('Error al encriptar:' + err);
    }
  }
  function decrypt(text, pass) {
    try {
        var decipher = crypto.createDecipher(algorithm, pass);
        var dec = decipher.update(text, 'hex', 'utf8');
        dec += decipher.final('utf8');
        return dec;
    }
    catch (err) {
        if (debug) console.log('Error al desencriptar:' + err);
    }
  }

app.post('/api/authenticate', (req, res) => {
    if(req.body.user === "packnpack" && req.body.password === 123456789){
        const payload = {
            check: true
        };
        const token = jwt.sign(payload, app.get('key'), {
            expiresIn: 1440
        });
        res.json({
            message: 'Authenticate',
            token: token
        });
    }
    else{
        res.json({message: "Incorrect user or password: "+req.body.user+"-"+req.body.password})
    }
});

const protectedRoutes = express.Router();
protectedRoutes.use((req,res, next) => {
    const token = req.headers['access-token'];

    if(token){
        jwt.verify(token, app.get('key'), (err, decode) => {
            if(err) {
                return res.json({message: 'Invalid token'});
            }
            else
            {
                req.decode = decode;
                next();
            }
        });
    }
    else
    {
        res.send({
            message: 'Token not provided.'
        });
    }
});

//GENERAR NUEVO REGISTRO  
app.post('/api/newuser',protectedRoutes, function(req, res) {
    let usrData = new Data();
    usrData.name = req.body.name;
    usrData.email = req.body.email;
    usrData.phoneNum = req.body.phoneNum;
    usrData.password = encrypt(req.body.password, "packnpack");
    usrData.age = req.body.age;
    usrData.gender = req.body.gender;
    usrData.hobby = req.body.hobby;
    usrData.registrationDate = req.body.registrationDate;

    usrData.save((err, dataStored) => {
        if(err) res.status(500).send({message: 'Error al salvar en la base de datos: '+err});
        res.status(200).send({dataStored});
    });
});
// protectedRoutes, <--- la parte de seguridad que pide un token para dar permiso a cada petición
app.get('/api/users',protectedRoutes, function(req, res){
    //let request = req.params.parameters;
    var myquery = req.query.type;
    var myquery2 = req.query.parameter;
    var myquery3 = req.query.type2;
    var myquery4 = req.query.parameter2;
    if(myquery == "name" && myquery2 != null)
    {
        Data.find({name: myquery2}, (err, usrs) =>{
            if(err) res.status(500).send({message: 'Error al realizar la petición: '+err});
            if(!usrs) return res.status(404).send({message: 'Datos no encontrados'});
            res.status(200).send({usrs});
        });
    }
    else if(myquery == "hobby" && myquery2 != null)
    {
        Data.find({hobby:myquery2}, (err, usrs) =>{
            if(err) res.status(500).send({message: 'Error al realizar la petición: '+err});
            if(!usrs) return res.status(404).send({message: 'Usuario no encontrado'});
            res.status(200).send({usrs});
        });
    }
    else if((myquery == "name" || myquery == "hobby") && (myquery3 == "name" || myquery3 == "hobby"))
    {
        Data.find({name:{$eq:myquery4}, hobby:{$eq:myquery2}}, (err, usrs) =>{
            if(err) res.status(500).send({message: 'Error al realizar la petición: '+err});
            if(!usrs) return res.status(404).send({message: 'Usuario no encontrado'});
            res.status(200).send({usrs});
        });
    }
    else
    {
        Data.find({}, (err, usrs) =>{
            if(err) res.status(500).send({message: 'Error al realizar la petición: '+err});
            if(!usrs) return res.status(404).send({message: 'Datos no encontrados'});
            res.status(200).send({usrs});
        });
    }
});
// protectedRoutes,
app.get('/api/specifyusers',protectedRoutes, function(req, res){
    var datetime = new Date();
    var date = datetime.toISOString().slice(0,10).split("-")[2]
    console.log(date);
    Data.find({age: {$gt: 18}, gender: {$eq: "male"}, registrationDate: {$lte: date}, registrationDate: {$gt: date-3}}, (err, usrs) =>{
        if(err) res.status(500).send({message: 'Error al realizar la petición: '+err});
        if(!usrs) return res.status(404).send({message: 'Datos no encontrados'});
        res.status(200).send({usrs});
    }).sort({hobby: 1});
});
// protectedRoutes,
app.delete('/api/deleteuser/:name',protectedRoutes, function (req, res) {
    var userName = req.params.name;

    Data.findOne({name:userName}, (err, dataFound) => {
        if(err) res.status(500).send({message: 'Error al borrar el producto: '+err});
        dataFound.remove(err => {
            if(err) res.status(500).send({message: 'Error al borrar el producto: '+err});
            res.status(200).send({message: 'El producto a sido eliminado'});
        });
    });
    
});

app.get('/', function(req, res) {
    respuesta = {error: true, codigo: 200, mensaje: 'Punto de inicio'};
    res.send(respuesta);
});

app.use(function(req, res, next) {
respuesta = {
    error: true, 
    codigo: 404, 
    mensaje: 'URL no encontrada'
    };
    res.status(404).send(respuesta);
});

app.listen(3000, () => {
    console.log("API REST inicializado en localhost, puerto 3000");
});