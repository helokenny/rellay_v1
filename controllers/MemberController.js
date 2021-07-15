const Sequelize = require('sequelize');
const sequelize = require('../config/db');
const { default: axios } = require('axios');

var models = require('../models');
var phoneval = require('../my_modules/phonevalidate');
var arrayToObject = require('../my_modules/arrayToObject');
const getCountry = require('../my_modules/getcountry');

// Display list of all contacts
exports.fetch = async (req, res) => {

    try {
        //  first get all members
        /* const group = await models.Group.findOne({
            where: {
                id: req.query.id,
                orgId: req.user.orgId,
            },
            include: ['members']
        }).catch(err => {
            console.log('errooooooor: ' + err);
            res.send({ status: "error", msg: "An error occurred"})
        }) */

        const members = await sequelize.query(`SELECT members.*, GROUP_CONCAT(group_members.groupId ORDER BY group_members.groupId ASC SEPARATOR ',') AS grps FROM members 
                                             JOIN group_members ON members.id = group_members.memberId
                                             WHERE members.orgId = :orgId
                                             GROUP BY members.id
                                             ORDER BY members.fullname
                                            `, {
                                                replacements: {orgId: req.query.id},
                                                type: sequelize.QueryTypes.SELECT 
                                            });
 
        console.log(`ALL MEMBERS ARE ${JSON.stringify(members)}`);
        //  filter through their grps

        /* let shortlist = [];
        members.forEach(m => {
            const grps = JSON.parse(m.grps);
            if(grps.indexOf(Number(req.query.id)) >= 0) {
                m.grps = grps;
                shortlist.push(m)
            }
        }) */

        // console.log(`count2: ${shortlist.length}`);

        // res.send({ status: "success", members: arrayToObject(shortlist) })
        res.send({ status: "success", members })
        
    } catch(err) {
        console.log('CAUGHT ERROR: ' + err);
        res.send({ status: "error", msg: "An error occurred"})
    };

};

exports.add = async (req, res) => {

    try {

        req.body.userId = req.user.id;
        req.body.orgId = req.user.orgId;
        // let defaultGroup, member;

        const transaction = await sequelize.transaction(async (t) => { 
            console.log(`user.body >> ${JSON.stringify(req.body)}`);
            const member = await models.Member.create(req.body, { transaction: t });

            //  first
            const defaultGroup = await models.GroupMember.create({
                groupId: req.body.grps,     //  THIS HAS TO BE THE 'GENERAL' group id. Members can only be added to this group on creation
                memberId: member.id
            }, { transaction: t });

            //  next, add member to appropriate Natural groups
            const groupings = await models.Group.findAll({
                where: {
                    type: 'Natural',
                    [Sequelize.Op.or]: [
                        { forStatus: req.body.status },
                        { forStatus: '' },
                    ],
                    [Sequelize.Op.or]: [
                        { forGender: req.body.gender },
                        { forGender: '' },
                    ],
                    [Sequelize.Op.or]: [
                        { forAgegroup: req.body.agegroup },
                        { forAgegroup: '' },
                    ],
                },
                attributes: ['id']
            })

            for(let i = 0; i < groupings.length; i++) {
                await models.GroupMember.create({
                    groupId: groupings[i].id,
                    memberId: member.id,
                }, { transaction: t });
            }

            if(defaultGroup) res.send({ status: 'success', id: member.id, grps: groupings });
            else res.send({ status: 'error', msg: "An error occured, please try again later." })
                
        })

    } catch(err) {
        console.log('CAUGHT ERROR: ' + err);
        res.send({ status: 'error', msg: "An error has occured, please try again later." });
    };
}

exports.assign = async (req, res) => {

    try {

        req.body.userId = req.user.id;
        req.body.orgId = req.user.orgId;

        const transaction = await sequelize.transaction(async (t) => { 
            const members = req.body.members;

            for(let i = 0; i < members.length; i++) {
                await models.GroupMember.create({
                    groupId: req.body.groupId,
                    memberId: members[i]
                }, { transaction: t });
            }

        })

        res.send({ status: 'success' });
            
    } catch(err) {
        console.log('CAUGHT ERROR: ' + err);
        res.send({ status: 'error', msg: "An error has occured, please try again later." });
    };
}



