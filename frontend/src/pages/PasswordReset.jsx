import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '/backend/firebase.js';
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
    marginBottom: '5rem',
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
    marginTop: '1rem',
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
function PasswordReset() {
    const [searchParams] = useSearchParams();
    const oobCode = searchParams.get('oobCode');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [email, setEmail] = useState('');

    // Verificăm codul la montarea componentei
    useState(() => {
        if (oobCode) {
            verifyPasswordResetCode(auth, oobCode)
                .then((email) => {
                    setEmail(email);
                })
                .catch((error) => {
                    setError('Invalid or expired reset code.');
                });
        }
    }, [oobCode]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (newPassword !== confirmPassword) {
            setError("Passwords don't match.");
            return;
        }

        if (newPassword.length < 6) {
            setError("Password should be at least 6 characters.");
            return;
        }

        try {
            await confirmPasswordReset(auth, oobCode, newPassword);
            setMessage('Password has been reset successfully. You can now login with your new password.');
        } catch (error) {
            setError(error.message);
        }
    };

    if (!oobCode) {
        return <div>Invalid reset link.</div>;
    }

    return (
        <div style={backgroundStyle}>
            <CookiesBanner></CookiesBanner>
            <form onSubmit={handleSubmit} style={formStyle}>
                <h2>Set New Password </h2>
                <div >
                    <label style={labelStyle}>New Password:</label>
                    <input
                        style={inputStyle}
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required

                    />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={labelStyle}>Confirm New Password:</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        style={inputStyle}
                    />
                </div>
                <button
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(219, 99, 0, 1)';

                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 115, 0, 1)';

                    }}
                    type="submit" style={buttonStyle1}>
                    Reset Password
                </button>
                {message && <p style={{ color: 'green' }}>{message}</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            </form>
            
        </div>
    );
}

export default PasswordReset;