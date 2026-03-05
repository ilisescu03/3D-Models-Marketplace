import { auth, db, storage } from "./firebase.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  deleteUser,
  GoogleAuthProvider,
  reauthenticateWithPopup,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { doc, getDoc, getDocs, updateDoc, onSnapshot, collection, deleteDoc,  writeBatch  } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { arrayUnion, arrayRemove } from "firebase/firestore";


// Delete user
export const doDeleteUserAccount = async (password) => {
  try {
    console.log("=== STARTING ACCOUNT DELETION ===");
    
    if (!auth.currentUser) {
      console.log("No user is currently signed in");
      return { success: false, message: 'No user is currently signed in.' };
    }

    const user = auth.currentUser;
    const provider = user.providerData[0]?.providerId;
    const userId = user.uid;
    const email = user.email;

    console.log("User info:", { userId, email, provider });

    // Reauth by provider
    if (provider === 'google.com') {
      console.log("Google user - starting reauthentication");
      try {
        const googleProvider = new GoogleAuthProvider();
        // Add prompt to update function
        googleProvider.setCustomParameters({
          prompt: 'select_account'
        });
        await reauthenticateWithPopup(user, googleProvider);
        console.log("Google reauthentication successful");
      } catch (error) {
        console.error("Google reauthentication error:", error);
        if (error.code === 'auth/popup-closed-by-user') {
          return { success: false, message: 'Reauthentication cancelled.' };
        }
        return { success: false, message: 'Google reauthentication failed. Please try again.' };
      }
    
    } else if (provider === 'password' && password) {
      console.log("Email/password user - starting reauthentication");
      try {
        // For email/password users we use password
        const credential = EmailAuthProvider.credential(email, password);
        await reauthenticateWithCredential(user, credential);
        console.log("Email/password reauthentication successful");
      } catch (error) {
        console.error("Email/password reauthentication error:", error);
        if (error.code === 'auth/wrong-password') {
          return { success: false, message: 'Password is incorrect.' };
        } else if (error.code === 'auth/invalid-credential') {
          return { success: false, message: 'Password is incorrect.' };
        }
        return { success: false, message: error.message || 'Reauthentication failed.' };
      }
    } else {
      console.log("Reauthentication required but no valid method available");
      return { success: false, message: 'Reauthentication required to delete account.' };
    }

    // Get user's data
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return { success: false, message: 'User document not found.' };
    }
    
    const userData = userDoc.data();
    const followersList = userData.followersList || [];
    const followingList = userData.followingList || [];

    console.log("Removing user from other users' lists...");

    // Delete the UID of other users
    for (const followerId of followersList) {
      try {
        const followerRef = doc(db, "users", followerId);
        const followerDoc = await getDoc(followerRef);
        
        if (followerDoc.exists()) {
          const followerData = followerDoc.data();
          const updatedFollowingList = (followerData.followingList || []).filter(id => id !== userId);
          await updateDoc(followerRef, { followingList: updatedFollowingList });
          console.log(`Removed from follower: ${followerId}`);
        }
      } catch (error) {
        console.error(`Error removing user from followers of ${followerId}:`, error);
      }
    }

    for (const followedId of followingList) {
      try {
        const followedRef = doc(db, "users", followedId);
        const followedDoc = await getDoc(followedRef);
        
        if (followedDoc.exists()) {
          const followedData = followedDoc.data();
          const updatedFollowersList = (followedData.followersList || []).filter(id => id !== userId);
          await updateDoc(followedRef, { followersList: updatedFollowersList });
          console.log(`Removed from followed: ${followedId}`);
        }
      } catch (error) {
        console.error(`Error removing user from following of ${followedId}:`, error);
      }
    }

    // Delete the user from firestore
    console.log("Deleting user document from Firestore...");
    await deleteDoc(userDocRef);
    console.log("User document deleted from Firestore");

    // Delete the profile pic.
    try {
      const profilePictureRef = ref(storage, `profilePictures/${userId}`);
      // Verify if the image exists before we delete it
      try {
        await getDownloadURL(profilePictureRef);
        await deleteObject(profilePictureRef);
        console.log("Profile picture deleted from storage");
      } catch (error) {
        if (error.code !== 'storage/object-not-found') {
          console.warn("Error checking profile picture:", error);
        }
      }
    } catch (storageError) {
      console.warn("Could not delete profile picture:", storageError);
    }

    // Delete user from Authentication
    console.log("Deleting user from Authentication...");
    await deleteUser(user);
    console.log("User deleted from Authentication");
    
    // Log out user after the deletion succeded
    console.log("Signing out user...");
    await signOut(auth);
    console.log("User signed out");

    console.log("=== ACCOUNT DELETION SUCCESSFUL ===");
    return { success: true, message: 'Account deleted successfully.' };
    
  } catch (error) {
    console.error("=== ACCOUNT DELETION FAILED ===", error);
    
    // Return the error message
    let errorMessage = error.message || 'Failed to delete account.';
    
    if (error.code === 'auth/requires-recent-login') {
      errorMessage = 'Please log in again before deleting your account.';
    } else if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Network error. Please check your connection and try again.';
    }
    
    return { 
      success: false, 
      message: errorMessage,
      errorCode: error.code
    };
  }
};
// Follow a user
export const doFollowUser = async (targetUserId) => {
  try {
    if (!auth.currentUser) {
      return { success: false, message: 'No user is currently signed in.' };
    }

    const currentUserId = auth.currentUser.uid;

    if (currentUserId === targetUserId) {
      return { success: false, message: 'You cannot follow yourself.' };
    }


    const currentUserRef = doc(db, "users", currentUserId);
    const targetUserRef = doc(db, "users", targetUserId);

    // Get current user data
    const [currentUserSnap, targetUserSnap] = await Promise.all([
      getDoc(currentUserRef),
      getDoc(targetUserRef)
    ]);

    if (!currentUserSnap.exists() || !targetUserSnap.exists()) {
      return { success: false, message: 'User not found.' };
    }

    const currentUserData = currentUserSnap.data();
    const targetUserData = targetUserSnap.data();

    // Check if already following
    if (currentUserData.followingList?.includes(targetUserId)) {
      return { success: false, message: 'You are already following this user.' };
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
    console.error("Error in doFollowUser:", error);
    return { success: false, message: error.message || 'Failed to follow user.' };
  }
};

// Unfollow a user
export const doUnfollowUser = async (targetUserId) => {
  try {
    if (!auth.currentUser) {
      return { success: false, message: 'No user is currently signed in.' };
    }

    const currentUserId = auth.currentUser.uid;


    const currentUserRef = doc(db, "users", currentUserId);
    const targetUserRef = doc(db, "users", targetUserId);

    // Get current user data
    const [currentUserSnap, targetUserSnap] = await Promise.all([
      getDoc(currentUserRef),
      getDoc(targetUserRef)
    ]);

    if (!currentUserSnap.exists() || !targetUserSnap.exists()) {
      return { success: false, message: 'User not found.' };
    }


    const currentUserData = currentUserSnap.data();
    const targetUserData = targetUserSnap.data();

    // Check if not following
    if (!currentUserData.followingList?.includes(targetUserId)) {
      return { success: false, message: 'You are not following this user.' };
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
    console.error("Error in doUnfollowUser:", error);
    return { success: false, message: error.message || 'Failed to unfollow user.' };
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
      profilePicture: userData.profilePicture || "",
      notifications: userData.notifications || [],
      username: userData.username || userData.email || "",
      bio: userData.bio || "",
      accountType: userData.accountType || "individual",
      role: userData.role || "other",
      links: userData.links || ["", "", "", ""],
      skills: userData.skills || [],
      favourites: userData.favourites || [],
    };
  } catch (error) {
    throw new Error(error.message || 'Failed to get user stats.');
  }
};

// Update profile picture
export const doUpdateProfilePicture = async (file) => {

  // Ensure that a user is currently signed in
  if (!auth.currentUser) {
    return { success: false, message: 'No user is currently signed in.' };
  }

  try {

    const userRef = doc(db, "users", auth.currentUser.uid); //Reference the FireStore document for the current user

    const storageRef = ref(storage, `profilePictures/${auth.currentUser.uid}`);


    const snapshot = await uploadBytes(storageRef, file);


    const downloadURL = await getDownloadURL(snapshot.ref);


    await updateDoc(userRef, {
      profilePicture: downloadURL
    });


    //Succes
    return { success: true, message: 'Profile picture updated successfully.', imageUrl: downloadURL };
  } catch (error) {
    //Fail
    return { success: false, message: error.message || 'Failed to update profile picture.' };
  }
};


//Get followers

export const getFollowers = async (userId) => {
  try {

    // Reference the Firestore document for the given user
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error("User not found.");
    }

    // Get the followers list from the user document
    const userData = userSnap.data();
    const followersList = userData.followersList || [];

    // Fetch detailed information for each follower
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
        //If the user doesn't exist in Firestore return null
        return null;
      })
    );

    return followersData.filter((f) => f !== null);
  } catch (error) {
    console.error("Error fetching followers:", error);
    return [];
  }
};

