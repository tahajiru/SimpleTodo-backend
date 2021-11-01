const express = require("express");
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET);
const User = require("../models/User");
const passport = require("passport");
const jwtDecode = require("jwt-decode");

const attachUser = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: "Authentication invalid" });
    }
    const decodedToken = jwtDecode(token);

    if (!decodedToken) {
        return res.status(401).json({
            message: "There was a problem authorizing the request",
        });
    } else {
        req.userId = decodedToken.sub;
        next();
    }
};

router.use(attachUser);

//Create Customer 
router.post("/createCustomer",
    passport.authenticate("jwt", { session: false }),
    async (req, res) => {

        try {
            const userId = req.userId;

            const user = await User.findOne({ _id: userId });

            let customerId = user.payment.customerId;

            //If stripe customer not created
            if (!user.payment.customerId) {
                // Create a new customer object
                const customer = await stripe.customers.create({
                    email: user.email,
                });

                customerId = customer.id;
            }

            // Create the subscription. Note we're expanding the Subscription's
            // latest invoice and that invoice's payment_intent
            // so we can pass it to the front end to confirm the payment
            const subscription = await stripe.subscriptions.create({
                customer: customerId,
                items: [{
                    price: req.body.priceId,
                }],
                payment_behavior: 'default_incomplete',
                expand: ['latest_invoice.payment_intent'],
            });

            //Save the customer to db
            await User.findOneAndUpdate({ _id: userId }, { "payment.customerId": customerId, "payment.subscriptionId": subscription.id });
            res.status(200).json({
                success: true,
                clientSecret: subscription.latest_invoice.payment_intent.client_secret,
            });
        } catch (err) {
            console.log(err);
        }

    })

//Create Customer 
router.post("/updatePaymentStatus",
    passport.authenticate("jwt", { session: false }),
    async (req, res) => {

        try {
            const userId = req.userId;

            const user = await User.findOneAndUpdate({ _id: userId }, {
                "payment.status": req.body.status
            });

            res.status(200).json({
                success: true,
            });


        } catch (error) {
            console.log(error)
        }

    })

module.exports = router;

