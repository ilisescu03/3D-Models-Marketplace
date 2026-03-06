# ShapeHive - 3D Models Marketplace

<p align="left">
  <img src="public/WebsiteLogo2.png" alt="ShapeHive Logo" width="200"/>
</p>

ShapeHive is a comprehensive online marketplace for 3D models, designed for graphic designers, 3D artists, game developers, architects, and hobbyists. The platform allows creators to upload and sell their 3D models while enabling buyers to discover, preview, and purchase high-quality digital assets.

---

## Table of Contents

1. [About](#about)
2. [Features](#features)
3. [Pages Overview](#pages-overview)
4. [Tech Stack](#tech-stack)
5. [Project Structure](#project-structure)
6. [Firebase Services](#firebase-services)
7. [Payment Integration](#payment-integration)
8. [Future Enhancements](#future-enhancements)

---

## About

ShapeHive is a web-based 3D models marketplace that bridges the gap between 3D content creators and consumers. Whether you're looking for character models, architectural elements, furniture, vehicles, or any other 3D asset, ShapeHive provides a centralized platform to buy and sell digital 3D content.

The platform is built with modern web technologies and follows best practices for performance, security, and user experience.

---

## Features

### User Authentication
- **Email/Password Registration & Login** - Traditional authentication using Firebase Auth
- **Google OAuth** - Quick sign-in with Google accounts
- **Email Verification** - Users must verify their email before accessing the platform
- **Password Reset** - Forgotten password recovery via email

### 3D Model Management
- **Upload Models** - Creators can upload 3D model files with metadata (title, description, price, category, software compatibility)
- **Download Models** - Purchasers can download models directly from the platform
- **Preview** - Interactive 3D model preview using Three.js
- **Categories** - Organized model listings (Animals, Architecture, Art, Characters, Electronics, Fashion, Furniture, Jewelry, Mechanical, Plants, Vehicles, Weapons, Sports)

### Shopping & Payments
- **Shopping Cart** - Add multiple models to cart before checkout
- **Checkout** - Secure payment processing with Stripe
- **My Library** - Access purchased models anytime

### User Profiles
- **Dashboard** - Personal user dashboard showing uploaded models and statistics
- **Public Profiles** - View other users' public profiles and their model listings
- **Settings** - Account settings, profile management

### Search & Discovery
- **Search** - Find models by keywords
- **Filtering** - Filter by categories, price, software compatibility
- **Sorting** - Sort by newest, price, popularity

### Additional Features
- **Cookies Banner** - GDPR-compliant cookie consent
- **Terms & Conditions** - Legal documentation including refund policy
- **Cookie Policy** - Detailed cookie usage explanation
- **Contact** - Contact form for inquiries
- **Loading Screens** - Smooth loading states with animations

---

## Pages Overview

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Landing page with hero section and featured models |
| Login | `/login` | User authentication page |
| SignUp | `/signup` | New user registration |
| Forgot Password | `/forgot-password` | Password recovery |
| Dashboard | `/dashboard` | User's personal dashboard |
| Heroes | `/heroes` | Featured creators spotlight |
| Other Dashboard | `/user/:username` | Public user profile |
| Settings | `/settings` | Account settings |
| Password Reset | `/password-reset` | Password reset page |
| Upload Model | `/upload` | Upload new 3D model |
| Model Details | `/model/:modelId` | Individual model view with 3D preview |
| Search | `/search` | Search results page |
| Models Page | `/3d-models` | Browse all models |
| Community | `/members` | Community members list |
| Cookie Policy | `/cookie-policy` | Cookie usage documentation |
| Terms & Conditions | `/terms&conditions` | Terms, conditions & refund policy |
| Contact | `/contact` | Contact form |
| My Cart | `/my-cart` | Shopping cart |
| My Library | `/my-library` | Purchased models library |

---

## Tech Stack

### Frontend
- **React 19** - Modern React framework with hooks
- **React Router v7** - Client-side routing
- **Vite** - Next-generation build tool
- **@react-three/fiber** - React renderer for Three.js
- **@react-three/drei** - Useful helpers for react-three-fiber
- **CSS Modules / Inline Styles** - Component-level styling

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web application framework
- **Firebase** - Backend-as-a-Service platform

### Database & Storage
- **Firebase Firestore** - NoSQL cloud database
- **Firebase Storage** - Cloud storage for 3D model files

### Authentication
- **Firebase Authentication** - User authentication service

### Payments
- **Stripe** - Payment processing platform
- **@stripe/react-stripe-js** - Stripe React components
- **@stripe/stripe-js** - Stripe.js library

### Other Libraries
- **emailjs/browser** - Email sending service
- **jszip** - ZIP file creation
- **lucide-react** - Icon library
- **react-loading-indicators** - Loading animations


<img width="75" height="75" alt="image" src="https://github.com/user-attachments/assets/9a9192a8-4b6f-4e0e-9c56-6d85359d75b8" />
<img width="75" height="75" alt="image" src="https://github.com/user-attachments/assets/65132251-a925-481e-a658-b658c0b2c1a3" />
<img width="75" height="75" alt="image" src="https://github.com/user-attachments/assets/7b0839d7-5293-481e-80da-4e31a275d7aa" />
<img width="75" height="75" alt="image" src="https://github.com/user-attachments/assets/2a5ace05-edff-4913-9f9e-22dbf3b066cd" />
<img width="75" height="75" alt="image" src="https://github.com/user-attachments/assets/9aeeb9d4-05be-4b5a-ba44-6d3199f6d55b" />

---

## Project Structure

```
3D-Models-Marketplace/
├── backend/                     # Backend server code
│   ├── auth.js                  # Firebase authentication utilities
│   ├── cookies.js               # Cookie consent & tracking
│   ├── firebase.js              # Firebase configuration
│   ├── models.js                # Data models
│   ├── server.js                # Express server
│   ├── users.js                 # User-related functions
│   └── contexts/
│       └── authContext/         # Authentication context
├── frontend/
│   ├── assets/                  # Static assets
│   ├── css/                     # Global CSS files
│   │   ├── App.css
│   │   ├── Contact.css
│   │   ├── Dashboard.css
│   │   ├── Heroes.css
│   │   ├── Home.css
│   │   ├── ModelDetails.css
│   │   ├── MyCart.css
│   │   ├── OtherDashboard.css
│   │   ├── Settings.css
│   │   └── UploadModel.css
│   └── src/
│       ├── pages/               # Page components
│       │   ├── Home.jsx
│       │   ├── LogIn.jsx
│       │   ├── SignUp.jsx
│       │   ├── Dashboard.jsx
│       │   ├── UploadModel.jsx
│       │   ├── ModelDetails.jsx
│       │   ├── MyCart.jsx
│       │   ├── MyLibrary.jsx
│       │   └── ... (other pages)
│       ├── UI+UX/               # Reusable UI components
│       │   ├── Header.jsx
│       │   ├── Footer.jsx
│       │   ├── SideMenu.jsx
│       │   ├── CookiesBanner.jsx
│       │   └── LoadingScreen.jsx
│       └── validations/          # Form validation logic
├── public/                      # Public assets
│   ├── background.jpg
│   ├── background1.jpg
│   ├── background2.jpg
│   ├── WebsiteLogo.png
│   └── ... (icons and images)
├── functions/                   # Firebase Cloud Functions
├── App.jsx                      # Main app component
├── main.jsx                     # Entry point
├── index.html                   # HTML template
├── package.json                 # Dependencies
├── vite.config.js              # Vite configuration
└── firebase.json                # Firebase configuration
```

---



## Firebase Services

### Authentication
- Email/Password sign-up and login
- Google OAuth integration
- Email verification flow
- Password reset functionality
- Session management via Firebase Auth

### Firestore Database
Collections:
- `users` - User profiles and metadata
- `models` - 3D model listings with title, description, price, creator info
- `purchases` - Purchase history
- `comments` - Model comments/reviews

### Storage
- 3D model file uploads (.zip, .fbx, .obj ...)
- Model preview images
- User avatars

---

## Payment Integration

ShapeHive uses **Stripe** for secure payment processing:

1. Users add items to cart
2. Checkout process through Stripe Elements
3. Payment confirmation triggers:
   - Purchase record creation in Firestore
   - User gets access to purchased models in My Library

### Supported Payment Methods
- Credit/Debit Cards (Visa, Mastercard, American Express)


---



## Future Enhancements

- [ ] Users can become sellers

---

## License
This project is developed for commercial and demonstration purposes, serving as a comprehensive showcase of full-stack capabilities, including secure payment integration and 3D asset management.

The software is released under the GNU General Public License v2.0 (GPLv2).

Key Terms:

Copyleft: If you modify and distribute this software, you must make the source code available under the same GPL v2.0 license.

Commercial Use: The licensed material and derivatives may be used for commercial purposes.

Distribution: You are free to copy and distribute verbatim copies of this license document and the software.

Demonstration Focus: While the project is a functional marketplace, it is primarily intended to demonstrate architectural best practices (React, Firebase, Stripe).

No Warranty: The software is provided "as is". The author provides no warranty and is not liable for any issues arising from its use.

## Credits

<a href="https://github.com/ilisescu03">
  <img src="https://github.com/user-attachments/assets/a829fc36-b57c-4885-a226-ec71d954b17e" width="100" height="100" alt="GitHub Profile">
</a>