//Get the followed users

export const getFollowing = async (userId) => {
  try {

    // Reference the Firestore document for the given user
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      throw new Error("User not found. ");
    }
    const userData = userSnap.data();
    const followingList = userData.followingList || [];

    // Fetch detailed information for each followed user
    const followingData = await Promise.all(
      followingList.map(async (followedId) => {
        const followedRef = doc(db, "users", followedId);
        const followedSnap = await getDoc(followedRef);
        if (followedSnap.exists()) {
          const data = followedSnap.data();
          return {
            uid: followedId,
            username: data.username || data.email,
            profilePicture: data.profilePicture || "profile.png",
            followers: (data.followersList || []).length,
            following: (data.followingList || []).length,
          };
        }
        return null; // Return null if the user doesn't exist
      })
    )
    return followingData.filter((f) => f !== null)

  } catch (error) {
    console.error("Error fetching followings:", error);
    return [];
  }
}

//Listen to users stats in real-time
export const listenToUserStats = (userId, callback) => {
  // Reference the Firestore document for the given user
  const userRef = doc(db, "users", userId);

  // Listen in real-time to changes in the user document
  const unsubscribe = onSnapshot(userRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();

      //Call the provider callback with updated stats
      callback({
        followers: (data.followersList || []).length,
        following: (data.followingList || []).length,
        followersList: data.followersList || [],
        followingList: data.followingList || [],
        profilePicture: typeof data.profilePicture === "string" && data.profilePicture.length > 0
          ? data.profilePicture
          : "profile.png",
        username: data.username || data.email || "",
        notifications: data.notifications || [],
        bio: data.bio || "",
        accountType: data.accountType || "individual",
        role: data.role || "other",
        links: data.links || ["", "", "", ""],
        skills: data.skills || [],
        createdAt: data.createdAt || null
      });
    }
  }, (error) => {
    console.error("Error listening to user stats:", error);
  });

  return unsubscribe;
};

