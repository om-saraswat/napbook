import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { createPost, createUserAccount, signInAccount, signOutAccount } from '../appwrite/api'; // Add signOutAccount



import { QUERY_KEYS } from './QUERY_KEYS';

export const useCreateUserAccountMutation = () => {
  return useMutation({
    mutationFn: (user) => createUserAccount(user),
  });
};

export const useSignInAccount = () => {
  return useMutation({
    mutationFn: (user) => signInAccount(user),
  });
};

export const useSignOutAccount = () => {
  return useMutation({
    mutationFn: () => signOutAccount(),
  });
}
export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (post) => createPost(post),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
    },
  });
};
export const useUpdatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (post) => updatepost(post),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POST_BY_ID, data?.$id],
      });
    },
  });
};
