const { default: axios } = require('axios');

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

        const dur_figure = req.body.contactExpiryFigure;
        const dur_period = req.body.contactExpiryPeriod;
        let duration = 0;

        switch (dur_period) {
            case 'days':
                duration = dur_figure;
                break;
        
            case 'weeks':
                duration = dur_figure * 7;
                break;
        
            case 'months':
                duration = dur_figure * 30;
                break;

            case 'years':
                duration = dur_figure * 365;
                break;
        
            default:
                break;
        }

        const orgsett = await models.Setting.update({
            equal_rights:   req.body.eadminSwitch,
            contact_display: req.body.contactDisplay,
            contact_tenure: duration,
            contact_period: req.body.contactExpiryPeriod,
            contact_expiry_action: req.body.contactExpiryAction,
            contact_weighting: req.body.fuweightSwitch,
            contact_msg_weight: req.body.messageWeight,
            contact_call_weight: req.body.callWeight,
            contact_visit_weight: req.body.visitWeight,
        },{
            where: {
                orgId: req.user.id
            }
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



