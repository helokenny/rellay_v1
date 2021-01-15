const Sequelize = require('sequelize');
const sequelize = require('../config/db');
const { default: axios } = require('axios');

var models = require('../models');
var phoneval = require('../my_modules/phonevalidate');
const getCountry = require('../my_modules/getcountry');

// Display list of all contacts
exports.fetch = async (req, res) => {

    try {

        const contacts = await models.Contact.findAll({
            where: {
                orgId: req.user.orgId,
            }
        }).catch(err => {
            console.log('errooooooor: ' + err);
            res.send({ status: "error", msg: "An error occurred"})
        })
 
        res.send({ status: "success", contacts})
        
    } catch(err) {
        console.log('CAUGHT ERROR: ' + err);
        res.send({ status: "error", msg: "An error occurred"})
    };

};

exports.add = async (req, res) => {
    console.log('ContactController.add: req.body: ' + JSON.stringify(req.body));
    try {

        req.body.userId = req.user.id;
        req.body.orgId = req.user.orgId;

        const contact = await models.Contact.create(req.body);

        if(contact) res.send({ status: 'success', id: contact.id});
        else res.send({ status: 'error', msg: "An error occured, please try again later." })
        
    } catch(err) {
        console.log('CAUGHT ERROR: ' + err);
        res.send({ status: 'error', msg: "An error has occured, please try again later." });
    };
}



