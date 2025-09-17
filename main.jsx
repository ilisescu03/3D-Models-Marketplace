// index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '/App.jsx';
import { AuthProvider } from '/backend/contexts/authContext/index.jsx'; // Adaugă import

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
   <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>  {/* Adaugă AuthProvider aici */}
            <App />
        </AuthProvider>   {/* Închide AuthProvider */}
      </BrowserRouter>
   </React.StrictMode>
);