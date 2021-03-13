const { default: axios } = require('axios');
const moment = require('moment');

const sequelize = require('../config/db');
const TSN = require('../config/cfg/tracksend');
var models = require('../models');

// Display list of all contacts
exports.fetch = async (req, res) => {

    try {

        const templates = await models.Template.findAll({
            where: {
                orgId: req.user.orgId,
                switch: req.query.switch,
            },
        }).catch(err => {
            console.log('errooooooor: ' + err);
            res.send({ status: "error", msg: "An error occurred"})
        })

        res.send({ status: "success", templates})
        
    } catch(err) {
        console.log('CAUGHT ERROR: ' + err);
        res.send({ status: "error", msg: "An error occurred"})
    };

};

exports.add = async (req, res) => {
    let newTemplate, newScheduledTask, next;

    try {

        const transaction = await sequelize.transaction(async (t) => { 

            console.log('req.body: ', JSON.stringify(req.body));
            const name = req.body.name;
            const message = req.body.message;
            const orgId = req.user.orgId;
            const userId = req.user.id;
            const recurrence = req.body.recurrence;
            const bydateorday = req.body.byDateOrDay;
            const monthday = req.body.recurrenceMonthDay;
            const recurrence_date = req.body.recurrenceDate;
            const timetosend = req.body.recurrenceTime;
            const sendAtHour = timetosend.split(':')[0];
            const sendAtMinute = timetosend.split(':')[1];
            const recurrence_day = req.body.recurrenceDay;
            const recurrence_week = req.body.recurrenceWeek;
            const status = req.body.recurrenceSwitch ? "ACTIVE" : "DISABLED";

            //  insert new Template record
            newTemplate = await models.Template.create({
                name, message, orgId, userId, recurrence, bydateorday, monthday,
                recurrence_date, timetosend, recurrence_day, recurrence_week, status,
                switch: req.body.switch,
            }, { transaction: t });

            if(!newTemplate) throw 'error';

            if(req.body.recurrenceSwitch) {
                //  create job in scheduledTasks
                if(recurrence == 'Annually') {
                    next = moment(recurrence_date).hour(sendAtHour).minute(sendAtMinute).second('00');
                } else if(recurrence == 'Quarterly') {
                    next = moment(recurrence_date).hour(sendAtHour).minute(sendAtMinute).second('00');
                } else if(recurrence == 'Monthly') {
                    let getWeek, getDay;
                    if(bydateorday == 'day') {

                        if(recurrence_week === 0) {
                            getWeek = (moment().add(1, 'months').date(1).week() - 1) || 52;
                        } else {
                            getWeek = moment().date(1).week() + recurrence_week - 1;
                        }

                        getDay = moment().week(getWeek).isoWeekday(recurrence_day);
                    } else {
                        getDay = moment().date(monthday);
                    }

                    next = getDay.hour(sendAtHour).minute(sendAtMinute).second('00');
                } else if(recurrence == 'Weekly') {
                    next = moment().isoWeekday(recurrence_day).hour(sendAtHour).minute(sendAtMinute).second('00');
                } else if(recurrence == 'Birthdays') {
                    next = moment().add(1, 'days').hour(sendAtHour).minute(sendAtMinute).second('00');
                } 


                newScheduledTask = await sequelize.query("INSERT INTO scheduledTasks (`orgId`, `userId`, `templateId`, `switch`, `recurrence`, `recurrence_date`, `bydateorday`, `monthday`, `recurrence_week`, `recurrence_day`, `next`) " +
                                             "VALUES (:orgId, :userId, :templateId, :swtch, :recurrence, :recurrence_date, :bydateorday, :monthday, :recurrence_week, :recurrence_day, :next) ", {
                                                replacements: {
                                                    orgId,
                                                    userId,
                                                    templateId: newTemplate.id,
                                                    swtch: req.body.switch,
                                                    recurrence,
                                                    bydateorday,
                                                    monthday,
                                                    recurrence_date,
                                                    timetosend,
                                                    recurrence_day,
                                                    recurrence_week,
                                                    status: "ACTIVE",
                                                    next: new Date(next),
                                                },
                                                type: sequelize.QueryTypes.INSERT
                                            }, { transaction: t });
            }
        })

        res.send({ 
            status: "success", 
            id: newTemplate.id, 
            createdAt: newTemplate.createdAt 
        })

    } catch(err) {
        console.log('CAUGHT ERROR: ' + JSON.stringify(err));
        console.log('CAUGHT ERROR: ' + err);
        let msg = 'An error occurred.';
        if(err.name == 'SequelizeUniqueConstraintError') msg = 'Name already used. Edit Template name.'
        res.send({ status: "error", msg })
    };

}

