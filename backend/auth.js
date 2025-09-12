import { auth, db } from "./firebase.js";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, GithubAuthProvider, signInWithPopup, signOut, sendPasswordResetEmail, deleteUser, sendEmailVerification } from "firebase/auth";
import { doc, setDoc, getDocs, collection, query, where, deleteDoc } from "firebase/firestore";

export const doCreateUserWithEmailAndPassword = async (username, email, password) => {
  try {




    const emailQuery = query(collection(db, "users"), where("email", "==", email));
    const usernameQuery = query(collection(db, "users"), where("username", "==", username));

    const [emailSnap, usernameSnap] = await Promise.all([
      getDocs(emailQuery),
      getDocs(usernameQuery)
    ]);

    const emailExists = !emailSnap.empty;
    const usernameExists = !usernameSnap.empty;
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
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

    await sendEmailVerification(user, {
      url: `${window.location.origin}/login`,
    });


    await auth.signOut();

    return { message: "User created. Verification email sent.", userId: user.uid };

  } catch (error) {
    switch (error.code) {
      case 'auth/email-already-in-use':
        throw new Error("Email already in use.");
      case 'auth/invalid-email':
        throw new Error("Invalid email address.");
      case 'auth/weak-password':
        throw new Error("Password is too weak.");
      case 'auth/operation-not-allowed':
        throw new Error("Email/password accounts are not enabled.");
      default:
        throw new Error(error.message.replace(/^Firebase:\s*/i, '').replace(/\s*\([^)]*\)\.?$/, ''));
    }

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
  try {
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
    return { succes: true, user };
  } catch (error) {
    if (error.code === 'auth/account-exists-with-different-credential') {
      throw new Error("An account already exists with the same email address but different sign-in credentials. Please use a different sign-in method.");
    }
    return { succes: false, message: error.message };
  }
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