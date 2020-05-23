const Telegraf = require('telegraf');
const cron = require("node-cron");
const data = require('./data');
const bot = new Telegraf(data.token);
const Markup = require('telegraf/markup');
const { Pool, Client } = require('pg');
const queries = require('./queries');
const { UserDetails } = require('./queries');

const pool = new Pool({
    user: data.user,
    host: data.host,
    database: data.database,
    password: data.password,
    port: data.port,
})

bot.start(async (ctx) => {
    const userid = ctx.chat.id;
    const userName = ctx.chat.first_name;
    const values = [userid];
    const test = await queries.checkById(userid);
    //console.log(test)
    if (test !== 0) {
        return await ctx.reply(`Hi ${userName}, welcome to Annibot! What do you want to do with your Anniversary?`, Markup
            .keyboard(['/add', '/edit', '/delete'])
            .oneTime()
            .resize()
            .extra())
    }
    pool.query(queries.addNewUser, values, (error, results) => {
        if (error) {
            throw error
        }
        else {
            return ctx.reply(`Hi ${userName}, welcome to Annibot! What do you want to do with your Anniversary?`, Markup
                .keyboard(['/add', '/edit', '/delete'])
                .oneTime()
                .resize()
                .extra()
            )
        }
    })
})



bot.command('/add', async (ctx) => {
    const userid = ctx.chat.id;

    ctx.reply(`Which month is your anniversary on?`, Markup
        .keyboard(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'])
        .oneTime()
        .resize()
        .extra()
    )

    await bot.hears(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], async (ctx) => {
        const id = ctx.chat.id
        const msg = ctx.message.text
        //console.log(typeof (msg))
        const m = new UserDetails(id, msg, null, 0)
        console.log('add -> hear', m);
        //const test = await queries.checkDateMonthById(userid, m);
        //console.log(test)

        await queries.updateDateMonthById(userid, m);
        var dateArray = [];
        for (var i = 1; i <= 31; i++) {
            dateArray.push(`${i}`);
        }
        await ctx.reply(`Which date is your anniversary on?`, Markup
            .keyboard(dateArray)
            .oneTime()
            .resize()
            .extra()
        )
        await bot.hears(dateArray, async (ctx) => {
            const id = ctx.chat.id
            const date = ctx.message.text;
            console.log(date);
            const d = new UserDetails(id, null, date, null);
            await queries.updateDateDateById(id, d);
            return await ctx.reply('Anniversary date saved successfully')
        })
    })
})

bot.command('/edit', async (ctx) => {

    ctx.reply(`Which month is your anniversary on?`, Markup
        .keyboard(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'])
        .oneTime()
        .resize()
        .extra()
    )

    await bot.hears(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], async (ctx) => {
        const id = ctx.chat.id
        const msg = ctx.message.text
        //  console.log(typeof (msg))
        const m = new UserDetails(id, msg, null, 1)
        const userid = ctx.chat.id;
        console.log('edit mode -> m', m)
        //const test = await queries.checkDateMonthById(userid, m);
        //console.log(test)
        console.log(userid);
        await queries.updateDateMonthById(userid, m);
        var dateArray = [];
        for (var i = 1; i <= 31; i++) {
            dateArray.push(`${i}`);
        }
        await ctx.reply(`Which date is your anniversary on?`, Markup
            .keyboard(dateArray)
            .oneTime()
            .resize()
            .extra()
        )
        await bot.hears(dateArray, async (ctx) => {
            const id = ctx.chat.id
            const date = ctx.message.text;
            console.log(date);
            const d = new UserDetails(id, null, date);
            await queries.updateDateDateById(id, d);
            return await ctx.reply('Anniversary date saved successfully')
        })
    })
})

bot.command('/delete', async (ctx) => {
    const id = ctx.chat.id;
    await queries.deleteById(id);
    return await ctx.reply(`Your account was deleted. To start again, press /start`, Markup
        .keyboard(['/start'])
        .oneTime()
        .resize()
        .extra()
    )
})

cron.schedule("* * * * *", async function () {
    console.log("running a task every minute");
    //checking for remaining date < 7
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let current_datetime = new Date()

    let currentDate = current_datetime.getDate()
    let currentYear = current_datetime.getFullYear()
    //console.log(currentMonth, currentDate);

    let test = await queries.getRemainingDays(currentYear, current_datetime.getMonth() + 1, currentDate);
    console.log(test, 'test result');

    let currentMonth = months[current_datetime.getMonth() + test[0]]
    console.log(currentMonth);
    if (test[0] === 0) { //remaining days to the month > 7
        const annibotAlert = await queries.returnAnniv(currentMonth, currentDate).then((res) => { return res }).catch((err) => { return err });
        console.log(annibotAlert, typeof (annibotAlert));
        return queries.sendMessageToAll(annibotAlert)
    }
    else {//remaining days to the month < 7
        const annibotAlert = await queries.returnAnniv1(currentMonth, test[1]).then((res) => { return res }).catch((err) => { return err });
        console.log(annibotAlert, typeof (annibotAlert));
        return queries.sendMessageToAll(annibotAlert)
    }

});
bot.launch()