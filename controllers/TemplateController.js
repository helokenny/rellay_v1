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
    let newTemplate, newScheduledTask;

    try {

        const transaction = await sequelize.transaction(async (t) => { 

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
            }, { transaction: t });

            if(!newTemplate) throw 'error';

            //  create job in scheduledTasks
            if(recurrence == 'Annually') {
                next = moment(recurrence_date).hour(sendAtHour).minute(sendAtMinute);
            } else if(recurrence == 'Quarterly') {
                next = moment(recurrence_date).hour(sendAtHour).minute(sendAtMinute);
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

                next = getDay.hour(sendAtHour).minute(sendAtMinute);
            } else if(recurrence = 'Weekly') {
                next = moment().isoWeekday(recurrence_day).hour(sendAtHour).minute(sendAtMinute);
            } 


            newScheduledTask = await sequelize.query("INSERT INTO scheduledTasks (`orgId`, `userId`, `recurrence`, `recurrence_date`, `bydateorday`, `monthday`, `recurrence_week`, `recurrence_day`, `next`) " +
                                             "VALUES (:orgId, :userId, :recurrence, :recurrence_date, :bydateorday, :monthday, :recurrence_week, :recurrence_day, :next) ", {
                                                replacements: {
                                                    orgId,
                                                    userId,
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