//Get users


export const getUsers = async () => {
  try {

    // Reference the Firestore "users" collection
    const usersCollection = collection(db, "users");
    const usersSnap = await getDocs(usersCollection);

    if (usersSnap.empty) {
      return []
    }



    const usersData = usersSnap.docs.map((doc) => {
      const data = doc.data();


     return {
        uid: doc.id,
        username: data.username || data.email,
        profilePicture: data.profilePicture || "profile.png",
        followers: (data.followersList || []).length,
        following: (data.followingList || []).length,
        
        accountType: data.accountType || "individual",
        role: data.role || "other",
        skills: data.skills || [],
        bio: data.bio || "",
        displayName: data.displayName || data.username || data.email,
        organizationName: data.organizationName || "",
        createdAt: data.createdAt || null
      };
    });


    return usersData;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};

//Update username 

export const updateUsername = async (newUsername) => {
  try {
    if (!auth.currentUser) {
      throw new Error('No user is currently signed in.');
    }
    const userRef = doc(db, "users", auth.currentUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error('User not found.');
    }
    await updateDoc(userRef, {
      username: newUsername
    });
    return { success: true, message: 'Username updated succesfully.' };
  } catch (error) {
    throw new Error(error.message || 'Failed to update username.')
  }
}



// Update user data
export const updateUserData = async (userId, updatedData) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, updatedData);
    return { success: true, message: 'User data updated successfully.' };
  } catch (error) {
    throw new Error(error.message || 'Failed to update user data.');
  }
};


