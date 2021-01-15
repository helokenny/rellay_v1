const Sequelize = require('sequelize');
const sequelize = require('../config/db');
const { default: axios } = require('axios');

var models = require('../models');
var phoneval = require('../my_modules/phonevalidate');
const getCountry = require('../my_modules/getcountry');

// Display list of all contacts
exports.check = async (req, res) => {
    let str = req.query.q;
    let reslt;

    console.log('hereeeeeeeeeeeeeeeee: ' + str);

    let details = await models.Org.findAll({
        where: {
            [Sequelize.Op.or]: [
                { name: { [Sequelize.Op.like]: '%' + str + '%' } },
                { subname: { [Sequelize.Op.like]: '%' + str + '%' } },
                { generalname: { [Sequelize.Op.like]: '%' + str + '%' } },
            ]
        },
        limit: 21,
    })
    console.log('found orgs: ' + JSON.stringify(details));
    if(details && details.length > 0) {
        console.log('found orgs: 11111111');
        if(details.length > 20) {
            console.log('found orgs: 2222222222');
            reslt = { code: "fail", msg: "too_large" };
        } else {
            console.log('found orgs: 333333333');
            reslt = { code: "success", result: details };
        }
    } else {
        console.log('found orgs: 44444444');
        reslt = { code: "success", result: details };
    }
    console.log('to send:' + JSON.stringify(reslt));
    res.send( reslt );

};

