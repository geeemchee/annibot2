const { Pool, Client } = require('pg');
const data = require('./data');
const Telegram = require('telegraf/telegram')
const telegram = new Telegram(data.token, { webhookReply: true })
const pool = new Pool({
    user: data.user,
    host: data.host,
    database: data.database,
    password: data.password,
    port: data.port,
})

async function sendMessageToAll(d) {
    let arrLength = d.length;
    for(i=0;i<arrLength;i++){
    telegram.sendMessage(d[i].userid, 'Less than one week is left to your Anniversary!')
    }
    
}

async function returnAnniv(currentMonth, currentDate) {
    await pool.query(`ALTER TABLE annibot_users ALTER COLUMN datedate TYPE integer USING datedate::integer`);
    const test = await pool.query(`
    SELECT userid
    FROM annibot_users
    WHERE '${currentMonth}' = datemonth
    AND '${currentDate}' >= datedate-7
    AND '${currentDate}' <= datedate`)
    console.log('returnAnniv result', test);
    return test.rows
}
async function returnAnniv1(currentMonth, remaining) {
    await pool.query(`ALTER TABLE annibot_users ALTER COLUMN datedate TYPE integer USING datedate::integer`);
    console.log(currentMonth, remaining, 'in returnAnniv1');
    const test = await pool.query(`
    SELECT userid
    FROM annibot_users
    WHERE '${currentMonth}' = datemonth
    AND '${remaining}'<= 7-datedate
    `)
    console.log('returnAnniv result', test);
    return test.rows
}

async function getRemainingDays(year, month, today) {
    console.log(month);
    let days = new Date(year, month, 0).getDate()
    console.log(today,days)
    remaining = days-today;
    if(remaining<7) return [1, remaining]
    else return [0,remaining]
}

async function updatePeopleById(userId, d) { //d is the userDetail
    const test = await pool.query(`
    SELECT CASE WHEN EXISTS (
        SELECT *
        FROM annibot_users
        WHERE userid = ${userId} AND people is NULL
    )
    THEN 1
    ELSE 0 END
    `);// Find rows with people = null with userId

    console.log('updatePeopleById triggered')
    //console.log(test.rows[0]);
    testCase = test.rows[0].case;
    //console.log(testCase);
    if (testCase == 1) {
        console.log(d.people, userId);
        return await pool.query(`
      UPDATE annibot_users
      SET people='${d.people}'
      WHERE userid=${userId} 
      AND people IS NULL
    `)
    }
    else {
        const values = [userId, d.people]
        return pool.query(`INSERT INTO annibot_users(userid, people) VALUES($1,$2) RETURNING*`, values, (error, results) => {
            if (error) {
                throw error
            }
        })
    }
    ;

}
async function checkDateMonthById(userid, m) {
    console.log('in checkdatemonthbyid function', typeof (m))
    const test = await pool.query(`
    SELECT CASE WHEN EXISTS (
        SELECT *
        FROM annibot_users
        WHERE userid = ${userid} AND datemonth IS NULL
    )
    THEN 1
    ELSE 0 END
    `);
    testCase = test.rows[0].case;
    console.log('in checkdatemonthbyid function', typeof (m))
    let testEdit = m.editMode
    let testResult = testCase + testEdit;

    //console.log(testCase), 1 = there is user id row where datemonth is empty
    return testResult
}

async function checkById(userid) {
    const test = await pool.query(`
    SELECT CASE WHEN EXISTS (
        SELECT *
        FROM annibot_users
        WHERE userid = ${userid}
    )
    THEN 1
    ELSE 0 END
    `);
    testCase = test.rows[0].case;
    //console.log(testCase), 1 = there is user id row
    return testCase
}
//console.log(testCase);

async function updateDateMonthById(userid, d) { //d is the userDetail
    console.log(d)
    return await pool.query(`
      UPDATE annibot_users
      SET datemonth='${d.datemonth}'
      WHERE userid=${userid}
    `)
};

async function deleteById(userid) { //d is the userDetail
    return await pool.query(`
      DELETE FROM annibot_users
      WHERE userid=${userid}
    `)
};

async function updateDateDateById(userid, d) { //d is the userDetail
    console.log(d)
    return await pool.query(`
      UPDATE annibot_users
      SET datedate='${d.datedate}'
      WHERE userid=${userid}
    `)
};
class UserDetails {
    constructor(userid, datemonth, datedate, editMode) {
        this.userid = userid; // using uncaps letters because it is used in queries
        this.datemonth = datemonth;
        this.datedate = datedate;
        this.editMode = editMode;
    }

}

module.exports = {
    showAllPeople: "Select * From annibot_users",
    addNewUser: `INSERT INTO annibot_users(userid) VALUES($1) RETURNING*`
}
module.exports.returnAnniv = returnAnniv;
module.exports.returnAnniv1 = returnAnniv1;
module.exports.updatePeopleById = updatePeopleById;
module.exports.updateDateMonthById = updateDateMonthById;
module.exports.updateDateDateById = updateDateDateById;
module.exports.checkDateMonthById = checkDateMonthById;
module.exports.checkById = checkById;
module.exports.deleteById = deleteById;
module.exports.UserDetails = UserDetails;
module.exports.getRemainingDays = getRemainingDays;
module.exports.sendMessageToAll = sendMessageToAll