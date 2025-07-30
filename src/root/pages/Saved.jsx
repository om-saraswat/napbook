import { useEffect, useState } from "react";
import { GridPostList, Loader } from "../../components/shared";
import { useGetCurrentUser } from "../../lib/react-query/querieandmutation";

const Saved = () => {
  const { data: currentUser, isLoading: loadingUser } = useGetCurrentUser();
  const [delayedUser, setDelayedUser] = useState(null);
  
  useEffect(() => {
    // Add delay only when currentUser is fetched
    if (currentUser) {
      const timeout = setTimeout(() => {
        setDelayedUser(currentUser);
      }, 300); // 300ms delay

      return () => clearTimeout(timeout); // cleanup on unmount
    }
  }, [currentUser]);
  console.log(currentUser)
  if (loadingUser || !delayedUser) return <Loader />;
  console.log(delayedUser?.save)
  const savePosts = (delayedUser?.saves || [])
    .filter((savePost) => savePost.post) // Only include saves with valid post
    .map((savePost) => ({
      ...savePost.post,
      creator: {
        imageUrl: delayedUser.imageurl,
      },
    }))
    .reverse();

  return (
    <div className="saved-container">
      <div className="flex gap-2 w-full max-w-5xl">
        <img
          src="/assets/icons/save.svg"
          width={36}
          height={36}
          alt="saved"
          className="invert-white"
        />
        <h2 className="h3-bold md:h2-bold text-left w-full">Saved Posts</h2>
      </div>

      <ul className="w-full flex justify-center max-w-5xl gap-9">
        {savePosts.length === 0 ? (
          <p className="text-light-4">No available posts</p>
        ) : (
          <GridPostList posts={savePosts} showStats={false} />
        )}
      </ul>
    </div>
  );
};

export default Saved;
