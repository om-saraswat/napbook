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
    console.log("Current Account:", currentAccount);

    if (!currentAccount) throw new Error("No account found");

    // Step 1: Try to get the user document with expanded relations
    let currentUserResponse;

    try {
      currentUserResponse = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        [
          Query.equal("accountid", currentAccount.$id),
          Query.limit(1),
          Query.expand(["save", "save.post"]), // expand relations safely
        ]
      );
    } catch (error) {
      console.warn("Could not expand save field, falling back to base user fetch.");
      currentUserResponse = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        [Query.equal("accountid", currentAccount.$id), Query.limit(1)]
      );
    }

    // Step 2: If user found
    if (currentUserResponse.documents.length > 0) {
      return currentUserResponse.documents[0];
    }

    // Step 3: If user doesn't exist — create a new one
    const avatarUrl = avatars.getInitials(currentAccount.name || "User");
    const newUser = await saveUserToDB({
      accountid: currentAccount.$id,
      name: currentAccount.name || "Unknown",
      email: currentAccount.email,
      username:
        currentAccount.name?.toLowerCase().replace(/\s+/g, "") || "unknown",
      imageurl: avatarUrl,
    });

    if (!newUser) throw new Error("Failed to save user to database during sign-in");

    console.log("New user created during sign-in:", newUser);
    return newUser;
  } catch (error) {
    console.error("Error in getCurrentUser:", error.message);
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
export async function getUserById(userId) {
  try {
    const user = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      userId
    );

    if (!user) throw new Error("User not found");

    return user;
  } catch (error) {
    console.log(error);
  }
}
export async function getUserPosts(userId) {
  if (!userId) return;

  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      [
        Query.equal("creator", userId),
        Query.orderDesc("$createdAt")
      ]
    );

    if (!posts) throw new Error("No posts found");

    return posts;
  } catch (error) {
    console.log("Error fetching user posts:", error);
  }
}

export async function createPost(post) {
  try {
    // Upload file to appwrite storage
    const uploadedFile = await uploadFile(post.file[0]);

    if (!uploadedFile) throw new Error("File upload failed");

    // Get file url
    const fileUrl = getFileView(uploadedFile.$id);
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
      file,
    );

    return uploadedFile;
  } catch (error) {
    console.log(error);
    return null;
  }
}
// ============================== GET FILE PREVIEW
// ============================== GET FILE VIEW (Updated)
export function getFileView(fileId) {
  try {
    const fileUrl = storage.getFileView(
      appwriteConfig.storageId,
      fileId
    );
    
    // Manually construct URL with project ID if needed
    const finalUrl = `${fileUrl}`;
    
    console.log("Generated file URL:", finalUrl); // Debugging
    
    if (!fileUrl) throw new Error("Failed to get file URL");
    return finalUrl;
  } catch (error) {
    console.error("Error in getFilePreview:", error);
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

export async function getPostById(postId) {
  if (!postId) throw new Error('Post ID is required');

  try {
    const post = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      postId
    );

    if (!post) throw new Error('Post not found');

    return post;
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
      const fileUrl = getFileView(uploadedFile.$id);
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
        Captions: post.caption,
        imageurl: image.imageUrl,
        imageid: image.imageId,
        location: post.location,
        tags: tags,
      }
    );

    // Failed to update
    if (!updatedPost) {
      if (hasFileToUpdate) {
        await deleteFile(image.imageid);
      }
      throw new Error("Post update failed");
    }

    // Safely delete old file after successful update
    if (hasFileToUpdate) {
      await deleteFile(post.imageid);
    }

    return updatedPost;
  } catch (error) {
    console.log(error);
  }
}
export async function getRecentPosts() {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      [Query.orderDesc("$createdAt"), Query.limit(20)]
    );

    if (!posts) throw Error;
    console.log("fefe",posts);
    return posts;
    
  } catch (error) {
    console.log(error);
  }
}
export async function getUsers(limit) {
  const queries = [Query.orderDesc("$createdAt")];

  if (limit) {
    queries.push(Query.limit(limit));
  }

  try {
    const users = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      queries
    );

    if (!users) throw Error;

    return users;
  } catch (error) {
    console.log(error);
  }
}
export async function likePost(postId, likesArray) {
  try {
    const updatedPost = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      postId,
      {
        likes: likesArray,
      }
    );

    if (!updatedPost) throw new Error("Failed to update post likes");

    return updatedPost;
  } catch (error) {
    console.log("likePost error:", error);
  }
}

// ============================== SAVE POST
export async function savePost(userId, postId) {
  try {
    const updatedPost = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.savesCollectionId,
      ID.unique(),
      {
        user: userId,
        post: postId,
      }
    );

    if (!updatedPost) throw new Error("Failed to save post");

    return updatedPost;
  } catch (error) {
    console.log("savePost error:", error);
  }
}

// ============================== DELETE SAVED POST
export async function deleteSavedPost(savedRecordId) {
  try {
    const statusCode = await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.savesCollectionId,
      savedRecordId
    );

    if (!statusCode) throw new Error("Failed to delete saved post");

    return { status: "Ok" };
  } catch (error) {
    console.log("deleteSavedPost error:", error);
  }
}
export async function deletePost(postId, imageId) {
  if (!postId || !imageId) return;

  try {
    const statusCode = await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      postId
    );

    if (!statusCode) throw new Error("Failed to delete post document");

    await deleteFile(imageId);

    return { status: "Ok" };
  } catch (error) {
    console.log("deletePost error:", error);
  }
}
export async function updateUser(user) {
  try {
    console.log("Updating user:", {
      id: user.userId,
      name: user.name,
      bio: user.bio,
      imageurl: user.imageUrl,
    });

    const response = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      user.userId,
      {
        name: user.name,
        bio: user.bio,
        imageurl: user.imageUrl,
      }
    );

    console.log("Update success:", response);
    return response;
  } catch (error) {
    console.error("Update failed:", error.message, error);
  }
}

export async function getInfinitePosts({ pageParam }) {
  const queries = [Query.orderDesc("$updatedAt"), Query.limit(9)];

  if (pageParam) {
    queries.push(Query.cursorAfter(pageParam.toString()));
  }

  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      queries
    );

    if (!posts) throw new Error("No posts found");

    return posts;
  } catch (error) {
    console.log("Error fetching infinite posts:", error);
  }
}
export async function searchPosts(searchTerm) {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      [Query.search("Captions", searchTerm)]
    );

    if (!posts) throw new Error("No posts found");

    return posts;
  } catch (error) {
    console.log("Error searching posts:", error);
  }
}



