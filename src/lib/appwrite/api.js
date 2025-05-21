import { ID, Query } from "appwrite";
import { appwriteConfig, account, databases, storage, avatars } from "./config";

// AUTH

export async function createUserAccount(user) {
  try {
    const newAccount = await account.create(
      ID.unique(),
      user.email,
      user.password,
      user.name
    );

    if (!newAccount) throw new Error("Failed to create account");
    console.log("New account created in Appwrite:", newAccount); // Debugging log

    const avatarUrl = avatars.getInitials(user.name);

    const newUser = await saveUserToDB({
      accountid: newAccount.$id,
      name: newAccount.name,
      email: newAccount.email,
      username: user.username,
      imageurl: avatarUrl,
    });

    if (!newUser) throw new Error("Failed to save user to database");
    console.log("New user saved to database:", newUser); // Debugging log

    return newUser;
  } catch (error) {
    console.error("Error creating user account:", error);
    throw error;
  }
}

export async function saveUserToDB(user) {
  try {
    const newUser = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      {
        accountid: user.accountid,
        name: user.name,
        email: user.email,
        username: user.username,
        imageurl: user.imageurl,
      }
    );

    if (!newUser) throw new Error("Failed to save user to database");
    console.log("User document created:", newUser); // Debugging log

    return newUser;
  } catch (error) {
    console.error("Error saving user to database:", error);
    throw error;
  }
}

export async function signInAccount(user) {
  try {
    const session = await account.createEmailPasswordSession(user.email, user.password); // Updated method name
    console.log("Session created:", session); // Debugging log
    return session;
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
}

export async function getAccount() {
  try {
    const currentAccount = await account.get();
    console.log("Current account fetched:", currentAccount); // Debugging log
    return currentAccount;
  } catch (error) {
    console.error("Error fetching account:", error);
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const currentAccount = await getAccount();
    if (!currentAccount) throw new Error("No account found");

    const currentUser = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountid", currentAccount.$id)]
    );
    console.log("Database query result:", currentUser); // Debugging log

    if (currentUser.documents.length > 0) {
      return currentUser.documents[0];
    }

    const avatarUrl = avatars.getInitials(currentAccount.name || "User");
    const newUser = await saveUserToDB({
      accountid: currentAccount.$id,
      name: currentAccount.name || "Unknown",
      email: currentAccount.email,
      username: currentAccount.name?.toLowerCase().replace(/\s+/g, "") || "unknown",
      imageurl: avatarUrl,
    });

    if (!newUser) throw new Error("Failed to save user to database during sign-in");
    console.log("New user created during sign-in:", newUser); // Debugging log

    return newUser;
  } catch (error) {
    console.error("Error in getCurrentUser:", error);
    return null;
  }
}

export async function signOutAccount() {
  try {
    const currentAccount = await getAccount();
    if (!currentAccount) {
      console.log("No active session to delete");
      return null;
    }

    const session = await account.deleteSession("current");
    console.log("Session deleted:", session); // Debugging log
    return session;
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
}

// POST

