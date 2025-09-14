import { auth, db } from "./firebase.js";
import { fetchSignInMethodsForEmail, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, GithubAuthProvider, signInWithPopup, signOut, sendPasswordResetEmail, deleteUser, sendEmailVerification } from "firebase/auth";
import { doc, setDoc, updateDoc, getDocs, getDoc, collection, query, where, deleteDoc } from "firebase/firestore";

//Sign Up

export const doCreateUserWithEmailAndPassword = async (username, email, password) => {
  try {



    // Check if email or username already exists
    const emailQuery = query(collection(db, "users"), where("email", "==", email));
    const usernameQuery = query(collection(db, "users"), where("username", "==", username));

    // Execute both queries in parallel
    const [emailSnap, usernameSnap] = await Promise.all([
      getDocs(emailQuery),
      getDocs(usernameQuery)
    ]);

    //The results of querrys

    const emailExists = !emailSnap.empty;
    const usernameExists = !usernameSnap.empty;

    // Create user in Firebase Auth

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // If email or username exists, delete the created user and throw an error

    if (emailExists) {
      await deleteUser(user);
      throw new Error("Email already in use.");
    }

    if (usernameExists) {
      await deleteUser(user);
      throw new Error("Username already in use.");
    }

    // Add user to Firestore DB

    await setDoc(doc(db, "users", user.uid), {
      username: username,
      email: email,
      provider: "password",
      createdAt: new Date(),
      profilePicture: "",
      followersList: [],
      followingList: []

    });

    // Send email verification

    await sendEmailVerification(user, {
      url: `${window.location.origin}/login`,
    });

    // Sign out the user to prevent unverified access

    await auth.signOut();

    //Success message

    return { message: "User created. Verification email sent.", userId: user.uid };

  } catch (error) {

    //Errors safety

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
        followingList: []
      });
    }
    return { succes: true, user }; //Succes
  } catch (error) {

    //Errors safety

    if (error.code === 'auth/account-exists-with-different-credential') {
      throw new Error("An account already exists with the same email address but different sign-in credentials. Please use a different sign-in method.");
    }
    return { succes: false, message: error.message }; //Fail
  }
}

//GitHub SignIn

const githubProvider = new GithubAuthProvider();

export const doSignInWithGitHub = async () => {
  try {

    //Call signInWithPopup with GitHub provider

    const result = await signInWithPopup(auth, githubProvider);
    console.log(result);
    const user = result.user; //Get user from result
    const emailQuery = query(collection(db, "users"), where("email", "==", user.email));//Check if user exists in Firestore DB
    const emailSnap = await getDocs(emailQuery);//Execute query

    //If user doesn't exist, add to Firestore DB

    if (emailSnap.empty) {
      await setDoc(doc(db, "users", user.uid), {
        username: user.displayName || user.email,
        email: user.email,
        provider: "github",
        createdAt: new Date(),
        profilePicture: user.photoURL || "",
        followersList: [],
        followingList: [],
      });
    }
    return { succes: true, user }; //Succes
  } catch (error) {

    //Errors safety

    if (error.code === 'auth/account-exists-with-different-credential') {
      throw new Error("An account already exists with the same email address but different sign-in credentials. Please use a different sign-in method.");
    }
    return { succes: false, message: error.message }; //Fail
  }
}

//Sign Out

export const doSignOut = async () => {
  return auth.signOut();
}

//Password Reset & Update

