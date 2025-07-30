import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { checkIsLiked } from "@/lib/utils";
import {
  useLikePost,
  useSavePost,
  useDeleteSavedPost,
  useGetCurrentUser,
} from "../../lib/react-query/querieandmutation";

export const PostStats = ({ post, userId }) => {
  const location = useLocation();
  const likesList = post.likes.map((user) => user.$id);

  const [likes, setLikes] = useState(likesList);
  const [savedId, setSavedId] = useState(null); // Track actual saved record ID

  const { mutate: likePost } = useLikePost();
  const { mutate: savePost } = useSavePost();
  const { mutate: deleteSavePost } = useDeleteSavedPost();

  const { data: currentUser } = useGetCurrentUser();
  const queryClient = useQueryClient();

  const isSaved = !!savedId;

  // ✅ SAFELY handle both expanded and non-expanded `post` references
  useEffect(() => {
    if (Array.isArray(currentUser?.save)) {
      const found = currentUser.save.find((record) => {
        const savedPostId = record?.post?.$id || record?.post;
        return savedPostId === post.$id;
      });

      setSavedId(found ? found.$id : null);
    }
  }, [currentUser, post.$id]);

  const handleLikePost = (e) => {
    e.stopPropagation();

    let likesArray = [...likes];
    if (likesArray.includes(userId)) {
      likesArray = likesArray.filter((id) => id !== userId);
    } else {
      likesArray.push(userId);
    }

    setLikes(likesArray);
    likePost({ postId: post.$id, likesArray });
  };

  const handleSavePost = (e) => {
    e.stopPropagation();

    if (savedId) {
      deleteSavePost(savedId, {
        onSuccess: () => {
          setSavedId(null);
          queryClient.invalidateQueries({ queryKey: ["getCurrentUser"] });
        },
        onError: () => {
          console.log("Failed to unsave post");
        },
      });
    } else {
      savePost(
        { userId, postId: post.$id },
        {
          onSuccess: (data) => {
            setSavedId(data?.$id);
            queryClient.invalidateQueries({ queryKey: ["getCurrentUser"] });
          },
          onError: () => {
            console.log("Failed to save post");
          },
        }
      );
    }
  };

  const containerStyles = location.pathname.startsWith("/profile")
    ? "w-full"
    : "";

  return (
    <div className={`flex justify-between items-center z-20 ${containerStyles}`}>
      <div className="flex gap-2 mr-5">
        <img
          src={
            checkIsLiked(likes, userId)
              ? "/assets/icons/liked.svg"
              : "/assets/icons/like.svg"
          }
          alt="like"
          width={20}
          height={20}
          onClick={handleLikePost}
          className="cursor-pointer"
        />
        <p className="small-medium lg:base-medium">{likes.length}</p>
      </div>

      <div className="flex gap-2">
        <img
          src={isSaved ? "/assets/icons/saved.svg" : "/assets/icons/save.svg"}
          alt="save"
          width={20}
          height={20}
          className="cursor-pointer"
          onClick={handleSavePost}
        />
      </div>
    </div>
  );
};

export default PostStats;
