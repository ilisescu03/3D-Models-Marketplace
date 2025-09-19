import { useState, useEffect } from "react";
import Header from "../UI+UX/Header";
import validation from "../validations/LogInValidation.jsx";
import {auth, db} from '/backend/firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { doSignInWithEmailAndPassword, doSignOut, doSignInWithGitHub, doSignInWithGoogle } from "/backend/auth.js";
import { useNavigate } from "react-router-dom";
import CookiesBanner from '../UI+UX/CookiesBanner';

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
    justifyContent: 'center', // center vertical
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
}
const inputStyle = {
    flex: 1,
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
    fontSize: '16px',
    outline: 'none',
}
const formRowStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    marginRight: '1rem',
    gap: '1.5rem'
}
const labelStyle = {
    fontWeight: 'bold',
    textAlign: 'right',
    width: '100px',

}
//Style for Log In with Google or GitHub
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
    cursor: 'pointer'
}
//Style for Log In
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
    
}
//Style for Sign Up
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
    cursor: 'pointer'
}
function LogIn() {
    const [values, setValues] = useState({ email: "", password: "" }); //form values
    const [errors, setErrors] = useState({}); //form errors
    const [loginError, setLoginError] = useState(""); //login error from firebase
    const navigate = useNavigate(); //navigation hook

    //Input change handler

    const handleChange = (e) => {
        setValues({ ...values, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: "" });
        setLoginError("");
    };

    //Form submit handler

    const handleSubmit = async (e) => {
        e.preventDefault(); //prevent default form submission behavior
        const validationErrors = validation(values); //validate form values

        //If there are validation errors, set them in state

        if (validationErrors.email || validationErrors.password) {
            setErrors(validationErrors);
        } else {

            //If no validation errors, proceed with Firebase authentication

            try {

                // Attempt to sign in the user

                const userCredential = await doSignInWithEmailAndPassword(values.email, values.password);
                const user = userCredential.user;

                await new Promise(res => setTimeout(res, 1000)); // Wait for 1 second to ensure email verification status is updated
                await user.reload();

                // Check if email is verified

                if (!user.emailVerified) {
                    await doSignOut();
                    setLoginError("You have to verify your email before logging in.");
                    return;
                }


                // If sign-in is successful and email is verified, navigate to home page

                navigate('/');
                console.log("Login successful", user);
                setValues({ email: "", password: "" }); // Clear form values
                setErrors({}); // Clear form errors
                setLoginError(""); // Clear login error

            } catch (err) {
                // Handle Firebase authentication errors
                console.error(err);

                if (err.code === "auth/user-not-found") {
                    setLoginError("This email doesn't exist.");
                } else if (err.code === "auth/wrong-password") {
                    setLoginError("This password is wrong.");
                } else if (err.code === "auth/invalid-credential") {
                    setLoginError("Wrong email or password!");
                }
                else {
                    setLoginError(err.message || "Authentification error.");
                }
            }
        }
    };

    // Google SignIn
const handleGoogleSignIn = async () => {
    try {
        const result = await doSignInWithGoogle();
        
        // Verifică și aici proprietatea 'success'
        if (result.success) {
            navigate("/");
        } else {
            setLoginError(result.message || "Google sign-in failed");
        }
    } catch (error) {
        console.error(error);
        setLoginError(error.message);
    }
}

    //GitHub SignIn
const handleGitHubSignIn = async () => {
  try {
    setLoginError("");
    
    const result = await doSignInWithGitHub();
    
    if (result.success) {
      console.log("GitHub signin successful");
      
      // Wait a moment and check if user is still logged in
      setTimeout(() => {
        if (auth.currentUser) {
          console.log("User is authenticated, navigating...");
          navigate("/");
        } else {
          console.log("User was signed out after GitHub sign-in");
          setLoginError("Authentication failed. Please try again.");
        }
      }, 1000);
    } else {
      console.log("GitHub signin failed:", result.message);
      setLoginError(result.message || "GitHub sign-in failed"); 
    }
  } catch (error) {
    console.error(error);
    setLoginError(error.message);
  }
}
    

      
    return (
        <div style={backgroundStyle}>
            <Header />
            <CookiesBanner/>

            {/* Log In Form */}

            <form onSubmit={handleSubmit} style={formStyle} noValidate>
                <h2 style={{ fontSize: '2rem' }}>Log In</h2>

                {/* Display login error if any */}

                {loginError && (
                    <p style={{
                        color: "red",
                        fontSize: "0.9rem",
                        textAlign: "center",
                        margin: "0",
                        padding: "10px",
                        backgroundColor: "#ffebee",
                        borderRadius: "5px",
                        border: "1px solid #ffcdd2",
                        width: "70%"
                    }}>
                        {loginError}
                    </p>
                )}

                {/* Email Field */}

                <div style={formRowStyle}>
                    <p style={labelStyle}>Email:</p>
                    <div style={{ flex: 1 }}>
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
                        {errors.email && (
                            <p style={{ color: "red", fontSize: "0.8rem", marginTop: "5px" }}>
                                {errors.email}
                            </p>
                        )}
                    </div>
                </div>

                {/* Password Field */}

                <div style={formRowStyle}>
                    <p style={labelStyle}>Password:</p>
                    <div style={{ flex: 1 }}>
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={values.password}
                            onChange={handleChange}
                            style={{
                                ...inputStyle,
                                border: errors.password ? "2px solid red" : inputStyle.border,
                            }}
                        />
                        {errors.password && (
                            <p style={{ color: "red", fontSize: "0.8rem", marginTop: "5px" }}>
                                {errors.password}
                            </p>
                        )}
                    </div>
                </div>

                {/* Submit Button */}

                <button
                    type="submit"
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(92, 92, 92, 1)';

                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(151, 151, 151, 1)';

                    }}
                    style={buttonStyle1} >
                    Log In
                </button>

                {/* Forgot password */}

                <a href="/forgot-password" 
                style={{
                    fontSize: '0.75rem',
                    marginBottom: '0px',
                    fontWeight: 'bold',
                    textDecoration: 'underline',
                    color: 'rgba(59, 59, 59, 1)',
                    cursor: 'pointer'
                }}>I forgot my password</a>

                <p style={{
                    fontSize: '0.9rem',
                    marginBottom: '0px',
                    fontWeight: 'bold',
                    color: 'rgba(59, 59, 59, 1)',
                }}>or</p>

                {/* Navigate to Sign Up Page */}

                <button
                    type="button"
                    onClick={() => window.location.href = '/signup'}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(204, 100, 3, 1)';

                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 123, 0, 1)';

                    }}

                    style={buttonStyle2} >
                    Sign Up
                </button>

                {/* OAuth Buttons */}

                <button style={buttonStyle}

                    onClick={handleGoogleSignIn}
                    type="button"
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.15)';

                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0)';

                    }}
                >
                    <img src="./googleIcon.png" alt="Google" style={{ height: '20px' }} />
                    <span style={{
                        marginLeft: '10px', fontSize: '0.7rem',
                        position: 'relative',
                        bottom: '5px', color: 'rgba(19, 19, 19, 1)'
                    }}>Continue with Google</span>
                </button>

                <button style={buttonStyle}

                    onClick={handleGitHubSignIn}
                    type="button"
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.15)';

                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0)';

                    }}
                >
                    <img src="./gitHubIcon.png" alt="Github" style={{ height: '20px' }} />
                    <span style={{
                        marginLeft: '10px', fontSize: '0.7rem',
                        position: 'relative',
                        bottom: '5px', color: 'rgba(19, 19, 19, 1)'
                    }}>Continue with Github</span>
                </button>
            </form>
        </div>
    )
}
export default LogIn;