import { useState } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

export default function CheckoutForm({ returnUrl }) {
  const stripe = useStripe();
  const elements = useElements();

  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false); // ✅ state pentru completarea datelor

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements || !isComplete) {
      // dacă datele nu sunt complete, nu facem nimic
      setMessage("Please complete all required payment fields.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
    });

    if (error) {
      setMessage(error.message);
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
    maxHeight: "400px", // ✅ limita înălțimea formularului
    overflowY: "auto",  // ✅ permite scroll
    padding: "10px",
  }}>
      <PaymentElement
        onChange={(event) => {
          setIsComplete(event.complete); // ✅ updatează dacă datele sunt complete
        }}
      />

      {message && <p style={{ color: "red" }}>{message}</p>}

      <button
        type="submit"
        disabled={!stripe || loading || !isComplete} // ✅ dezactivează până datele sunt complete
        className="complete-purchase-btn"
      >
        {loading ? "Processing..." : "Complete Purchase"}
      </button>
    </form>
  );
}
