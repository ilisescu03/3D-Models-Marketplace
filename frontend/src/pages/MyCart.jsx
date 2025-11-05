import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../UI+UX/Header";

import { useAuth } from '/backend/contexts/authContext/index.jsx';
import CookiesBanner from '../UI+UX/CookiesBanner';
import { getCartItems, removeFromCart } from '/backend/users.js';
import { getModelById } from '/backend/models.js';
import LoadingScreen from '../UI+UX/LoadingScreen.jsx';
import '/frontend/css/MyCart.css';

function MyCart() {
    const { currentUser, userLogedIn } = useAuth();
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalPrice, setTotalPrice] = useState(0);
    const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false); // State for payment form

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
            <div className={`payment-form-overlay ${isPaymentFormOpen ? 'open' : ''}`} onClick={() => setIsPaymentFormOpen(false)}>
                <div className={`payment-form-content ${isPaymentFormOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
                    <button className="close-payment-form" onClick={() => setIsPaymentFormOpen(false)}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <h3>Card Details</h3>
                    <div className="form-group-payment">
                        <label>Card Number</label>
                        <input type="text" placeholder="**** **** **** ****" />
                    </div>
                    <div className="form-row-payment">
                        <div className="form-group-payment">
                            <label>Expiry Date</label>
                            <input type="text" placeholder="MM / YY" />
                        </div>
                        <div className="form-group-payment">
                            <label>CVC</label>
                            <input type="text" placeholder="123" />
                        </div>
                    </div>
                    <div className="form-group-payment">
                        <label>Cardholder Name</label>
                        <input type="text" placeholder="John Doe" />
                    </div>
                    <button className="complete-purchase-btn" onClick={() => alert('Purchase logic not implemented yet.')}>
                        Complete Purchase
                    </button>
                </div>
            </div>
            {/* === PAYMENT FORM MODAL END === */}

        
        </div>
    );
}

export default MyCart;