const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const express = require("express");
const cors = require("cors")({ origin: true });
const Stripe = require("stripe");

const stripeSecret = defineSecret("STRIPE_SECRET_KEY");

const app = express();
app.use(cors);
app.use(express.json());

const calculateOrderAmount = (items) => {
  const total = items.reduce((sum, item) => sum + (item.price || 0), 0);
  return Math.round(total * 100); 
};

app.post("/create-payment-intent", async (req, res) => {
  try {
    const { items } = req.body;
    const stripe = new Stripe(stripeSecret.value());

    const paymentIntent = await stripe.paymentIntents.create({
      amount: calculateOrderAmount(items), //
      currency: "eur", 
      automatic_payment_methods: { enabled: true },
    });

    res.send({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Stripe error:", error);
    res.status(500).send({ error: error.message });
  }
});

exports.api = onRequest({ secrets: ["STRIPE_SECRET_KEY"] }, app);