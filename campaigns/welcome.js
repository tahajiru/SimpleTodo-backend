function welcomeEmails(name) {
    const emails = [
        {
            subject: "Start organizing life with SimplyDone",
            body: `<center><h3>Welcome to SimplyDone, ${name}</center></h3>

            <p>
                We are on a mission to help people feel more organized and get control of their work and life - we hope that we can do the same for you.<br>
            </p>
            
            <p>
                What you can do with SimplyDone?
                <ul>
                    <li>Add tasks and reminder. Never lose track of your to-do list.</li>
                    <li>Use list and priority to make tasks more organized.</li>
                    <li>Collaborate on shared lists with your family, friends, and colleagues.</li>
                </ul>
            </p>
            
            <p>
                If you need any help, we are always around. 
                Reply to this mail or reach out to us at <a href="support@simplydone.in">support@simplydone.in</a>
            </p>
            
            <p>
            Taha <br>
            Founder of SimplyDone
            </p>
            `,
            time: "3 hours"

        },

        {
            subject: "Do you know about this feature?",
            body: `
            <p>
                You can use markdown to your task more readable.
                <ul>
                    <li>To make it bold  - *Your Text Here*</li>
                    <li>To make it italics - _Your Text Here_</li>
                    <li>For custom link text - [link Text](link)</li>
                </ul>
            </p>

            <p>
                If you need any help, we are always around. 
                Reply to this mail or reach out to us at <a href="support@simplydone.in">support@simplydone.in</a>
            </p>
            
            <p>
            Taha <br>
            Founder of SimplyDone
            </p>
            `,
            time: "3 days"

        },

        {
            subject: "SimplyDone is always with you, everywhere.",
            body: `
            
            <p>
                In a meeting. At the airport. Out with friends. SimplyDone is always with you.<br>
            </p>

            <p>
                Add tasks on your phone and manage them from your computer, or vice-versa. SimplyDone remains synced across all the devices, so you don’t loose track of what needs to be done.
            </p>
            
            <p>
            Taha <br>
            Founder of SimplyDone
            </p>
            `,
            time: "7 days"

        },
    ]

    return emails;
}

module.exports.welcomeEmails = welcomeEmails;