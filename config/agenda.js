const Agenda = require("agenda");
const { sendEmail } = require("../lib/utils");

let agenda = new Agenda({
  db: {
    address: process.env.DB_CONNECT,
    collection: "agendaJobs",
  },
});

agenda.define("send reminders", async (job) => {
  const { to, task } = job.attrs.data;

  const emailSubject = "Reminder from SimpleTodo";

  const emailMessage = `
  <h3>Reminder</h3>
  <p>Task to be completed: ${task}</p> 
  `;

  //Send mail
  sendEmail(to, emailSubject, emailMessage);
});

module.exports = agenda;
