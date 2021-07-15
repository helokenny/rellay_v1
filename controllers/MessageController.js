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
                userId: req.user.id,
                switch: req.query.switch
            },
            include: [{
                model: (req.query.switch === 'contact') ? models.Contact : models.Member,
                attributes: ['id', 'fullname'],
            }]
        }).catch(err => {
            console.log('errooooooor: ' + err);
            res.send({ status: "error", msg: "An error occurred"})
        })
 console.log(`messages: ${JSON.stringify(messages)}`);
        res.send({ status: "success", messages})
        
    } catch(err) {
        console.log('CAUGHT ERROR: ' + err);
        res.send({ status: "error", msg: "An error occurred"})
    };

};

exports.add = async (req, res) => {
    let count = 1;

    try {
        console.log(`MessageController.add: ${JSON.stringify(req.body)}`);
        const transaction = await sequelize.transaction(async (t) => { 
            
            const org = await models.Org.findByPk(req.user.orgId,{
                attributes: ['id', 'sender', 'walletbalance']
            });

            const setting = await models.Setting.findByPk(req.user.orgId,{
                attributes: ['joint_wallet', 'followup_wallet_balance', 'members_wallet_balance']
            });

            const walletbalance = setting && setting.joint_wallet  
                                    ? org.walletbalance 
                                    : (req.body.switch === 'contact') 
                                    ? setting && setting.followup_wallet_balance 
                                    : setting && setting.members_wallet_balance; 

            const msg = req.body.msg;
            if(!org) throw "no_org";
            if(!org.sender) throw "no_sender";

            let recipients = req.body.contacts; //[`${req.body.switch}s`];

            console.log(`orgs...`); 

            if(!msg || !recipients || recipients.length === 0) throw 'invalid_fields';

            const savemsg = await models.Message.create({
                message: msg,
                orgId: req.user.orgId,
                userId: req.user.id,
                recipients: recipients.length,
                ...(
                    (recipients.length === 1) ? {
                        recipient_id: recipients[0]
                    } : {}
                ),
                switch: req.body.switch
            }, { transaction: t });

            if(!savemsg) throw 'error'; 

            const modella = (req.body.switch === 'contact') ? models.Contact : models.Member;
            const recipients_ = await modella.findAll({
                where: {
                    id: recipients,
                    orgId: req.user.orgId
                }
            }, { transaction: t });

            count = recipients_.length;
            console.log('konts are ' , JSON.stringify(count));
            if(!recipients_ || count === 0) throw 'invalid_contacts';

            const ret = await sendSMS(msg, recipients_, org, walletbalance, req.body.switch);
            console.log('reeeet: ' + JSON.stringify(ret));
            if(ret.error) throw ret.error;
            console.log('reeeet: 1');

            if((count === 1) && (ret.data.responseType == "OK")) {
            console.log('reeeet: 2');
                res.send({ 
                    status: "success", 
                    count, 
                    successfuls: 1, 
                    [`${req.body.switch}`]: { 
                        id: recipients_[0].id, fullname: recipients_[0].fullname 
                    }, 
                    msgid: savemsg.id, 
                    totalcost: ret.data.totalCharge,
                    datetime: savemsg.createdAt 
                })
            } else if((count > 1) && ret.data && ret.data.successfuls > 0) {
            console.log('reeeet: 3');
                res.send({ 
                    status: "success", 
                    count, 
                    successfuls: ret.data.successfuls, 
                    msgid: savemsg.id, 
                    totalcost: ret.data.totalCharge,
                    datetime: savemsg.createdAt 
                })
            } else {
            console.log('reeeet: 4');

                throw ret;
            } 

        })

    } catch(err) {
        console.log('CAUGHT ERROR: ' + err);
        console.log('CAUGHT ERROR: ' + JSON.stringify(err));

        if(err.type == 'balance') {
            console.log('reeeet: 1er');
            res.send({ status: "error", msg: `SMS Cost: N${err.cost}. You have insufficient Wallet balance.`})
        } else if(err.type == 'longmessage') {
            console.log('reeeet: 2er');
            res.send({ status: "error", msg: `Sorry, your message is too long: > 3 pages`})
        } 
        else res.send({ status: "error", msg: `An error occurred.`})
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
                    attributes: ['message', 'userId', 'switch']
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
                    switch: template.switch
                }, { transaction: t });

                if(!savemsg) throw 'error';

                console.log('konts are ' , JSON.stringify(contacts));
                if(!contacts || contacts.length === 0) throw 'invalid_contacts';

                let msg_ = msg
                .replace(/\[title\]/g,  'XXX')
                .replace(/\[firstname\]/g,  'XXXXXXX')
                .replace(/\[surname\]/g,  'XXXXXXX');

                if(msg != msg_) {
                    count = contacts_.length;
                    for(let x = 0; x < contacts_.length; x++) {
                        const k = contacts_[x];
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
                        if(ret.data.responseType == "OK") successfuls++;
                    }
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

async function sendSMS(msg, contacts_, org, walletbalance, swtch) {
    let totalPages, totalCharge, successfuls = 0;

    // const walletbalance = org.walletbalance;

    try {
        const getcharge = await sequelize.query("SELECT costpersms FROM rellayadmin", 
        { type: sequelize.QueryTypes.SELECT });
        const charge = getcharge[0].costpersms;

        let msg_ = msg
        .replace(/\[title\]/g,  'XXX')
        .replace(/\[firstname\]/g,  'XXXXXXX')
        .replace(/\[surname\]/g,  'XXXXXXX');

        if(msg != msg_) {
            console.log('handling customized messages...');

            //  first iteration to get total cost
            contacts_.forEach(k => {
                let msg_ = msg
                .replace(/\[title\]/g,  (k.gender == 'female') ? 'Sis.' : 'Bro.')
                .replace(/\[firstname\]/g,  k.fullname.split(' ')[0])
                .replace(/\[surname\]/g,  (k.fullname.split(' ').length > 1) ? k.fullname.split(' ')[1] : '')

                const numpgs = numberOfPages(msg_);
                if(numpgs === 0) throw { type: 'longmessage', count: msg_.length };
                totalPages += numpgs;
            })

            totalCharge = totalPages * charge;
            console.log('totalPages :>> ', totalPages, ' >>> charge => ', charge, ' >>> totalCharge => ', totalCharge);
            if(walletbalance < totalCharge) throw { type: 'balance', cost: totalCharge };

            console.log('contacts_:>> ', JSON.stringify(contacts_), ' >>> walletbalance => ', walletbalance, ' >>> totalCharge => ', totalCharge);
            //  second iteration to send message
            for(let x = 0; x < contacts_.length; x++) {
                const k = contacts_[x];
                let msg_ = msg
                .replace(/\[title\]/g,  (k.gender == 'female') ? 'Sis.' : 'Bro.')
                .replace(/\[firstname\]/g,  k.fullname.split(' ')[0])
                .replace(/\[surname\]/g,  (k.fullname.split(' ').length > 1) ? k.fullname.split(' ')[1] : '')

                console.log('contacts_:>> ', JSON.stringify(contacts_));


                const data = {
                    "token":    TSN.TOKEN,
                    "sender":   org.sender,
                    "message":  msg_,
                    "contacts": [{ phone: k.phone, countryId: 234 }],
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

                console.log('pre-axios:>> ');
                let ret = await axios(tosend);
                // let ret = { data: { responseType: "OK" }}
                console.log('389: ', JSON.stringify(ret.status));
                console.log('390: ', JSON.stringify(ret.statusText));
                console.log('391: ', JSON.stringify(ret.data));
                console.log('392: ', JSON.stringify(ret.error));
                if(ret.statusText === "OK") {
                    console.log('successfuls: ');
                    successfuls++;

                    // deduct charge
                    await models.Org.update({
                        walletbalance: walletbalance - totalCharge,
                    }, {
                        where: {
                            id: org.id
                        }
                    })
                } else {
                    console.log('394: ', JSON.stringify(Object.keys(ret)));
                    console.log('395: ', JSON.stringify(ret.status));
                    console.log('395: ', JSON.stringify(ret.statusText));
                    console.log('395: ', JSON.stringify(ret.data));
                    console.log('395: ', JSON.stringify(ret.error));
                }
            }
            
            console.log('successfuls >> ', successfuls);
            if(successfuls > 0) return { data: { responseType: "OK", successfuls, totalCharge }}
            return { data: { responseType: "error", msg: "An error occured." }}

        } else {
            console.log('handling uncustomized messages...');
            const contactlist = contacts_.map(k => { return { phone: k.phone, countryId: 234 } });

            const numpgs = numberOfPages(msg);
            if(numpgs === 0) throw { type: 'longmessage', count: msg.length };

            totalCharge = Number(numpgs) * Number(charge) * contactlist.length;
            console.log(`numpgs: ${numpgs}; getcharge: ${JSON.stringify(getcharge)}; charge: ${charge}; contactlist.length: ${contactlist.length}`);
            console.log(`walletbalance: ${walletbalance}; totalCharge: ${JSON.stringify(totalCharge)}`);

            if(walletbalance < totalCharge) throw { type: 'balance', cost: totalCharge };

            console.log(`contacts are = ${JSON.stringify(contactlist)}`);
            const data = {
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

            const ret = await axios(tosend);
            if(ret.statusText === "OK") {
                successfuls++;

                // deduct charge
                await models.Org.update({
                    walletbalance: walletbalance - totalCharge,
                }, {
                    where: {
                        id: org.id
                    }
                })
            } else {
                console.log(JSON.stringify(ret.data));
                console.log(JSON.stringify(ret));
            }

            // return { data: ret.data, successfuls: contactlist.length }
            if(successfuls > 0) return { data: { responseType: "OK", successfuls: contactlist.length, totalCharge }}
            return { data: { responseType: "error", msg: "An error occured." }}

            // deduct charge
            await models.Org.update({
                walletbalance: walletbalance - totalCharge,
            }, {
                where: {
                    id: org.id
                }
            })

            return { data: { responseType: "OK", successfuls: contactlist.length, totalCharge }}
            
        }

    } catch(err) {
        console.log('errrrrrr: ', err);
        console.log('errrrrrr: ', JSON.stringify(err));
        return { error: err };
    }
}

function numberOfPages(msg) {
    if(msg.length < 161) return 1;
    else if(msg.length < 161 + 150) return 2;
    else if(msg.length < 161 + 150 + 150) return 3;
    else return 0;
}