export const doPasswordReset = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email); // Send email
    return { success: true, message: "Password reset email sent." }; //Succes
  } catch (error) {

    //Error handling

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


// Follow a user
export const doFollowUser = async (targetUserId) => {
  if (!auth.currentUser) {
    throw new Error('No user is currently signed in.');
  }

  const currentUserId = auth.currentUser.uid;

  if (currentUserId === targetUserId) {
    throw new Error('You cannot follow yourself.');
  }

  try {
    const currentUserRef = doc(db, "users", currentUserId);
    const targetUserRef = doc(db, "users", targetUserId);

    // Get current user data
    const currentUserSnap = await getDoc(currentUserRef);
    const targetUserSnap = await getDoc(targetUserRef);

    if (!currentUserSnap.exists() || !targetUserSnap.exists()) {
      throw new Error('User not found.');
    }

    const currentUserData = currentUserSnap.data();
    const targetUserData = targetUserSnap.data();

    // Check if already following
    if (currentUserData.followingList?.includes(targetUserId)) {
      throw new Error('You are already following this user.');
    }

    // Update current user's following list
    await updateDoc(currentUserRef, {
      followingList: [...(currentUserData.followingList || []), targetUserId]
    });

    await updateDoc(targetUserRef, {
      followersList: [...(targetUserData.followersList || []), currentUserId]
    });



    return { success: true, message: 'User followed successfully.' };
  } catch (error) {
    throw new Error(error.message || 'Failed to follow user.');
  }
};

// Unfollow a user
export const doUnfollowUser = async (targetUserId) => {
  if (!auth.currentUser) {
    throw new Error('No user is currently signed in.');
  }

  const currentUserId = auth.currentUser.uid;

  try {
    const currentUserRef = doc(db, "users", currentUserId);
    const targetUserRef = doc(db, "users", targetUserId);

    // Get current user data
    const currentUserSnap = await getDoc(currentUserRef);
    const targetUserSnap = await getDoc(targetUserRef);

    if (!currentUserSnap.exists() || !targetUserSnap.exists()) {
      throw new Error('User not found.');
    }

    const currentUserData = currentUserSnap.data();
    const targetUserData = targetUserSnap.data();

    // Check if not following
    if (!currentUserData.followingList?.includes(targetUserId)) {
      throw new Error('You are not following this user.');
    }

    // Update current user's following list
    await updateDoc(currentUserRef, {
      followingList: (currentUserData.followingList || []).filter(id => id !== targetUserId)
    });

    await updateDoc(targetUserRef, {
      followersList: (targetUserData.followersList || []).filter(id => id !== currentUserId)
    });


    return { success: true, message: 'User unfollowed successfully.' };
  } catch (error) {
    throw new Error(error.message || 'Failed to unfollow user.');
  }
};

// Get user's  stats 
export const getUserStats = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error('User not found.');
    }

    const userData = userSnap.data();

    return {
      followers: (userData.followersList || []).length, // Calculate from array length
      following: (userData.followingList || []).length, // Calculate from array length
      followersList: userData.followersList || [],
      followingList: userData.followingList || [],
      profilePicture: userData.profilePicture || ""
    };
  } catch (error) {
    throw new Error(error.message || 'Failed to get user stats.');
  }
};

// Update profile picture
export const doUpdateProfilePicture = async (imageUrl) => {
  if (!auth.currentUser) {
    throw new Error('No user is currently signed in.');
  }

  try {
    const userRef = doc(db, "users", auth.currentUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error('User document not found.');
    }

    const userData = userSnap.data();

    await updateDoc(userRef, {
      profilePicture: imageUrl
    });


    return { success: true, message: 'Profile picture updated successfully.' };
  } catch (error) {
    throw new Error(error.message || 'Failed to update profile picture.');
  }
};


export const getFollowers = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error("User not found.");
    }

    const userData = userSnap.data();
    const followersList = userData.followersList || [];

    const followersData = await Promise.all(
      followersList.map(async (followerId) => {
        const followerRef = doc(db, "users", followerId);
        const followerSnap = await getDoc(followerRef);

        if (followerSnap.exists()) {
          const data = followerSnap.data();
          return {
            uid: followerId,
            username: data.username || data.email,
            profilePicture: data.profilePicture || "profile.png",
            followers: (data.followersList || []).length,
            following: (data.followingList || []).length,
          };
        }
        return null;
      })
    );

    return followersData.filter((f) => f !== null);
  } catch (error) {
    console.error("Error fetching followers:", error);
    return [];
  }
};
