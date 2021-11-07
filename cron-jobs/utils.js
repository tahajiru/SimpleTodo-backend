const { MongoClient } = require("mongodb");
const cron = require('node-cron');
const { subDays, isBefore } = require("date-fns")
const Task = require("../models/Task");
const List = require("../models/List");
const User = require("../models/User");


// Create a new MongoClient
const client = new MongoClient(process.env.DB_CONNECT, { useUnifiedTopology: true });


async function cleanReminderJobs() {
    try {
        // Connect the client to the server
        await client.connect();

        //Clean Reminder Jobs
        const res = await client.db("SimpleTodoDatabase").collection("agendaJobs").deleteMany({ nextRunAt: null })

        console.log(`${res.deletedCount}`)

    } finally {
        // Ensures that the client will close when you finish/error
        console.log("Close Connection")
        await client.close();
    }
}

cron.schedule('0 0 * * *', async function () {
    await cleanReminderJobs()
});

cron.schedule('0 0 * * *', async function () {
    await removeCompletedTasksAfterSevenDays()
});

cron.schedule('1 0 * * *', async function () {
    await deleteOrphanTasks()
});

cron.schedule('2 0 * * *', async function () {
    await deleteOrphanLists()
});

async function removeCompletedTasksAfterSevenDays() {

    const users = await User.find({}).populate({
        path: "lists",
        populate:
        {
            path: "tasks",
            select: [
                "_id",
                "completed",
                "completionDate",
            ],
        },
    });

    users.forEach((user) => {
        //User that has free plan
        if (user.payment.status !== "paid") {

            //Loop through all lists
            user.lists.forEach((list) => {
                //Loop through all tasks
                list.tasks.forEach(async (task) => {
                    if (task.completed && task.completionDate && isBefore(task.completionDate, subDays(new Date(), 7))) {
                        //Delete the task
                        await Task.findOneAndDelete({ _id: task._id });

                        //Remove the  task from list
                        await List.findOneAndUpdate(
                            { _id: list._id },
                            { $pull: { tasks: task._id } }
                        );
                    }
                })
            })
        }
    })
}

async function deleteUser(userId) {
    const user = await User.find({ _id: userId }).populate({
        path: "lists",
        populate:
        {
            path: "tasks",
            select: [
                "_id",
            ],
        },
    });

    //Loop through all lists
    user[0].lists.forEach(async (list) => {

        // Loop through all tasks
        list.tasks.forEach(async (task) => {

            console.log(`List Id: ${list._id} --> Task Id: ${task._id} `)
            //Delete the task
            await Task.findOneAndDelete({ _id: task._id });
        })

        //Delete the list
        await List.findOneAndDelete({ _id: list._id });
    })

    //Delete User
    await user[0].deleteOne();
}

async function deleteOrphanTasks() {
    const tasks = await Task.find({});

    tasks.forEach(async (task) => {

        const list = await List.find({ tasks: task._id });

        //Delete the orphan tasks
        if (list.length === 0) {
            task.deleteOne();
        }
    })
}

async function deleteOrphanLists() {
    const lists = await List.find({});

    lists.forEach(async (list) => {

        const user = await User.find({ lists: list._id });

        //Delete the orphan list
        if (user.length === 0) {
            list.deleteOne();
        }
    })
}