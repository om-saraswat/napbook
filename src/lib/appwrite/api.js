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

export async function createPost(post) {
  try {
    // Upload file to appwrite storage
    const uploadedFile = await uploadFile(post.file[0]);

    if (!uploadedFile) throw new Error("File upload failed");

    // Get file url
    const fileUrl = getFilePreview(uploadedFile.$id);
    if (!fileUrl) {
      await deleteFile(uploadedFile.$id);
      throw new Error("Failed to get file URL");
    }

    // Convert tags into array
    const tags = post.tags?.trim() || "";


    // Create post
    const newPost = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      ID.unique(),
      {
        Creator: post.userId,
        Captions: post.caption,
        imageurl: fileUrl,
        imageid: uploadedFile.$id,
        location: post.location,
        tags: tags,
      }
    );

    if (!newPost) {
      await deleteFile(uploadedFile.$id);
      throw new Error("Post creation failed");
    }

    return newPost;
  } catch (error) {
    console.log(error);
  }
}
export async function uploadFile(file) {
  try {
    const uploadedFile = await storage.createFile(
      appwriteConfig.storageId,
      ID.unique(),
      file
    );

    return uploadedFile;
  } catch (error) {
    console.log(error);
    return null
  }
}
// ============================== GET FILE PREVIEW
export function getFilePreview(fileId) {
  try {
    const fileUrl = storage.getFilePreview(
      appwriteConfig.storageId,
      fileId,
      2000,
      2000,
      "top",
      100
    );

    if (!fileUrl) throw new Error("Failed to get file preview");

    return fileUrl;
  } catch (error) {
    console.log(error);
    return null;
  }
}

// ============================== DELETE FILE
export async function deleteFile(fileId) {
  try {
    await storage.deleteFile(appwriteConfig.storageId, fileId);
    return { status: "ok" };
  } catch (error) {
    console.log(error);
  }
}

export async function updatePost(post) {
  const hasFileToUpdate = post.file.length > 0;

  try {
    let image = {
      imageurl: post.imageUrl,
      imageid: post.imageId,
    };

    if (hasFileToUpdate) {
      // Upload new file to appwrite storage
      const uploadedFile = await uploadFile(post.file[0]);
      if (!uploadedFile) throw new Error("File upload failed");

      // Get new file url
      const fileUrl = getFilePreview(uploadedFile.$id);
      if (!fileUrl) {
        await deleteFile(uploadedFile.$id);
        throw new Error("File URL generation failed");
      }

      image = { ...image, imageUrl: fileUrl, imageId: uploadedFile.$id };
    }

    // Convert tags into array
    const tags = post.tags?.trim() || "";

    // Update post
    const updatedPost = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      post.postId,
      {
        Caption: post.caption,
        imageurl: image.imageUrl,
        imageid: image.imageId,
        location: post.location,
        tags: tags,
      }
    );

    // Failed to update
    if (!updatedPost) {
      if (hasFileToUpdate) {
        await deleteFile(image.imageId);
      }
      throw new Error("Post update failed");
    }

    // Safely delete old file after successful update
    if (hasFileToUpdate) {
      await deleteFile(post.imageId);
    }

    return updatedPost;
  } catch (error) {
    console.log(error);
  }
}
