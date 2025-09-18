import { auth, db } from "./firebase.js";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, GithubAuthProvider, signInWithPopup, signOut, sendPasswordResetEmail, deleteUser, sendEmailVerification, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, updateDoc, getDocs, getDoc, collection, query, where, deleteDoc, onSnapshot } from "firebase/firestore";
import { setPersistence, browserLocalPersistence } from "firebase/auth";
//Sign Up 
export const doCreateUserWithEmailAndPassword = async (username, email, password) => {
  try {
    console.log("=== STARTING SIGNUP PROCESS ===");
    console.log("Username:", username);
    console.log("Email:", email);

    //Creating User credentials
    console.log("=== CREATING USER IN FIREBASE AUTH ===");
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log("Auth user created:", {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified
    });

    // Setting user data
    console.log("=== CREATING FIRESTORE DOCUMENT ===");
    console.log("Document path: users/" + user.uid);
    console.log("Using user from credential:", user.uid);

    const userData = {
      username: username,
      email: email,
      provider: "password",
      createdAt: new Date(),
      profilePicture: "",
      followersList: [],
      followingList: [],
      accountType: "individual", 
        role: "other" ,
      bio: "",
      links: ["", "", "", ""],
      skills: []
    };

    console.log("User data to be saved:", userData);

    try {
      console.log("About to call setDoc...");
      console.log("Current auth state:", auth.currentUser?.uid);

      // Wait for auth syncronize with firestore
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log("Auth state after wait:", auth.currentUser?.uid);

      // Try create document
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          attempts++;
          console.log(`Attempt ${attempts} to create document...`);

          await setDoc(doc(db, "users", user.uid), userData);
          console.log("Firestore document created successfully");
          break;

        } catch (attemptError) {
          console.error(`Attempt ${attempts} failed:`, attemptError.message);

          if (attempts === maxAttempts) {
            throw attemptError;
          }

          // Wait before next try
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (firestoreError) {
      console.error("Firestore creation failed:");
      console.error("Error code:", firestoreError.code);
      console.error("Error message:", firestoreError.message);
      console.error("Full error:", firestoreError);

      // Clean up: delete the auth user
      try {
        await deleteUser(user);
        console.log("Cleaned up auth user");
      } catch (cleanupError) {
        console.error("Failed to cleanup auth user:", cleanupError);
      }
      throw new Error("Failed to create user profile: " + firestoreError.message);
    }

    // Verify document was created
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        throw new Error("User document verification failed - document doesn't exist");
      }
      console.log(" User document verified");
    } catch (verifyError) {
      console.error(" Document verification failed:", verifyError);
      try {
        await deleteUser(user);
      } catch (cleanupError) {
        console.error("Failed to cleanup auth user:", cleanupError);
      }
      throw new Error("User document creation could not be verified");
    }

    // Send email verification
    try {
      await sendEmailVerification(user, {
        url: `${window.location.origin}/login`,
      });
      console.log(" Verification email sent");
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);

    }

    // Sign out the user
    await auth.signOut();
    console.log("User signed out");

    return {
      success: true,
      message: "User created successfully. Verification email sent.",
      userId: user.uid
    };

  } catch (error) {
    console.error("=== SIGNUP ERROR ===");
    console.error("Error type:", typeof error);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Full error:", error);

    if (error.code === 'auth/email-already-in-use') {
      throw new Error("Email already in use.");
    } else if (error.code === 'auth/invalid-email') {
      throw new Error("Invalid email address.");
    } else if (error.code === 'auth/weak-password') {
      throw new Error("Password is too weak.");
    } else if (error.code === 'auth/operation-not-allowed') {
      throw new Error("Email/password accounts are not enabled.");
    }

    throw new Error(error.message || "Failed to create account.");
  }
};

//Log In
export const doSignInWithEmailAndPassword = async (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
}

//Google SignIn

const googleProvider = new GoogleAuthProvider();

