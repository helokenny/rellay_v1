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
            const groups = await models.Group.findAll({
                where: {
                    orgId: req.user.orgId,
                },
                /* order: [ 
                    ['id', 'ASC']
                ], */
            }, { transaction: t }).catch(err => {
                console.log('errooooooor: ' + err);
                res.send({ status: "error", msg: "An error occurred"})
            })
    
            // console.log(`contacts = ${JSON.stringify(contacts)}`);
            res.send({ status: "success", groups})
        })
            
    } catch(err) {
        console.log('CAUGHT ERROR: ' + err);
        res.send({ status: "error", msg: "An error occurred"})
    };

};

exports.add = async (req, res) => {
    console.log('GroupController.add: req.body: ' + JSON.stringify(req.body));
    try {
        let group, members = [];

        req.body.userId = req.user.id;
        req.body.orgId = req.user.orgId;
        req.body.forStatus = req.body.status;
        req.body.forGender = req.body.gender;
        req.body.forAgegroup = req.body.agegroup;

        console.log(`our req.body = ${JSON.stringify(req.body)}`);

        const transaction = await sequelize.transaction(async (t) => { 
            group = await models.Group.create(req.body, { transaction: t });

            if(req.body.type === 'Natural') {
                console.log('THIS IS NATURAL');
                if(req.body.status || req.body.gender || req.body.agegroup) {
                    members = await models.Member.findAll({
                        where: {
                            orgId: req.user.orgId,
                            ...(req.body.status ? { status: req.body.status} : {}),
                            ...(req.body.gender ? { gender: req.body.gender} : {}),
                            ...(req.body.agegroup ? { agegroup: req.body.agegroup} : {})
                        },
                        attributes: ['id']
                    })

                    if(members.length) {

                        members = members.map(m => { return m.id });
                        
                        console.log(`members: ${JSON.stringify(members)}`);
                        for(let i = 0; i < members.length; i++) {
                            console.log('THIS IS MEMBER');
                            await models.GroupMember.create({
                                groupId: group.id,
                                memberId: members[i]
                            }, { transaction: t });
                        };
                    }
                } else {
                    if(!query) throw 'no-conditions';
                }
            }

            if(group) res.send({ status: 'success', info: { groupId: group.id, members }});
            else res.send({ status: 'error', msg: "An error occured, please try again later." })

        })

    } catch(err) {
        console.log('CAUGHT ERROR: ' + err);
        res.send({ status: 'error', msg: "An error has occured, please try again later." });
    };
}



