const { default: axios } = require('axios');
const Sequelize = require('sequelize');
const moment = require('moment');

const sequelize = require('../config/db');
const TSN = require('../config/cfg/tracksend');
var models = require('../models');

// Display list of all contacts
exports.fetch = async (req, res) => {

    try {

        const messages = await models.Message.findAll({
            where: {
                orgId: req.user.orgId,
                userId: req.user.id
            },
            include: [{
                model: models.Contact,
                attributes: ['id', 'fullname'],
            }]
        }).catch(err => {
            console.log('errooooooor: ' + err);
            res.send({ status: "error", msg: "An error occurred"})
        })
 console.log(`contacts: ${JSON.stringify(messages)}`);
        res.send({ status: "success", messages})
        
    } catch(err) {
        console.log('CAUGHT ERROR: ' + err);
        res.send({ status: "error", msg: "An error occurred"})
    };

};

exports.add = async (req, res) => {
    let ret, count = 1, successfuls = 0;

    try {
        console.log(`MessageController.add: ${JSON.stringify(req.body)}`);
        const transaction = await sequelize.transaction(async (t) => { 
            
            const org = await models.Org.findByPk(req.user.orgId,{
                attributes: ['sender']
            }, { transaction: t });

            const msg = req.body.msg;
            if(!org) throw "no_org";
            if(!org.sender) throw "no_sender";

            let contacts = req.body.contacts;

            console.log(`orgs...`);

            let data;
  
            if(!msg || !contacts || contacts.length === 0) throw 'invalid_fields';

            let msg_ = msg
            .replace(/\[title\]/g,  'XXX')
            .replace(/\[firstname\]/g,  'XXXXXXX')
            .replace(/\[surname\]/g,  'XXXXXXX');

            const savemsg = await models.Message.create({
                message: msg,
                orgId: req.user.orgId,
                userId: req.user.id,
                recipients: contacts.length,
                ...(
                    (contacts.length === 1) ? {
                        contactId: contacts[0]
                    } : {}
                )
            }, { transaction: t });

            if(!savemsg) throw 'error';

            const contacts_ = await models.Contact.findAll({
                where: {
                    id: contacts,
                    orgId: req.user.orgId
                }
            }, { transaction: t });

            console.log('konts are ' , JSON.stringify(contacts_));
            if(!contacts_ || contacts_.length === 0) throw 'invalid_contacts';

            if(msg != msg_) {
                count = contacts_.length;
                contacts_.forEach(async k => {
                    let msg_ = msg
                    .replace(/\[title\]/g,  (k.gender == 'female') ? 'Sis.' : 'Bro.')
                    .replace(/\[firstname\]/g,  k.fullname.split(' ')[0])
                    .replace(/\[surname\]/g,  (k.fullname.split(' ').length > 1) ? k.fullname.split(' ')[1] : '')

                    data = {
                        "token":    TSN.TOKEN,
                        "sender":   org.sender,
                        "message":  msg_,
                        "contacts": [{ phone: k.phone, country: 234 }],
                        "schedule": '',
                    }

                    let tosend = {
                        method: 'POST',
                        url: TSN.URL,
                        data,
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        }
                    };

                    // ret = await axios(tosend);
                    ret = { data: { responseType: "OK" }}
                    if(ret.data && ret.data.responseType == "OK") successfuls++;
                })
            } else {
                const contactlist = contacts_.map(k => { return { phone: k.phone, countryId: 234 } })
                console.log(`contacts are = ${JSON.stringify(contactlist)}`);
                data = {
                    "token":    TSN.TOKEN,
                    "sender":   org.sender,
                    "message":  msg,
                    "contacts": contactlist,
                    "schedule": '',
                }

                let tosend = {
                    method: 'POST',
                    url: TSN.URL,
                    data,
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                };

                // ret = await axios(tosend);
                ret = { data: { responseType: "OK" }}
            }

            if((count === 1) && ret.data && (ret.data.responseType == "OK")) {
                res.send({ 
                    status: "success", 
                    count, 
                    successfuls: 1, 
                    contact: { 
                        id: contacts_[0].id, fullname: contacts_[0].fullname 
                    }, 
                    msgid: savemsg.id, 
                    datetime: savemsg.createdAt 
                })
            } else if((count > 1) && successfuls > 0) {
                res.send({ 
                    status: "success", 
                    count, 
                    successfuls, 
                    msgid: savemsg.id, 
                    datetime: savemsg.createdAt 
                })
            } else throw ret;

        })

    } catch(err) {
        console.log('CAUGHT ERROR: ' + err);
        console.log('CAUGHT ERROR: ' + JSON.stringify(err.data));
        res.send({ status: "error", msg: `An error occurred.`})
    };

}

