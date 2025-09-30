import {useState} from 'react';
import Header from "../UI+UX/Header";
import { doPasswordReset } from "/backend/auth.js";
import { useNavigate } from "react-router-dom";
import CookiesBanner from '../UI+UX/CookiesBanner';
// Background style for the entire page

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
// Form style for the forgot password form
const formStyle = {
    marginBottom:'5rem',
    padding: '20px',
    fontFamily: 'RaleWay, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    margin: '0 auto',
    width: '75%',
    maxWidth: '350px',
    marginTop: '10rem',
    background: 'white',
    borderRadius: '10px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
}

// Input field style

const inputStyle = {
    flex: 1,
    width: '70%',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
    fontSize: '16px',
    outline: 'none',
}

// Form row style for arranging label and input side by side

const formRowStyle = {
    marginTop:'1rem',
    display: 'flex',
    alignItems: 'flex-start',
    marginRight: '1rem',
    gap: '1.5rem',
}

// Label style for the input fields

const labelStyle = {
    fontWeight: 'bold',
    textAlign: 'right',
    width: '100px',
    marginTop: '12px',
    fontSize: '1.1rem'

}

//Form submit button style

const buttonStyle1 = {
    backgroundColor: 'rgba(255, 115, 0, 1)',
    color: 'white',
    border: 'none',
    marginTop: '2rem',
    fontSize: '1rem',
    borderRadius: '5px',
    fontWeight: 'bold',
    padding: '7.5px 15px',
    transition: '0.3s ease',
    cursor: 'pointer'
}

function ForgotPassword() {

    //Email and errors states

    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const navigate = useNavigate();
    
    const handleSubmit = async (e) =>{

        e.preventDefault();  //prevent default submit behaviour
        setMessage("");
        setError("");

        try{
            await doPasswordReset(email); //Call the send email function
            setMessage("Password reset email sent ! Check your inbox."); //Succes
            alert("Password reset email sent! Check your inbox."); //Notify the user
            setEmail(""); 
            navigate('/'); //navigate to home page

        } catch(err){
            //Error message
            setError(err.message);
        }

    }
    return (
        <div style={backgroundStyle}>
            <Header />
            <CookiesBanner/>
            {/* Forgot password form */}
            <form onSubmit={handleSubmit} style={formStyle} noValidate>
                <h2 style={{ textAlign: 'center' }}>Forgot Password</h2>
                
                {/* Error message */}

                {error && (
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
                        {error}
                    </p>
                )}
                
                {/* Email label and input*/}
                
                <div style={formRowStyle}>
                    <label htmlFor="email" style={labelStyle}>Email:</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e)=>setEmail(e.target.value)}
                        style={inputStyle}
                        required
                    />
                </div>
                
                {/* Submit button */}

                <button style={buttonStyle1}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(228, 102, 0, 1)';

                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 115, 0, 1)';

                    }}
                >
                Send email
            </button>

        </form>
        
        </div >
    )
}

export default ForgotPassword;