exports.update = async (req, res) => {
    let updatedTemplate, updatedScheduledTask;

    try {

        const transaction = await sequelize.transaction(async (t) => { 

            console.log('req.body: ', JSON.stringify(req.body));

            const name = req.body.name;
            const message = req.body.message;
            const orgId = req.user.orgId;
            const userId = req.user.id;
            const recurrence = req.body.recurrence;
            const bydateorday = req.body.byDateOrDay;
            const monthday = req.body.recurrenceMonthDay;
            const recurrence_date = req.body.recurrenceDate;
            const timetosend = req.body.recurrenceTime;
            const sendAtHour = timetosend.split(':')[0];
            const sendAtMinute = timetosend.split(':')[1];
            const recurrence_day = req.body.recurrenceDay;
            const recurrence_week = req.body.recurrenceWeek;
            const status = req.body.recurrenceSwitch ? "ACTIVE" : "DISABLED";

            updatedTemplate = await models.Template.update({
                name, message, orgId, userId, recurrence, bydateorday, monthday,
                recurrence_date, timetosend, recurrence_day, recurrence_week, status,
            }, {
                where: {
                    id: req.body.id
                }
            }, { transaction: t });

            if(!updatedTemplate) throw 'error';

            //  check if scheduledTask already created
            const exists = await sequelize.query("SELECT id FROM scheduledTasks WHERE templateId = :templateId", {
                replacements: {
                    templateId: req.body.id,
                },
                type: sequelize.QueryTypes.SELECT
            });
            if(req.body.recurrenceSwitch) {

                console.log('steeeep: 0');
                //  create job in scheduledTasks
                if(recurrence == 'Annually') {
                console.log('steeeep: 1');
                                next = moment(recurrence_date).hour(sendAtHour).minute(sendAtMinute);
                            } else if(recurrence == 'Quarterly') {
                console.log('steeeep: 2');
                                next = moment(recurrence_date).hour(sendAtHour).minute(sendAtMinute);
                            } else if(recurrence == 'Monthly') {
                console.log('steeeep: 3');
                                let getWeek, getDay;
                                if(bydateorday == 'day') {
                
                console.log('steeeep: 4');
                                    if(recurrence_week === 0) {
                                        getWeek = (moment().add(1, 'months').date(1).week() - 1) || 52;
                                    } else {
                                        getWeek = moment().date(1).week() + recurrence_week - 1;
                                    }
                
                                    getDay = moment().week(getWeek).isoWeekday(recurrence_day);
                                } else {
                                    getDay = moment().date(monthday);
                console.log('steeeep: 5 : ', new Date(getDay), ' - ', monthday);
                                }
                
                                next = getDay.hour(sendAtHour).minute(sendAtMinute);
                console.log('steeeep: 6 :', getDay, ' - ', sendAtHour, ' - ', sendAtMinute);
                            } else if(recurrence == 'Weekly') {
                console.log('steeeep: 7');
                                next = moment().isoWeekday(recurrence_day).hour(sendAtHour).minute(sendAtMinute);
                            } 
                
                console.log('steeeepy: ', next);
                
                if(!exists) {
                    //  create

                    newScheduledTask = await sequelize.query("INSERT INTO scheduledTasks (`orgId`, `userId`, `templateId`, `switch`, `recurrence`, `recurrence_date`, `bydateorday`, `monthday`, `recurrence_week`, `recurrence_day`, `next`) " +
                    "VALUES (:orgId, :userId, :templateId, :swtch, :recurrence, :recurrence_date, :bydateorday, :monthday, :recurrence_week, :recurrence_day, :next) ", {
                       replacements: {
                           orgId,
                           userId,
                           templateId: req.body.id,
                           swth: req.body.switch,
                           recurrence,
                           bydateorday,
                           monthday,
                           recurrence_date,
                           timetosend,
                           recurrence_day,
                           recurrence_week,
                           status: "ACTIVE",
                           next,
                       },
                       type: sequelize.QueryTypes.INSERT
                   }, { transaction: t });
                } else {
                    //  update
                    updatedScheduledTask = await sequelize.query("UPDATE scheduledTasks SET `recurrence` = :recurrence, `recurrence_date` = :recurrence_date, `bydateorday` = :bydateorday, `monthday` = :monthday, `recurrence_week` = :recurrence_week, `recurrence_day` = :recurrence_day, `next` =  :next WHERE templateId = :templateId ", {
                                                        replacements: {
                                                            templateId: req.body.id,
                                                            recurrence,
                                                            bydateorday,
                                                            monthday,
                                                            recurrence_date,
                                                            timetosend,
                                                            recurrence_day,
                                                            recurrence_week,
                                                            status: "ACTIVE",
                                                            next: next.format('YYYY-MM-DD HH:mm:ss'),
                                                        },
                                                        type: sequelize.QueryTypes.UPDATE
                                                    }, { transaction: t });

                }
            } else if(exists) {
                //  destroy
                await sequelize.query("DELETE FROM scheduledTasks WHERE templateId = :templateId", {
                    replacements: {
                        templateId: req.body.id,
                    },
                    type: sequelize.QueryTypes.DELETE
                });    
            }


        })

        res.send({ 
            status: "success", 
            id: req.body.id, 
        })

    } catch(err) {
        console.log('CAUGHT ERROR: ' + JSON.stringify(err));
        console.log('CAUGHT ERROR: ' + err);
        let msg = 'An error occurred.';
        if(err.name == 'SequelizeUniqueConstraintError') msg = 'Name already used. Edit Template name.'
        res.send({ status: "error", msg })
    };

}