export const doSignInWithGoogle = async () => {
  try {

    //Call signInWithPopup with Google provider

    const result = await signInWithPopup(auth, googleProvider);
    console.log(result);
    const user = result.user; //Get user from result
    const emailQuery = query(collection(db, "users"), where("email", "==", user.email));//Check if user exists in Firestore DB

    const emailSnap = await getDocs(emailQuery);//Execute query


    //If user doesn't exist, add to Firestore DB

    if (emailSnap.empty) {
      await setDoc(doc(db, "users", user.uid), {
        username: user.displayName || user.email,
        email: user.email,
        provider: "google",
        createdAt: new Date(),
        profilePicture: user.photoURL || "",
        followersList: [],
        followingList: [],
        accountType: "individual", 
        role: "other" ,
        bio: "",
        links: ["", "", "", ""],
        skills: []
      });
    }
    return { success: true, user }; //Succes
  } catch (error) {

    //Errors safety

    if (error.code === 'auth/account-exists-with-different-credential') {
      throw new Error("An account already exists with the same email address but different sign-in credentials. Please use a different sign-in method.");
    }
    return { success: false, message: error.message }; //Fail
  }
}

const githubProvider =  new GithubAuthProvider();

//GitHub SignIn
export const doSignInWithGitHub = async () => {
  try {
    console.log("=== STARTING GITHUB SIGNIN ===");

    // Ensure persistence
    await setPersistence(auth, browserLocalPersistence);

    const result = await signInWithPopup(auth, githubProvider);
    const user = result.user;

    // Ensure GitHub returns an email
    if (!user.email) {
      throw new Error("GitHub account does not provide an email. Please make your email public or link manually.");
    }

    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        username: user.displayName || user.email.split("@")[0],
        email: user.email,
        provider: "github",
        createdAt: new Date(),
        profilePicture: user.photoURL || "",
        followersList: [],
        followingList: [],
        accountType: "individual", 
        role: "other" ,
        bio: "",
        links: ["", "", "", ""],
        skills: []
      });
    }

    return { success: true, user };

  } catch (error) {
    console.error("=== GITHUB SIGNIN ERROR ===", error);

    if (error.code === 'auth/account-exists-with-different-credential') {
      throw new Error("This email is already linked to another account.");
    }
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error("Sign-in was cancelled.");
    }
    if (error.code === 'auth/popup-blocked') {
      throw new Error("Popup blocked. Allow popups and try again.");
    }

    return { success: false, message: error.message };
  }
};
//Sign Out
export const doSignOut = async () => {
  return auth.signOut();
}

//Password Reset & Update
export const doPasswordReset = async (email) => {
  try {
     await sendPasswordResetEmail(auth, email, {
      url: `${window.location.origin}/password-reset`, 
      handleCodeInApp: true 
    });
    return { success: true, message: "Password reset email sent." };
  } catch (error) {
    if (error.code === "auth/user-not-found" || error.code === "auth/missing-email") {
      throw new Error("No account with this email exists.");
    }
    throw new Error(error.message || "Failed to send password reset email.");
  }
};

export const doPasswordUpdate = async (password) => {
  if (auth.currentUser) {
    return auth.currentUser.updatePassword(password);
  }
  return Promise.reject(new Error('No user is currently signed in.'));
}

//Email Verification
export const doSendEmailVerification = async () => {
  if (auth.currentUser) {
    return auth.currentUser.sendEmailVerification({
      url: `${window.location.origin}/`,
    });
  }
  return Promise.reject(new Error('No user is currently signed in.'));
}
//Reauth in case it's necessary
export const doReauthenticate = async (password) => {
  try {
    if (!auth.currentUser) {
      throw new Error('No user is currently signed in.');
    }
    
    const email = auth.currentUser.email;
    const tempAuth = getAuth();
    
    // Reauth
    await signInWithEmailAndPassword(tempAuth, email, password);
    
    // Return to the original user
    await auth.updateCurrentUser(auth.currentUser);
    
    return { success: true, message: 'Reauthentication successful.' };
  } catch (error) {
    if (error.code === 'auth/wrong-password') {
      throw new Error('Password is incorrect.');
    }
    throw new Error(error.message || 'Reauthentication failed.');
  }
};