// Change user password
export const doChangePassword = async (currentPassword, newPassword) => {
  try {
    if (!auth.currentUser) {
      return { success: false, message: 'No user is currently signed in.' };
    }

    // Reauth to verify the current password
    const email = auth.currentUser.email;

    // Create temporary user for verify
    const tempAuth = getAuth();

    try {
      // Try authentification with the current password
      await signInWithEmailAndPassword(tempAuth, email, currentPassword);

      // If succes, the password is correct and we are returning to the previous user
      await auth.updateCurrentUser(auth.currentUser);

      // Update password
      await updatePassword(auth.currentUser, newPassword);

      return { success: true, message: 'Password changed successfully.' };
    } catch (error) {
      if (error.code === 'auth/wrong-password') {
        return { success: false, message: 'Current password is incorrect.' };
      } else if (error.code === 'auth/too-many-requests') {
        return { success: false, message: 'Too many attempts. Please try again later.' };
      } else {
        return { success: false, message: error.message || 'Failed to verify current password.' };
      }
    }
  } catch (error) {
    console.error("Error in doChangePassword:", error);
    return { success: false, message: error.message || 'Failed to change password.' };
  }
};
//Send notification
export const sendNotification = async (userid, senderid, title, text, to) => {
  try {
    const userRef = doc(db, "users", userid);

    // Get current notifications (to not be overwritten)
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) throw new Error("User not found!");

    const currentNotifications = userSnap.data().notifications || [];

    // Create new notification
    const newNotification = {
      id: crypto.randomUUID ? crypto.randomUUID() : (Date.now() + Math.random()).toString(),
      read: false,
      title,
      text,
      from: senderid,
      date: new Date().toISOString(),
      to
    };

    // Add notification do the nofications array
    const updatedNotifications = [newNotification, ...currentNotifications];

    // Update Firestore
    await updateDoc(userRef, { notifications: updatedNotifications });

    return { success: true, message: "Notification sent." };
  } catch (error) {
    console.error("Failed to send notification:", error);
    return { success: false, message: error.message || "Error sending notification." };
  }
};
//Add to Cart
export const addToCart = async (modelId) => {
  if (!auth.currentUser) {
    return { success: false, message: 'Please log in to add items to your cart.' };
  }
  try {
    const userRef = doc(db, "users", auth.currentUser.uid);
    await updateDoc(userRef, {
      cart: arrayUnion(modelId)
    });
    return { success: true, message: 'Model added to cart.' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Remove from Cart
export const removeFromCart = async (modelId) => {
  if (!auth.currentUser) {
    return { success: false, message: 'User not authenticated.' };
  }
  try {
    const userRef = doc(db, "users", auth.currentUser.uid);
    await updateDoc(userRef, {
      cart: arrayRemove(modelId)
    });
    return { success: true, message: 'Model removed from cart.' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Get Cart Items
export const getCartItems = async () => {
    if (!auth.currentUser) {
        return { success: false, message: 'User not authenticated.', cart: [] };
    }
    try {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
            return { success: true, cart: userDoc.data().cart || [] };
        }
        return { success: false, message: 'User not found.', cart: [] };
    } catch (error) {
        return { success: false, message: error.message, cart: [] };
    }
};
export const completePurchase = async (modelIds) => {
  if (!auth.currentUser) {
    return { success: false, message: 'User not authenticated.' };
  }
  try {
    const userRef = doc(db, "users", auth.currentUser.uid);
    await updateDoc(userRef, {
      bought_models: arrayUnion(...modelIds),
      cart: []
    });
    return { success: true, message: 'Purchase completed.' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const hasUserBoughtModel = async (modelId) => {
  if (!auth.currentUser) return false;
  try {
    const userRef = doc(db, "users", auth.currentUser.uid);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const boughtModels = userDoc.data().bought_models || [];
      return boughtModels.includes(modelId);
    }
    return false;
  } catch (error) {
    return false;
  }
};