exports.scheduledSend = async (req, res) => {
    let ret, count = 1, successfuls = 0;

    try {

        console.log(`MessageController.scheduledSend: ${JSON.stringify(req.body)}`);

        const transaction = await sequelize.transaction(async (t) => { 
            
            let contacts = req.body.contacts;
            let templateId = req.body.templateId;
            const thisYear = new Date().getFullYear().toString();
            const dontIncludeArchive = ` AND contacts.is_active = TRUE `;

            console.log(`orgs...`);

            const TODAY = moment().format('YYYY-MM-DD');

            console.log(`CONTACTS COMING UP...for...${contacts}`);
            
            /* contacts = await sequelize.query("SELECT `orgs`.`id`, `orgs`.`sender`, `contacts`.`id` AS `contacts.id`, `contacts`.`fullname` AS `contacts.fullname`, " +
                                "`contacts`.`phone` AS `contacts.phone`, `contacts`.`gender` AS `contacts.gender`, `contacts`.`dob` AS `contacts.dob`, `templates`.`message`  " +
                                "FROM `orgs` " +
                                "LEFT OUTER JOIN `contacts` ON `orgs`.`id` = `contacts`.`orgId` " +
                                "LEFT OUTER JOIN `templates` ON `orgs`.`id` = `templates`.`orgId` " +
                                "WHERE " +
                                "    `templates`.`recurrence` = 'Birthdays' " +
                                "    AND `templates`.`status` = 'ACTIVE' " +
                                "    AND `contacts`.`dob` IS NOT NULL " +
                                "    AND CONCAT('" + thisYear + "-', `contacts`.`dob`) " +
                                "    " + dontIncludeArchive , 
                        {
                            type: sequelize.QueryTypes.SELECT,
                        }); */

            contactOrgs = await models.Org.findOne({
                include: [{
                    required: true,
                    model: models.Template,
                    where: {
                        // status: 'ACTIVE',
                        // recurrence: 'Birthdays',
                        id: templateId,
                    },
                    attributes: ['message', 'userId']
                }, {
                    required: true,
                    model: models.Contact,
                    where: {
                        ...(
                            (contacts == 'birthday_contacts') ? {
                                [Sequelize.Op.and]: [
                                    {is_active: true},
                                    Sequelize.where(Sequelize.fn("concat", thisYear, "-", Sequelize.col("dob")), TODAY)
                                ]
                            } : (
                                (contacts == 'all_contacts') ? {
                                    is_active: true,
                                } : {}
                            )
                        )
                    },
                    attributes: ['id', 'fullname', 'phone', 'gender']
                }],
            })

            console.log(`BIRTHDAY CONTACTS ARE: ${JSON.stringify(contactOrgs)}`);
         

            let data;
  
            for(let co = 0; co <= contactOrgs.length; co++) {
                const org = contactOrgs[co];

                const template = org.templates[0];
                const contacts = org.contacts;

                const msg = template.message;
                if(!msg || !contacts || contacts.length === 0) throw 'invalid_fields';

                let msg_ = msg
                .replace(/\[title\]/g,  'XXX')
                .replace(/\[firstname\]/g,  'XXXXXXX')
                .replace(/\[surname\]/g,  'XXXXXXX');

                const savemsg = await models.Message.create({
                    message: msg,
                    orgId: org.id,
                    userId: template.userId,
                    recipients: contacts.length,
                    ...(
                        (contacts.length === 1) ? {
                            contactId: contacts[0].id
                        } : {}
                    ),
                    fromTemplate: templateId,
                }, { transaction: t });

                if(!savemsg) throw 'error';

                console.log('konts are ' , JSON.stringify(contacts));
                if(!contacts || contacts.length === 0) throw 'invalid_contacts';

                if(msg != msg_) {
                    count = contacts_.length;
                    contacts.forEach(async k => {
                        let msg_ = msg
                        .replace(/\[title\]/g,  (k.gender == 'female') ? 'Sis.' : 'Bro.')
                        .replace(/\[firstname\]/g,  k.fullname.split(' ')[0])
                        .replace(/\[surname\]/g,  (k.fullname.split(' ').length > 1) ? k.fullname.split(' ')[1] : '')

                        data = {
                            "token":    TSN.TOKEN,
                            "sender":   org.sender,
                            "message":  msg_,
                            "contacts": [{ phone: k.phone, country: 234 }],
                            "schedule": '',
                        }

                        let tosend = {
                            method: 'POST',
                            url: TSN.URL,
                            data,
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            }
                        };

                        // ret = await axios(tosend);
                        ret = { data: { responseType: "OK" }}
                        if(ret.data && ret.data.responseType == "OK") successfuls++;
                    })
                } else {
                    const contactlist = contacts.map(k => { return { phone: k.phone, countryId: 234 } })
                    console.log(`contacts are = ${JSON.stringify(contactlist)}`);
                    data = {
                        "token":    TSN.TOKEN,
                        "sender":   org.sender,
                        "message":  msg,
                        "contacts": contactlist,
                        "schedule": '',
                    }

                    let tosend = {
                        method: 'POST',
                        url: TSN.URL,
                        data,
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        }
                    };

                    // ret = await axios(tosend);
                    ret = { data: { responseType: "OK" }}
                }


            }  //  orgs for end

            return { status: 'success' };

        })  //  transaction end

    } catch(err) {
        console.log('CAUGHT ERROR: ' + err);
        console.log('CAUGHT ERROR: ' + JSON.stringify(err.data));
        return { status: 'error' }
    };

}



