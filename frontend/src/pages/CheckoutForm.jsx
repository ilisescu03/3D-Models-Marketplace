import { useState } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { completePurchase, getCartItems } from '/backend/users.js';
import { useNavigate } from "react-router-dom";



export default function CheckoutForm({ returnUrl }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements || !isComplete) {
      setMessage("Please complete all required payment fields.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
      redirect: "if_required",
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === "succeeded") {
      try {
      
        const cartResult = await getCartItems();

        if (cartResult.success && cartResult.cart.length > 0) {
        
          const purchaseResult = await completePurchase(cartResult.cart);

          if (purchaseResult.success) {
            setMessage("Payment successful! Your models are now available for download.");
           
            setTimeout(() => navigate("/my-library"), 2000);
          } else {
            setMessage("Payment succeeded but failed to update library: " + purchaseResult.message);
          }
        } else {
          setMessage("Payment succeeded!");
          setTimeout(() => navigate("/my-library"), 2000);
        }
      } catch (err) {
        console.error("Error completing purchase:", err);
        setMessage("Payment succeeded but an error occurred. Please contact support.");
      }
    }

    setLoading(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        maxHeight: "400px",
        overflowY: "auto",
        padding: "10px",
      }}
    >
      <PaymentElement
        onChange={(event) => {
          setIsComplete(event.complete);
        }}
      />

      {message && (
        <p style={{ color: message.startsWith("Payment successful") ? "green" : "red" }}>
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || loading || !isComplete}
        className="complete-purchase-btn"
      >
        {loading ? "Processing..." : "Complete Purchase"}
      </button>
    </form>
  );
}