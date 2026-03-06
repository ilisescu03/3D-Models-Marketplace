# ShapeHive - 3D Models Marketplace

<p align="center">
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
6. [Getting Started](#getting-started)
7. [Firebase Services](#firebase-services)
8. [Payment Integration](#payment-integration)
9. [Deployment](#deployment)
10. [Future Enhancements](#future-enhancements)

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
- **Three.js** - 3D graphics library for model previews
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
- **node-unrar-js** - RAR archive handling
- **lucide-react** - Icon library
- **react-loading-indicators** - Loading animations

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

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn
- Firebase project with:
  - Authentication enabled (Email/Password, Google)
  - Firestore database
  - Storage bucket
- Stripe account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd 3D-Models-Marketplace
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id

   # Stripe Configuration
   VITE_REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
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
- 3D model file uploads (.zip, .rar, .7z)
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
- PayPal integration available

---

## Deployment

### Frontend (Firebase Hosting)
```bash
firebase deploy --only hosting
```

### Firebase Cloud Functions
```bash
firebase deploy --only functions
```

### GitHub Actions
The project includes CI/CD workflow for automatic deployment on merge to main branch.

---

## Future Enhancements

- [ ] User reviews and ratings system
- [ ] Model wishlist/favorites
- [ ] Social sharing features
- [ ] More payment gateways (PayPal, etc.)
- [ ] Advanced search filters
- [ ] Real-time chat between users
- [ ] Subscription plans for creators
- [ ] Mobile app development
- [ ] Multi-language support
- [ ] AI-powered model recommendations

---

## License

This project is for educational and demonstration purposes.

---

## Contact

For questions or inquiries:
- Email: ilici75@gmail.com
- Website: https://shapehive.com

---

<p align="center">Built with ❤️ using React, Firebase, and Three.js</p>

