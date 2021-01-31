/*


*/
const moment = require('moment');
const sequelize = require('./config/db');
const models = require('./models');
const messageController = require('./controllers/MessageController');
const contactController = require('./controllers/ContactController');

exports.run = () => {
  const intervalmins = 1;  //  minutes
  const interval = intervalmins * 60 * 1000;  //  milliseconds

  console.log('Scheduler running...');

  setInterval(async () => {
    // console.log(`yeeeaaah we're running things.`);
    let now = new Date().getTime();
    let req, res;

    try {

      //  search for all skipped/missed jobs
      let missedJobs = await sequelize.query(
        `SELECT * FROM scheduledtasks WHERE next < NOW()`, {
          type: sequelize.QueryTypes.SELECT,
      }).catch(err => {
        console.log(err)
      })
      console.log(`MISSED JOBS FOUND: ${JSON.stringify(missedJobs)}`);

      //  reschedule all missed jobs
      missedJobs.forEach( async job => {
        const id = job.id;
        const recurrence = job.recurrence;
        let reschedule;

        switch(recurrence) {
          case 'ClearContacts':
            reschedule = "1 DAY";
            break;
        
          case 'Birthdays':
            reschedule = "1 DAY";
            break;
        
          case 'Annually':
            reschedule = "1 YEAR";
            break;
        
          case 'Quarterly':
            reschedule = "3 MONTH";
            break;
        
          case 'Monthly':
            if(job.bydateorday == 'date') reschedule = "1 MONTH";
            else {
              console.log('MONTHLY day');
              let getWeek;

              if(job.recurrence_week === 0) {
                getWeek = (moment().add(2, 'months').date(1).week() - 1) || 52;
              } else {
                getWeek = moment().add(1, 'months').date(1).week() + job.recurrence_week - 1;
              }
              const getDay = moment().week(getWeek).isoWeekday(job.recurrence_day);
              
              console.log('MONTHLY day getDay: ' + getDay);
              reschedule = `${getDay.diff(moment(job.next), 'days')} DAY`;
              console.log('MONTHLY day reschedule: ' + reschedule);
            }
            break;
        
          case 'Weekly':
            reschedule = "1 WEEK";
            break;

          default:
            break;
        }

        //  reschedule jobs
        await reschuduleJob(id, reschedule)
      })

      let jobs = await sequelize.query(
        `SELECT * FROM scheduledtasks WHERE next > NOW() AND next <= DATE_ADD(NOW(), INTERVAL ${intervalmins} MINUTE)`, {
          type: sequelize.QueryTypes.SELECT,
      }).catch(err => {
        console.log(err)
      })

      console.log(`JOBS FOUND: ${JSON.stringify(jobs)}`);
      
      jobs.forEach( async job => {

        const id = job.id;
        const orgId = job.orgId;
        const templateId = job.templateId;
        const recurrence = job.recurrence;

        if(recurrence == 'ClearContacts') {
          req = { purpose: "clearcontacts", body: { orgId } };

          await contactController.clearOld(req, res);

          //  reschedule job
          reschuduleJob(id, "1 DAY")

        } else if(recurrence == 'Birthdays') {
          req = { purpose: "scheduling", body: { templateId, contacts: "birthday_contacts" } };

          let ret = await messageController.scheduledSend(req, res);
          if(ret.status == 'error') console.log('NOT RET');

          //  reschedule job
          reschuduleJob(id, "1 DAY")
          
        } else {
          req = { purpose: "scheduling", body: { contacts: "all_contacts" } };

          let ret = await messageController.scheduledSend(req, res);
          if(ret.status == 'error') console.log('NOT RET');

          //  reschedule job
          let reschedule;
          switch(recurrence) {
            case 'Annually':
              reschedule = "1 YEAR";
              break;
          
            case 'Quarterly':
              reschedule = "3 MONTH";
              break;
          
            case 'Monthly':
              console.log('MONTHLY');
              if(job.bydateorday == 'date') reschedule = "1 MONTH";
              else {
                console.log('MONTHLY day');
                let getWeek;

                if(job.recurrence_week === 0) {
                  getWeek = (moment().add(2, 'months').date(1).week() - 1) || 52;
                } else {
                  getWeek = moment().add(1, 'months').date(1).week() + job.recurrence_week - 1;
                }
                const getDay = moment().week(getWeek).isoWeekday(job.recurrence_day);
                
                console.log('MONTHLY day getDay: ' + getDay);
                reschedule = `${getDay.diff(moment(job.next), 'days')} DAY`;
                console.log('MONTHLY day reschedule: ' + reschedule);
              }
              break;
          
            case 'Weekly':
              reschedule = "1 WEEK";
              break;

            default:
              break;
          }
    
          reschuduleJob(id, reschedule)
    
        }

      })

      async function reschuduleJob (jid, nextSchedule) {
        if(nextSchedule == "_dayMonthly") {

          await sequelize.query(
            `UPDATE scheduledTasks SET next = DATE_ADD(next, INTERVAL ${nextSchedule}) WHERE id = ${jid}`, {
              type: sequelize.QueryTypes.UPDATE,
          }).catch(err => {
            console.log(err)
          })
        } else {
          await sequelize.query(
            `UPDATE scheduledTasks SET next = DATE_ADD(next, INTERVAL ${nextSchedule}) WHERE id = ${jid}`, {
              type: sequelize.QueryTypes.UPDATE,
          }).catch(err => {
            console.log(err)
          })
        }
      }

    } catch(err) {
      console.log(err)
    }

  }, interval)
}

exports.stop = () => {

}