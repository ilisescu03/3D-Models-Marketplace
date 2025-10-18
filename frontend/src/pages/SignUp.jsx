// SignUp.jsx
// SignUp.jsx
import { useState, useEffect } from "react";
import Header from "../UI+UX/Header";
import validation from "../validations/SignUpValidation.jsx";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from 'firebase/auth';
import { doCreateUserWithEmailAndPassword, doSignInWithGoogle } from "/backend/auth.js";
import { auth } from '/backend/firebase.js';
import CookiesBanner from '../UI+UX/CookiesBanner';
import LoadingScreen from "../UI+UX/LoadingScreen.jsx";

const backgroundStyle = {
    backgroundImage: `url(/background.jpg)`,
    backgroundAttachment: "fixed",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    minHeight: "100vh",
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
};

const formStyle = {
    padding: '20px',
    fontFamily: 'RaleWay, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    margin: '0 auto',
    width: '75%',
    maxWidth: '400px',
    marginTop: '10rem',
    background: 'white',
    borderRadius: '10px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
};

const inputStyle = {
    flex: 1,
    width: '80%',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
    fontSize: '16px',
    outline: 'none',
};

const formRowStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    marginRight: '1rem',
    gap: '1.5rem',
    width: '100%'
};

const labelStyle = {
    fontWeight: 'bold',
    textAlign: 'right',
    width: '100px',
    paddingTop: '10px'
};

const buttonStyle = {
    backgroundColor: 'transparent',
    color: 'black',
    border: '1px solid #ccc',
    marginTop: '10px',
    fontSize: '1.1rem',
    borderRadius: '5px',
    fontWeight: 'bold',
    padding: '5px 10px',
    transition: '0.3s ease',
    cursor: 'pointer',

    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
};

const buttonStyle1 = {
    backgroundColor: 'rgba(151, 151, 151, 1)',
    color: 'white',
    border: 'none',
    marginTop: '10px',
    fontSize: '1rem',
    borderRadius: '5px',
    fontWeight: 'bold',
    padding: '7.5px 15px',
    transition: '0.3s ease',
    cursor: 'pointer',

};

const buttonStyle2 = {
    backgroundColor: 'rgba(255, 123, 0, 1)',
    color: 'white',
    border: 'none',
    marginTop: '20px',
    fontSize: '1rem',
    borderRadius: '5px',
    fontWeight: 'bold',
    padding: '7.5px 15px',
    transition: '0.3s ease',
    cursor: 'pointer',

};

