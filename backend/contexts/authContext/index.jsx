import React, { useContext, useState, useEffect } from 'react';
import { auth } from '/backend/firebase';
import { onAuthStateChanged } from 'firebase/auth';
const AuthContext = React.createContext();

export function useAuth() {
    return useContext(AuthContext);
}
export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userLogedIn, setUserLogedIn] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, initializeUser);
        return unsubscribe;
    }, []);

    async function initializeUser(user) {
        console.log("=== AUTH STATE CHANGE ===");
        console.log("User received in initializeUser:", user);
        console.log("User uid:", user?.uid);
        console.log("User email:", user?.email);

        if (user) {
            setCurrentUser({ ...user });
            setUserLogedIn(true);
            console.log("✅ User logged in");
        } else {
            setCurrentUser(null);
            setUserLogedIn(false);
            console.log("❌ User logged out");
        }
        setLoading(false);
    }


    const value = {
        currentUser,
        userLogedIn,
        loading
    }

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

