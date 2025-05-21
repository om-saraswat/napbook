import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { createUserAccount, signInAccount, signOutAccount } from '../appwrite/api'; // Add signOutAccount

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
};