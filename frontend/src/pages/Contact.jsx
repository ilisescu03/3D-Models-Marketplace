import { useState, useEffect, useRef } from 'react';
import emailjs from '@emailjs/browser';
import Footer from '../UI+UX/Footer.jsx';
import Header from "../UI+UX/Header";
import '/frontend/css/Contact.css';

function Contact() {
    const form = useRef();
    const [status, setStatus] = useState('');
    useEffect(() => {

        document.title = `Contact - ShapeHive`;


    }, []);
    const handleSubmit = (e) => {
        e.preventDefault();
        setStatus('submitting');


        const serviceID = import.meta.env.VITE_EMAIL_SEND_SERVICE;
        const templateID = import.meta.env.VITE_EMAIL_SEND_TEMPLATE;
        const publicKey = import.meta.env.VITE_EMAIL_SEND_KEY;

        emailjs.sendForm(serviceID, templateID, form.current, publicKey)
            .then((result) => {
                console.log(result.text);
                setStatus('success');
                form.current.reset();
            }, (error) => {
                console.error("Eroare EmailJS:", error);
                setStatus('error');
            });
    };

    return (
        <div className="contact-background">
            <Header />
            <div className="contact-container">
                <div className="contact-content">
                    <div className="contact-grid">
                        {/* About me */}
                        <div className="about-me-section">
                            <h1 className="contact-title">About Me</h1>
                            <div className="about-me-content">

                                <img src="profilepic.webp"
                                    className="profile-picture-placeholder"

                                />
                                <div className="about-me-text">
                                    <p>
                                        <strong>Ilisescu Adrian </strong>
                                    </p>
                                    <p>
                                        I am a passionate freelancer. I am dedicated to transforming ideas into remarkable visual concepts, whether for branding, illustrations, or web design. My goal is to deliver custom solutions that not only meet but exceed client expectations.
                                    </p>
                                    <div className="contact-info">
                                        <p><strong>Website:</strong><a href="https://ilisescuadrian.dev">https://ilisescuadrian.dev</a></p>
                                        <p><strong>Phone:</strong> +40 723 990 262</p>
                                        <div className="social-media-links">
                                            <a href="https://www.linkedin.com/in/adrian-ilisescu-771a11300/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                                            <a href="https://github.com/ilisescu03" target="_blank" rel="noopener noreferrer">GitHub</a>
                                            <a href="mailto:ilisescuadrian03@gmail.com" target="_blank" rel="noopener noreferrer">Email</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact form */}
                        <div className="contact-form-section">
                            <h2 className="form-title">Send a message</h2>
                            <form ref={form} className="contact-form" onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label htmlFor="name">Name</label>
                                    <input type="text" id="name" name="name" required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="email">Email</label>
                                    <input type="email" id="email" name="email" required />
                                </div>


                                <div className="form-group">
                                    <label htmlFor="title">Title</label>
                                    <input type="text" id="title" name="title" required />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="message">Message</label>
                                    <textarea id="message" name="message" rows="5" required></textarea>
                                </div>
                                <button type="submit" className="submit-btn" disabled={status === 'submitting'}>
                                    {status === 'submitting' ? 'Sending...' : 'Send Message'}
                                </button>

                                {/* Status messages*/}
                                {status === 'success' && <p className="status-success">Message sent successfully!</p>}
                                {status === 'error' && <p className="status-error">Something went wrong. Please try again.</p>}
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}

export default Contact;