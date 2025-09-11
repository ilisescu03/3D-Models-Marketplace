import React from "react";
import Header from "./Header";
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
    marginTop:'10rem',
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
    alignItems: 'center',
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
    cursor: 'pointer'
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
    return (
        <div style={backgroundStyle}>
            <Header />
            <form style={formStyle}>
                <h2>Log In</h2>
                <div style={formRowStyle}>
                    <p style={labelStyle}>Email:</p>
                    <input type="email" placeholder="Email" style={inputStyle} required />
                </div>
                <div style={formRowStyle}>
                    <p style={labelStyle}>Password:</p>
                    <input type="password" placeholder="Password" style={inputStyle} required />
                </div>

                <button

                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(92, 92, 92, 1)';

                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(151, 151, 151, 1)';

                    }}
                    style={buttonStyle1} >
                    Log In
                </button>
                <a style={{
                    fontSize: '0.75rem',
                    marginBottom: '0px',
                    fontWeight: 'bold',
                    textDecoration:'underline',
                    color: 'rgba(59, 59, 59, 1)',
                    cursor:'pointer'
                }}>I forgot my password</a>
                <p style={{
                    fontSize: '0.9rem',
                    marginBottom: '0px',
                    fontWeight: 'bold',
                    color: 'rgba(59, 59, 59, 1)',
                }}>or</p>
                <button
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
                <button style={buttonStyle}
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