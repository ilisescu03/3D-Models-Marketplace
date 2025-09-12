import { auth, db } from "./firebase.js";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, GithubAuthProvider, signInWithPopup, signOut, sendPasswordResetEmail, deleteUser, sendEmailVerification } from "firebase/auth";
import { doc, setDoc, getDocs, collection, query, where, deleteDoc } from "firebase/firestore";

export const doCreateUserWithEmailAndPassword = async (username, email, password) => {
  try {
   
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

  
    const emailQuery = query(collection(db, "users"), where("email", "==", email));
    const usernameQuery = query(collection(db, "users"), where("username", "==", username));

    const [emailSnap, usernameSnap] = await Promise.all([
      getDocs(emailQuery),
      getDocs(usernameQuery)
    ]);

    const emailExists = !emailSnap.empty;
    const usernameExists = !usernameSnap.empty;

    if (emailExists) {
      await deleteUser(user);
      throw new Error("Email already in use.");
    }

    if (usernameExists) {
      await deleteUser(user);
      throw new Error("Username already in use.");
    }


    await setDoc(doc(db, "users", user.uid), {
      username: username,
      email: email,
      provider: "password",
      createdAt: new Date(),
      
    });

    await sendEmailVerification(user,{
      url: `${window.location.origin}/login`, 
    });

 
    await auth.signOut();

    return { message: "User created. Verification email sent.", userId: user.uid };

  } catch (error) {
    throw error;
  }
};

export const doSignInWithEmailAndPassword = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
}

const googleProvider = new GoogleAuthProvider();
export const doSignInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    console.log(result);
    const user = result.user;
    const emailQuery = query(collection(db, "users"), where("email", "==", user.email));
    const emailSnap = await getDocs(emailQuery);
    if (emailSnap.empty) {
        await setDoc(doc(db, "users", user.uid), {
            username: user.displayName || user.email,
            email: user.email,
            provider: "google",
            createdAt: new Date()
        });
    }

    return result;
}

const githubProvider = new GithubAuthProvider();
export const doSignInWithGitHub = async () => {
    const result = await signInWithPopup(auth, githubProvider);
    console.log(result);
    const user = result.user;
    const emailQuery = query(collection(db, "users"), where("email", "==", user.email));
    const emailSnap = await getDocs(emailQuery);
    if (emailSnap.empty) {
        await setDoc(doc(db, "users", user.uid), {
            username: user.displayName || user.email,
            email: user.email,
            provider: "github",
            createdAt: new Date()
        });
    }
    return result;
}

export const doSignOut = async () => {
    return auth.signOut();
}
export const doPasswordReset = async (email) => {
    return sendPasswordResetEmail(auth, email);
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