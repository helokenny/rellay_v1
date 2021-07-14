const { default: axios } = require('axios');
const Sequelize = require('sequelize');

const TSN = require('../config/cfg/tracksend');
var models = require('../models');

// Display list of all contacts
exports.fetch = async (req, res) => {

    try {

        const settings = await models.Setting.findAll({
            where: {
                orgId: req.user.orgId,
            }
        }).catch(err => {
            console.log('errooooooor: ' + err);
            res.send({ status: "error", msg: "An error occurred"})
        })
 
        res.send({ status: "success", settings})
        
    } catch(err) {
        console.log('CAUGHT ERROR: ' + err);
        res.send({ status: "error", msg: "An error occurred"})
    };

};

exports.update = async (req, res) => {

    try {
        // console.log(`incoming...${JSON.stringify(req.body)}`)
        const amount = parseFloat(req.body.amount);

        const orgsett = await models.WalletTransaction.findOne({
            where: {
                orgId: req.user.orgId,
                userId: req.user.id,
            },
            attributes: ['balance']
        });
        
        const orgsett = await models.WalletTransaction.create({
            orgId: req.user.orgId,
            userId: req.user.id,
            txnClass: req.body.class.toUpperCase(),
            txnType: req.body.type,
            txnRef: req.body.txref,
            txnId: req.body.txid,
            amount,
            balance: Sequelize.literal('balance + ' + amount),
        });
        
        if(orgsett) {
            res.send({ status: "success" })
        } else {
            res.send({ status: "error", msg: "An error occurred"})
        }

    } catch(err) {
        console.log('CAUGHT ERROR: ' + err);
        res.send(err);
    };

}



