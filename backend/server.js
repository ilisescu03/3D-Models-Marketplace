import "dotenv/config";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import Stripe from "stripe";

const app = express();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(bodyParser.json());

const calculateOrderAmount = (items) => {
  const total = items.reduce((sum, item) => sum + (item.price || 0), 0);
  return Math.round(total * 100); 
};

app.post("/create-payment-intent", async (req, res) => {
  try {
    const { items } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: calculateOrderAmount(items),
      currency: "eur", 
      automatic_payment_methods: { enabled: true },
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Stripe error:", error);
    res.status(500).send({ error: error.message });
  }
});

app.listen(4242, () => console.log("Server running on port 4242"));