exports.add = async (req, res) => {
    var contacts = [];
    var groupId, last_contactid;
    var err = { invalid: 0, duplicate: 0, total: 0 };
    var fl = { mtype: null, msg: '', code: '' };
    console.log('thereeeeeeeeeeeeeeeee');

    try {

        var user_id = req.user.id;

        //  CHECK IF USER HAS ZAPPIER TRIGGER INTEGRATED
        let zap = await models.Zapiertrigger.findOne({
            where: {
                userId: user_id,
                name: 'contact',
            },
            attributes: ['hookUrl'],
        })

        console.log('form details are now: ' + JSON.stringify(req.body)); 

        var userId = user_id;
        var status = 0;

        const user = await models.User.findByPk(userId);

        if(!req.body) throw 'error';

        if(req.body.group == -1) {
            console.log('creating new contact and group' + JSON.stringify(req.body));
            // var group = await user.createGroup(req.body);

            var group = await mongmodels.Group.create({
                // id: 123,
                name: req.body.name,
                userId,
                description: req.body.description,
                count: 0,
            }/* , (err, res) => {
                console.log('________created group ERROR: ' + JSON.stringify(err));
                console.log('________created group details: ' + JSON.stringify(res));
            } */);
        } else {
            // var group = await models.Group.findByPk(req.body.group);
            var group = await mongmodels.Group.findOne({
                ...( req.body.group ? {
                    _id: mongoose.Types.ObjectId(req.body.group),
                    userId
                } : {
                    name: req.body.groupname,
                    userId
                } )
            }, (err, res) => {
                console.log('mongodb found group details: ' + JSON.stringify(res));
                return res;
            });
        }

        groupId = group._id;

        if(!req.body.contacts) {
            contacts = [{
                phone     : req.body.phone,
                firstname : req.body.firstname,
                lastname  : req.body.lastname,
                email     : req.body.email,
                country   : req.body.country,
            }]
        } else {
            contacts = req.body.contacts;           //  for externalapi API
        }

        let zap_list = [];

        for(let p = 0; p < contacts.length; p++) {
            try {
                console.log('________creating contacts');
                let country   = (req.body.countryall) ? req.body.countryall : contacts[p].country;  //  .countryall is for externalapi API
                console.log('COUNTRY = ' + country);
                
                if(!(contacts[p].phone = phoneval(contacts[p].phone, country))) throw { name: "Invalid" };

                // console.log(JSON.stringify(ctry_));

                var contact = await mongmodels.Contact.create({
                    firstname: contacts[p].firstname,
                    lastname:  contacts[p].lastname,
                    phone:     contacts[p].phone,
                    email:     contacts[p].email,
                    groupId:   mongoose.Types.ObjectId(group._id),
                    country:   await getCountry(country),
                    userId:    userId,
                    status:    status,
                }/* , (err, res) => {
                    console.log('_______created contact with details: ' + JSON.stringify(res));
                    console.log('_______created contact with ERROR: ' + JSON.stringify(err));
                } */);

                console.log('new contact id = ' + contact._id);
                last_contactid = contact._id;
                /* await group.update({
                    count: Sequelize.literal('count + 1'),
                }); */

                if(zap) {
                    let i_d = parseInt(user_id + "" + contact._id + "" + new Date().getTime());
                    zap_list.push({
                        action: "add",
                        contact_id: contact._id,
                        group_id: group._id,
                    })
                }

            } catch(erro) {
                console.error('erro' , erro);
                if((erro.name == 'SequelizeUniqueConstraintError') || (erro.codeName == 'DuplicateKey') || (erro.code == 11000)) {
                    if(req.zapier) {    //  IF ZAPIER THEN UPDATE CONTACT
                        req.body.id = null;
                        return await this.saveContact(req, res);
                    }
                    else err.duplicate += 1;
                } else if(erro.name == 'Invalid') {
                    err.invalid += 1;
                } 
                err.total += 1;
                // throw {name: err.name + '-contact'};
                // throw 'error';
            };
        }

        if(zap) {
            console.log('...............about checking sending "new contact zap trigger. zap_list: ' + JSON.stringify(zap_list) + '; to url: ' + zap.hookUrl);

            console.log('...............about sending "new contact zap trigger.');
            let ret = await axios({
                method: 'POST',
                url: zap.hookUrl,
                data: JSON.stringify(zap_list),
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            })
            console.log('...............just sent "new contact zap trigger.');
            let seen = [];   //  JSON circular reference workaround
            console.log('...............just sent "new contact zap trigger. response: ' + JSON.stringify(ret, function (key, val) {
                if (val != null && typeof val == "object") {
                    if (seen.indexOf(val) >= 0) {
                        return;
                    }
                    seen.push(val);
                }
                return val;
            }) )
        }
        console.log('COUNTS = ' + contacts.length + '; ' + JSON.stringify(err));
        
        if(contacts.length > err.total) {
            fl.mtype = 'SUCCESS';
            fl.msg = 'Your ' + (contacts.length - err.total) + ' new Contact(s) has been created.';
        }
        if(err.duplicate > 0) {
            fl.mtype = fl.mtype || 'ERROR';
            fl.msg = fl.msg + err.duplicate + ' Duplicate Phone Number(s). ';
            fl.code = fl.code || "E033";
        }
        if(err.invalid > 0){
            fl.mtype = fl.mtype || 'ERROR';
            fl.msg = fl.msg + err.invalid + ' Invalid Phone Number(s). ';
            fl.code = fl.code || "E032";
        }

    } catch(err) {
        console.error('errorerr = ' + err);
        
        fl.mtype = fl.mtype || 'ERROR';
        fl.code = "OK";
        if((err.name == 'SequelizeUniqueConstraintError') || (err.codeName == 'DuplicateKey')) {
            fl.msg = fl.msg + 'Group Name already exists on your account. ';
            fl.code = "E020";
        } 
        if((err.MongoError && err.MongoError.search('11000') >= 0)) {
            if(err.MongoError.search('name_1_userId_1') >= 0) {
                fl.msg = fl.msg + 'Group Name already exists on your account. ';
                fl.code = "E020";
            } else {
                fl.msg = fl.msg + 'Contact(s) already exists in Group. ';
                fl.code = "E019";                
            }
        } 
        if(fl.msg == '') {
            fl.msg = fl.msg + 'An error occured. Kindly try again later or contact Admin. ';
            fl.code = "EOO1";
        }
    };

    if(req.externalapi) {
        if(req.zapier) {
            let i_d = groupId + "" + new Date().getTime();
            res.send([{
                status: "OK",
                id: i_d,
                group_id: groupId,
                contact_id: last_contactid,
            }])
        } else {
            res.send({
                response: fl.mtype == "SUCCESS" ? {id: groupId, success: contacts.length - err.total, duplicate: err.duplicate, invalid: err.invalid } : "An error occurred.", 
                responseType: fl.mtype, 
                responseCode: fl.code, 
                responseText: fl.mtype == "SUCCESS" ? "Group created successfully." : fl.msg, 
            })
        }
    } else {
        console.log('REQ FLASH = ' + JSON.stringify(fl.mtype.toLowerCase()) + JSON.stringify(fl.msg));
        
        req.flash(fl.mtype.toLowerCase(), fl.msg); 
        var backURL = req.header('Referer') || '/';
        res.redirect(backURL);
    }
}



