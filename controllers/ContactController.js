const Sequelize = require('sequelize');
const sequelize = require('../config/db');
const { default: axios } = require('axios');

var models = require('../models');
var phoneval = require('../my_modules/phonevalidate');
const getCountry = require('../my_modules/getcountry');

// Display list of all contacts
exports.fetch = async (req, res) => {

    try {

        const transaction = await sequelize.transaction(async (t) => { 
            const contacts = await models.Contact.findAll({
                where: {
                    orgId: req.user.orgId,
                    ...(
                        req.query.all ? {} : {
                            userId: req.user.id
                        }
                    )
                },
                include:[{
                    model: models.User,
                    attributes: ['id', 'fullname'] 
                }]
            }, { transaction: t }).catch(err => {
                console.log('errooooooor: ' + err);
                res.send({ status: "error", msg: "An error occurred"})
            })
    
            // console.log(`contacts = ${JSON.stringify(contacts)}`);
            res.send({ status: "success", contacts})
        })
            
    } catch(err) {
        console.log('CAUGHT ERROR: ' + err);
        res.send({ status: "error", msg: "An error occurred"})
    };

};

exports.add = async (req, res) => {
    console.log('ContactController.add: req.body: ' + JSON.stringify(req.body));
    try {
        let contact, feedback, remark;

        req.body.userId = req.user.id;
        req.body.orgId = req.user.orgId;

        const transaction = await sequelize.transaction(async (t) => { 
            contact = await models.Contact.create(req.body, { transaction: t });

            const firstname = req.body.fullname.split(' ')[0];
            const contacting = (req.body.catg == 'Visitor') ? 'visited' : 'was invited to';
            const churchname = await models.Org.findByPk(req.body.orgId, { attributes: ['name']}, { transaction: t });
            const when = (req.body.period == 'today') ? 'today' : `on ${req.body.period}`;
            remark = `${firstname} ${contacting} ${churchname.name} ${when}. ${req.body.remark}`;

            feedback = await contact.createFeedback({
                remark,
                rating: 1,
                medium: "NEW",
                userId: req.user.id,
                orgId: req.user.orgId,
            }, { transaction: t });

        })

        if(contact) res.send({ status: 'success', info: { id: contact.id, feedbackId: feedback.id, feedbackRemark: remark, createdAt: feedback.createdAt, userId: req.user.id }});
        else res.send({ status: 'error', msg: "An error occured, please try again later." })

    } catch(err) {
        console.log('CAUGHT ERROR: ' + err);
        res.send({ status: 'error', msg: "An error has occured, please try again later." });
    };
}

exports.clearOld = async (req, res) => {
    
    console.log('ContactController.add: req.body: ' + JSON.stringify(req.body));
    try {
        let contact, feedback, remark;

        const transaction = await sequelize.transaction(async (t) => { 

            let settings = await models.Setting.findOne({
                where: {
                    orgId: req.body.orgId,
                },
                attributes: ['contact_tenure']
            });

            contact = await sequelize.query(`DELETE FROM contacts 
                                            JOIN settings ON contacts.orgId = settings.orgId 
                                            WHERE 
                                                contacts.createdAt <= DATE_SUB(NOW(), INTERVAL ${settings.contact_tenure} DAY) 
                                                AND settings.contact_expiry_action = "DELETE"
                                                AND contacts.orgId = :orgId `, {
                                                    replacements: {orgId: req.body.orgId},
                                                    // type: sequelize.QueryTypes.SELECT,
                                                }, { transaction: t });

        })

        return { status: 'success' };

    } catch(err) {
        console.log('CAUGHT ERROR: ' + err);
        return { status: 'error' };
    };
}



