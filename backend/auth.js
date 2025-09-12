import {auth, db} from "./firebase.js";
import {signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, GithubAuthProvider, signInWithPopup, signOut, sendPasswordResetEmail} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

export const doCreateUserWithEmailAndPassword = async (username, email, password) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

   
    await setDoc(doc(db, "users", user.uid), {
        username: username,
        email: email,
        createdAt: new Date()
    });

    return userCredential;
}


export const doSignInWithEmailAndPassword = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
}

const googleProvider = new GoogleAuthProvider();
export const doSignInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    console.log(result);
    return result;
}

const githubProvider = new GithubAuthProvider();
export const doSignInWithGitHub = async () => {
    const result = await signInWithPopup(auth, githubProvider);
    console.log(result);
    return result;
}

export const doSignOut = async () => {
    return auth.signOut();
}
export const doPasswordReset = async (email) => {
    return auth.sendPasswordResetEmail(email);
}
export const doPasswordUpdate = async (password) => {
    if (auth.currentUser) {
        return auth.currentUser.updatePassword(password);
    }
    return Promise.reject(new Error('No user is currently signed in.'));
}
export const doSendEmailVerification = async () => {
    if (auth.currentUser) {
        return auth.currentUser.sendEmailVerification({
            url: `${window.location.origin}/`,
        });
    }
    return Promise.reject(new Error('No user is currently signed in.'));
}
