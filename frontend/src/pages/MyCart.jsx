import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../UI+UX/Header";

import { useAuth } from '/backend/contexts/authContext/index.jsx';
import CookiesBanner from '../UI+UX/CookiesBanner';
import { getCartItems, removeFromCart } from '/backend/users.js';
import { getModelById } from '/backend/models.js';
import LoadingScreen from '../UI+UX/LoadingScreen.jsx';
import '/frontend/css/MyCart.css';
import { loadStripe } from "@stripe/stripe-js";
import {Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import CheckoutForm from "./CheckoutForm.jsx"; './CheckoutForm.jsx';
const stripePromise = loadStripe(import.meta.env.VITE_REACT_APP_STRIPE_PUBLISHABLE_KEY);
function MyCart() {

    const [clientSecret, setClientSecret] = useState("");

    const stripe = useStripe();
    const elements = useElements();

    const [message, setMessage] = useState(null);
    const [isStripeLoading, setIsStripeLoading] = useState(false);

    const { currentUser, userLogedIn } = useAuth();
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalPrice, setTotalPrice] = useState(0);
    const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false); // State for payment form
    useEffect(() => {
        // replace this with your own server endpoint
        fetch("http://localhost:4242/create-payment-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: [{}] }),
        })
            .then((res) => {
                if (!res.ok) {
                    throw new Error("Network response was not ok");
                }
                return res.json();
            })
            .then((data) => setClientSecret(data.clientSecret))
            .catch((error) => {
                console.log(error);
            });
    }, []);
    const options = {
        clientSecret,
    };
    useEffect(() => {
        if (!stripe) {
            return;
        }

        const clientSecret = new URLSearchParams(window.location.search).get(
            "payment_intent_client_secret"
        );

        if (!clientSecret) {
            return;
        }

        stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
            setMessage(paymentIntent.status === "succeeded" ? "Your payment succeeded" : "Unexpected error occurred");
        });
    }, [stripe]);
    // Redirect if not logged in
    useEffect(() => {
        if (!userLogedIn) {
            navigate('/');
        }
    }, [userLogedIn, navigate]);

    // Fetch cart items
    useEffect(() => {
        if (currentUser) {
            loadCartDetails();
        }
    }, [currentUser]);

    // Calculate total price
    useEffect(() => {
        const total = cartItems.reduce((sum, item) => sum + (item.price || 0), 0);
        setTotalPrice(total);
    }, [cartItems]);
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsStripeLoading(true);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: "http://localhost:3000",
            }
        });

        if (error && (error.type === "card_error" || error.type === "validation_error")) {
            setMessage(error.message);
        }

        setIsStripeLoading(false);
    };
    const loadCartDetails = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await getCartItems();

            if (result.success) {
                const detailedItems = await Promise.all(
                    result.cart.map(async (modelId) => {
                        const modelResult = await getModelById(modelId);
                        return modelResult.success ? modelResult.model : null;
                    })
                );
                setCartItems(detailedItems.filter(item => item !== null));
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError("Failed to load cart items.");
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFromCart = async (modelId) => {
        const result = await removeFromCart(modelId);
        if (result.success) {
            setCartItems(prevItems => prevItems.filter(item => item.id !== modelId));
        } else {
            alert(`Error: ${result.message}`);
        }
    };

    const handleCardPaymentClick = () => {
        setIsPaymentFormOpen(true); // Open the modal
    };

    const handlePayPalClick = () => {
        // Does nothing for now
    };

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <div style={{ backgroundColor: '#f1f1f1ff', minHeight: '100vh' }}>
            <Header />
            <CookiesBanner />
            <div className="cart-container">
                <h1>Shopping Cart</h1>
                {error && <div className="error-message">{error}</div>}
                {cartItems.length > 0 ? (
                    <div className="cart-layout">
                        {/* Cart Items */}
                        <div className="cart-items-list">
                            {cartItems.map(item => (
                                <div key={item.id} className="cart-item-card">
                                    <img
                                        src={item.previewImages?.[0] || '/default-model-preview.png'}
                                        alt={item.title}
                                        className="cart-item-thumbnail"
                                        onClick={() => navigate(`/model/${item.id}`)}
                                    />
                                    <div className="cart-item-details">
                                        <h3 className="cart-item-title" onClick={() => navigate(`/model/${item.id}`)}>{item.title}</h3>
                                        <p className="cart-item-creator">by <a href={`/user/${item.creatorUsername}`}>{item.creatorUsername}</a></p>
                                    </div>
                                    <div className="cart-item-actions">
                                        <p className="cart-item-price">€{item.price.toFixed(2)}</p>
                                        <button onClick={() => handleRemoveFromCart(item.id)} className="remove-from-cart-btn">Remove</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order Summary & Payment */}
                        <div className="order-summary">
                            <h3>Summary</h3>
                            <div className="summary-row">
                                <span>Subtotal</span>
                                <span>€{totalPrice.toFixed(2)}</span>
                            </div>
                            <div className="summary-row total">
                                <span>Total</span>
                                <span>€{totalPrice.toFixed(2)}</span>
                            </div>
                            <div className="payment-section-cart">
                                <div className="payment-methods">
                                    <span className="payment-methods-title">Payment Method</span>
                                    <button className="payment-button card-payment" onClick={handleCardPaymentClick}>
                                        <div className="payment-logos">
                                            <img src="/visa.svg" alt="Visa" />
                                            <img src="/mastercard.svg" alt="Mastercard" />
                                            <img src="/maestro.png" alt="Maestro" />
                                            <img src="/paytm.svg" style={{ height: '15px' }} alt="Paytm" />
                                        </div>
                                        <span>Pay with new credit or debit card</span>
                                    </button>
                                    <button className="payment-button paypal-payment" onClick={handlePayPalClick}>
                                        <div className="payment-logos">
                                            <img src="/paypal.svg" style={{ height: '50px' }} alt="PayPal" />
                                        </div>
                                        <span>Pay through PayPal</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="empty-cart-message">

                        <p>Your cart is empty.</p>
                    </div>
                )}
            </div>

            {/* === PAYMENT FORM MODAL START === */}
            <div
                className={`payment-form-overlay ${isPaymentFormOpen ? 'open' : ''}`}
                onClick={() => setIsPaymentFormOpen(false)}
            >
                <div
                    className={`payment-form-content ${isPaymentFormOpen ? 'open' : ''}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button className="close-payment-form" onClick={() => setIsPaymentFormOpen(false)}>
                        <svg width="24" height="24" viewBox="0 0 24 24">
                            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" />
                            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    </button>

                    <h3>Card Details</h3>

                    {/* Stripe PaymentElement */}
                    {clientSecret && (
                        <Elements stripe={stripePromise} options={{ clientSecret }}>
                            <CheckoutForm returnUrl="http://localhost:5173/my-cart" />
                        </Elements>
                    )}
                </div>
            </div>
            {/* === PAYMENT FORM MODAL END === */}



        </div>
    );
}

export default MyCart;