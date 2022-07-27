const express = require("express");
const app = express();
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)
// This is your test secret API key.
const stripe = require("stripe")(process.env.STRIPE_API_KEY);

app.use(express.static("public"));
app.use(express.json());

const calculateOrderAmount = (items) => {
  // Replace this constant with a calculation of the order's amount
  // Calculate the order total on the server to prevent
  // people from directly manipulating the amount on the client
  return Math.round(Math.random() * 10000);
};

app.post("/create-payment-intent", async (req, res) => {
  const { items } = req.body;

  // Create a PaymentIntent with the order amount and currency
  const intent = await stripe.paymentIntents.create({
    amount: calculateOrderAmount(items),
    currency: "usd",
    metadata: { integration_check: 'accept_a_payment' },
  });

  res.json({ client_secret: intent.client_secret });
});

app.post('/stripe-webhook-455698', express.json({ type: 'application/json' }), (request, response) => {

  const event = request.body;
  console.log(event)
  let message = JSON.stringify(event)

  const msg = {
    to: process.env.SENDGRID_API_TO, // Change to your recipient
    from: process.env.SENDGRID_API_FROM, // Change to your verified sender
    subject: 'Stripe Webhook',
    text: message,
    html: message,
  }

  sgMail
    .send(msg)
    .then(() => {
      console.log('Email sent')
    })
    .catch((error) => {
      console.error(error)
    })


  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
      // Then define and call a method to handle the successful payment intent.
      // handlePaymentIntentSucceeded(paymentIntent);
      break;
    case 'payment_method.attached':
      const paymentMethod = event.data.object;
      // Then define and call a method to handle the successful attachment of a PaymentMethod.
      // handlePaymentMethodAttached(paymentMethod);
      break;
    default:
      // Unexpected event type
      console.log(`Unhandled event type ${event.type}.`);
  }

  // Return a 200 response to acknowledge receipt of the event
  response.send();
});

app.listen(4242, () => console.log("Stripe API server listening on port 4242!"));