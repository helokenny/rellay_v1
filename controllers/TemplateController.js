const { default: axios } = require('axios');

const TSN = require('../config/cfg/tracksend');
var models = require('../models');

// Display list of all contacts
exports.fetch = async (req, res) => {

    try {

        const tmplts = await models.Template.find({
            where: {
                orgId: req.user.orgId,
            }
        }).catch(err => {
            console.log('errooooooor: ' + err);
            res.send({ status: "error", msg: "An error occurred"})
        })
 
        res.send({ status: "success", tmplts})
        
    } catch(err) {
        console.log('CAUGHT ERROR: ' + err);
        res.send({ status: "error", msg: "An error occurred"})
    };

};

exports.add = async (req, res) => {

    try {

        const templates = await models.Template.create({
            name: req.body.name,
            message: req.body.message,
            orgId: req.user.orgId,
            userId: req.user.id,
            schedule: contacts_.length,
        }).catch(err => {
            console.log('ERROR: ' + err);
            res.send({ status: "err", msg: "An error occurred" })
        })
        
        res.send({ status: "success", templates })

    } catch(err) {
        console.log('ERROR: ' + err);
        res.send({ status: "err", msg: "An error occurred" })
    };

}



