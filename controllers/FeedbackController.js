const { default: axios } = require('axios');

const sequelize = require('../config/db');
const TSN = require('../config/cfg/tracksend');
var models = require('../models');

// Display list of all contacts
exports.fetch = async (req, res) => {

    try {

        console.log(`req.query = ${JSON.stringify(req.query)}`);

        const feedbacks = await models.Feedback.findAll({
            where: {
                orgId: req.user.orgId,
                contactId: req.query.id,
            },
            order: [ 
                ['createdAt', 'DESC']
            ]
        }).catch(err => {
            console.log('errooooooor: ' + err);
            res.send({ status: "error", msg: "An error occurred"})
        })
        console.log(`feedbacks = ${JSON.stringify(feedbacks)}`);
 
        res.send({ status: "success", feedbacks})
        
    } catch(err) {
        console.log('CAUGHT ERROR: ' + err);
        res.send({ status: "error", msg: "An error occurred"})
    };

};

exports.add = async (req, res) => {
    let saveFeedback, contact;

    try {
        console.log(`req.body: = ${JSON.stringify(req.body)}`);
        // start transaction
        const transaction = await sequelize.transaction(async (t) => { 
            // save feedback for contact
            saveFeedback = await models.Feedback.create({
                remark: req.body.remark,
                orgId: req.user.orgId,
                userId: req.user.id,
                contactId: req.body.contactId,
                medium: req.body.medium,
                rating: Math.round(req.body.rating * 5 * 100) / 100,
            }, { transaction: t });

            if(!saveFeedback) throw new Error();

            //  get contact average rating
            const contactRating = await models.Feedback.findAll({
                where: {
                    contactId: req.body.contactId,
                },
                attributes: [[sequelize.fn('AVG', sequelize.col('rating')), 'avgrating']],
                raw: true,
            }, { transaction: t });
            console.log(`avgrating = ${JSON.stringify(contactRating)}`);

            //  get contact details
            contact = await models.Contact.findByPk(req.body.contactId, { transaction: t });
            //  get org settings
            const orgSettings = await models.Setting.findByPk(req.user.orgId, { transaction: t });

            let level = contact.level;
            console.log(`level1 = ${level}`);
            switch (req.body.medium) {
                case 'Visit':
                    level = Math.min(Number(level) + Number(orgSettings.contact_visit_weight), 100);
                    break;
            
                case 'Call':
                    level = Math.min(Number(level) + Number(orgSettings.contact_call_weight), 100);
                    break;
            
                case 'Message':
                    level = Math.min(Number(level) + Number(orgSettings.contact_msg_weight), 100);
                    break;
            
                default:
                    break;
            }
            console.log(`level2 = ${level}`);

            //  update contact with new rating and level
            await contact.update({
                level,
                rating: Math.round(Number(contactRating[0].avgrating) * 100) / 100,
            }, { transaction: t });
        })

        console.log(`saveFeedback = ${JSON.stringify(saveFeedback)}`);
        res.send({ status: "success", id: saveFeedback.id, contactRating: contact.rating, contactLevel: contact.level });

    } catch(err) {
        console.log('CAUGHT ERROR: ' + err);
        res.send({ status: "error", msg: "An error occurred"});
    };

}