function checkPasswordRules(password) {
    return {
        length: password.length >= 8,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        number: /\d/.test(password),
        specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
}

function SignUp() {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [values, setValues] = useState({
        email: "",
        userName: "",
        password: "",
        submitPassword: "",
        terms: false
    });
    const [errors, setErrors] = useState({});
    const [backendError, setBackendError] = useState("");
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false); //auth state
    const [isAuthLoading, setIsAuthLoading] = useState(true); //loading state for auth check
    const [isSubmitting, setIsSubmitting] = useState(false); //loading state for signup process
    const navigate = useNavigate();

    const rules = checkPasswordRules(values.password);

    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    } , []);

    // Check authentication state on component mount
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user && user.emailVerified) {
                setIsLoggedIn(true);
                setIsAuthLoading(false);
                // Redirect to home if user is already authenticated and not currently submitting
                if (!isSubmitting) {
                    navigate('/');
                }
            } else {
                setIsLoggedIn(false);
                setIsAuthLoading(false);
            }
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, [navigate, isSubmitting]);

    const handleChange = (e) => {
        const { name, type, value, checked } = e.target;
        setValues((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
        if (backendError) setBackendError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true); //prevent redirect during signup process
        setBackendError("");

        const validationErrors = validation(values);
        const hasErrors = Object.values(validationErrors).some((err) => err !== "");

        if (hasErrors) {
            setErrors(validationErrors);
            setIsSubmitting(false);
            return;
        }

        try {
            console.log("Starting signup process...");
            const result = await doCreateUserWithEmailAndPassword(values.userName, values.email, values.password);

            if (result.success) {
                console.log("Signup successful, navigating...");
                setValues({ email: "", userName: "", password: "", submitPassword: "", terms: false });
                setErrors({});
                alert("Check your email to activate your account!");
                navigate("/");
            }
        } catch (error) {
            console.error("Signup error:", error);
            setBackendError(error.message);
            setIsSubmitting(false);
        }
    };

    // Google SignIn
    const handleGoogleSignIn = async () => {
        setIsSubmitting(true); //prevent redirect during Google sign-in process
        
        try {
            const result = await doSignInWithGoogle();

            // VerificÄƒ È™i aici proprietatea 'success'
            if (result.success) {
                navigate("/");
            } else {
                setBackendError(result.message || "Google sign-in failed");
                setIsSubmitting(false);
            }
        } catch (error) {
            console.error(error);
            setBackendError(error.message);
            setIsSubmitting(false);
        }
    }

    const renderRule = (condition, text) => (
        <li style={{
            color: condition ? "green" : "gray",
            fontWeight: condition ? "bold" : "normal",
            listStyle: "none",
            marginBottom: "5px"
        }}>
            {condition ? "✅ " : "○ "} {text}
        </li>
    );

    // Show loading while checking authentication state
    if (isAuthLoading) {
         return <LoadingScreen />;
    }

    // Don't render the form if user is already logged in
    if (isLoggedIn && !isSubmitting) {
        return null; // Component will unmount as navigate('/') is called in useEffect
    }
    if (isSubmitting) {
         return <LoadingScreen />;
    }
    return (
        <div style={backgroundStyle}>
            <Header />
            <CookiesBanner />
            <form onSubmit={handleSubmit} style={{...formStyle, marginTop: windowWidth < 1000 ? '-6rem' : '8rem'}} noValidate>
                <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>Sign Up</h2>

                {backendError && (
                    <p style={{
                        color: "red",
                        fontSize: "0.9rem",
                        textAlign: "center",
                        margin: "0",
                        padding: "10px",
                        backgroundColor: "#ffebee",
                        borderRadius: "5px",
                        border: "1px solid #ffcdd2",
                        width: "100%"
                    }}>
                        {backendError}
                    </p>
                )}

                <div style={formRowStyle}>
                    <label style={labelStyle}>Email:</label>
                    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={values.email}
                            onChange={handleChange}
                            style={{
                                ...inputStyle,
                                border: errors.email ? "2px solid red" : inputStyle.border,
                            }}
                        />
                        {errors.email && <p style={{ color: "red", fontSize: "0.8rem", margin: "5px 0" }}>{errors.email}</p>}
                    </div>
                </div>

                <div style={formRowStyle}>
                    <label style={labelStyle}>Username:</label>
                    <div style={{ flex: 1 }}>
                        <input
                            type="text"
                            name="userName"
                            placeholder="UserName"
                            value={values.userName}
                            onChange={handleChange}
                            style={{
                                ...inputStyle,
                                border: errors.userName ? "2px solid red" : inputStyle.border,
                            }}
                        />
                        {errors.userName && <p style={{ color: "red", fontSize: "0.8rem", margin: "5px 0" }}>{errors.userName}</p>}
                    </div>
                </div>

                <div style={formRowStyle}>
                    <label style={labelStyle}>Password:</label>
                    <div style={{ flex: 1 }}>
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={values.password}
                            onChange={handleChange}
                            onFocus={() => setPasswordFocused(true)}
                            onBlur={() => setPasswordFocused(false)}
                            style={{
                                ...inputStyle,
                                border: errors.password ? "2px solid red" : inputStyle.border,
                            }}
                        />
                        {passwordFocused && (
                            <ul style={{ margin: "5px 0", paddingLeft: "20px", fontSize: "0.9rem" }}>
                                {renderRule(rules.length, "Minimum 8 characters")}
                                {renderRule(rules.lowercase, "At least one lowercase letter")}
                                {renderRule(rules.uppercase, "At least one uppercase letter")}
                                {renderRule(rules.number, "At least one number")}
                                {renderRule(rules.specialChar, "At least one special character")}
                            </ul>
                        )}
                        {errors.password && <p style={{ color: "red", fontSize: "0.8rem", margin: "5px 0" }}>{errors.password}</p>}
                    </div>
                </div>

                <div style={formRowStyle}>
                    <label style={labelStyle}>Confirm password:</label>
                    <div style={{ flex: 1 }}>
                        <input
                            type="password"
                            name="submitPassword"
                            placeholder="Confirm Password"
                            value={values.submitPassword}
                            onChange={handleChange}
                            style={{
                                ...inputStyle,
                                border: errors.submitPassword ? "2px solid red" : inputStyle.border,
                            }}
                        />
                        {errors.submitPassword && <p style={{ color: "red", fontSize: "0.8rem", margin: "5px 0" }}>{errors.submitPassword}</p>}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                    <input
                        type="checkbox"
                        name="terms"
                        checked={values.terms}
                        onChange={handleChange}
                        style={{ width: '16px', height: '16px' }}
                    />
                    <span style={{ fontSize: '0.8rem' }}>
                        <a style={{ textDecoration: 'underline', cursor: 'pointer', color:'orange', fontWeight: 'bold' }} href="/terms&conditions">
                            I accept the terms and conditions
                        </a>
                    </span>
                </div>
                {errors.terms && <p style={{ color: "red", fontSize: "0.8rem", margin: "0" }}>{errors.terms}</p>}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    onMouseEnter={(e) => {
                        if (!isSubmitting) {
                            e.currentTarget.style.backgroundColor = 'rgba(223, 108, 0, 1)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isSubmitting) {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 123, 0, 1)';
                        }
                    }}
                    style={{
                        ...buttonStyle2,
                        backgroundColor: isSubmitting ? 'rgba(255, 200, 150, 1)' : 'rgba(255, 123, 0, 1)',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer'
                    }}
                >
                    {isSubmitting ? "Creating Account..." : "Sign Up"}
                </button>
                
                
                
                <p style={{ fontSize: "0.9rem", fontWeight: "bold", margin: "0" }}>or</p>

                <button
                    type="button"
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(104, 104, 104, 1)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(151, 151, 151, 1)';
                    }}
                    style={buttonStyle1}
                    onClick={() => navigate('/login')}
                >
                    Log In
                </button>

                <button
                    style={buttonStyle}
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isSubmitting}
                    onMouseEnter={(e) => {
                        if (!isSubmitting) {
                            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.07)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isSubmitting) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }
                    }}
                >
                    <img src="./googleIcon.png" alt="Google" style={{ height: '20px' }} />
                    <span style={{ marginLeft: '10px', fontSize: '0.7rem' }}>
                        Continue with Google
                    </span>
                </button>
                
            </form>
        </div>
    )
}

export default SignUp;