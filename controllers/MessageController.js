const { default: axios } = require('axios');

const TSN = require('../config/cfg/tracksend');
var models = require('../models');

// Display list of all contacts
exports.fetch = async (req, res) => {

    try {

        const msgs = await models.Message.find({
            where: {
                orgId: req.user.orgId,
            }
        }).catch(err => {
            console.log('errooooooor: ' + err);
            res.send({ status: "error", msg: "An error occurred"})
        })
 
        res.send({ status: "success", msgs})
        
    } catch(err) {
        console.log('CAUGHT ERROR: ' + err);
        res.send({ status: "error", msg: "An error occurred"})
    };

};

exports.add = async (req, res) => {

    try {

        const org = await models.User.findByPk(req.user.orgId,{
            attributes: ['sender']
        });
 
        if(!org) throw "no_org";
        if(!org.sender) throw "no_sender";
        if(!msg || !contacts || contacts.length === 0) throw 'invalid_fields';

        const contacts_ = await models.Contact.find({
            where: {
                id: contacts,
                orgId: req.user.orgId
            }
        })

        console.log('konts are ' , JSON.stringify(contacts_));
        if(!contacts_ || contacts_.length === 0) throw 'invalid_contacts';

        let msg_ = msg.replace
        .replace(/\[title\]/g,  'XXX')
        .replace(/\[firstname\]/g,  'XXXXXXX')
        .replace(/\[surname\]/g,  'XXXXXXX');

        const savemsg = await models.Message.create({
            message: msg,
            orgId: req.user.orgId,
            userId: user_id,
            recipients: contacts_.length,
        })

        if(!savemsg) throw 'error';

        if(msg != msg_) {
            contacts_.forEach(k => {
                let msg_ = msg.replace
                .replace(/\[title\]/g,  (k.gender == 'female') ? 'Sis.' : 'Bro.')
                .replace(/\[firstname\]/g,  k.fullname.split(' ')[0])
                .replace(/\[surname\]/g,  k.fullname.split(' ')[1])

                const data = {
                    "token":    TSN.TOKEN,
                    "sender":   org.sender,
                    "message":  msg_,
                    "contacts": [{ phone: k.phone, country: 234 }],
                    "schedule": '',
                }
            })
        } else {
            const contactlist = contacts_.map(k => { return { phone: k.phone, country: 234 } })
            const data = {
                "token":    TSN.TOKEN,
                "sender":   org.sender,
                "message":  msg_,
                "contacts": contactlist,
                "schedule": '',
            }
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
        
        let ret = await axios(tosend);
        if(ret.data && ret.data.status == "ok") {
            res.send({ status: "success", msgid: savemsg.id})
        } else {
            res.send({ status: "error", msg: "An error occurred"})
        }

    } catch(err) {
        console.log('CAUGHT ERROR: ' + err);
        res.send(err);
    };

}



