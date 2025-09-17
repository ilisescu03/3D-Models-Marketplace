import { auth, db, storage } from "./firebase.js";
import { doc, getDoc, getDocs, updateDoc, onSnapshot, collection } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject} from "firebase/storage";
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
      username: userData.username || userData.email || "",
      bio: userData.bio || "",
      accountType: userData.accountType || "individual",
      role: userData.role || "other",
      links: userData.links || ["", "", "", ""],
      skills: userData.skills || []
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
    return { success: true, message: 'Profile picture updated successfully.', imageUrl:downloadURL };
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
        bio: data.bio || "",
        accountType: data.accountType || "individual",
        role: data.role || "other",
        links: data.links || ["", "", "", ""],
        skills: data.skills || []
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
      };

      
    })


    return usersData;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};

//Update username 

export const updateUsername = async (newUsername) =>{
  try{
    if(!auth.currentUser) {
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
    return {success: true, message: 'Username updated succesfully.'};
  } catch(error){
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