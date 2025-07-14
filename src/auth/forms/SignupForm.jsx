import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SignupValidation } from "../../lib/validation";
import Loader from "../../components/shared/Loader";
import { useCreateUserAccountMutation, useSignInAccount, useSignOutAccount } from "../../lib/react-query/querieandmutation";
import { useUserContext } from "../../context/AuthContext";
import { getCurrentUser } from "../../lib/appwrite/api";

const SignupForm = () => {
  const { toast } = useToast();
  const { mutateAsync: createUserAccount, isPending: isCreatingUser } = useCreateUserAccountMutation();
  const { mutateAsync: signInAccount, isPending: isSignIn } = useSignInAccount();
  const { mutateAsync: signOutAccount } = useSignOutAccount();
  const { checkAuthUser, isLoading: isUserLoading } = useUserContext();
  const navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(SignupValidation),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values) {
    try {
      console.log("Starting signup with values:", values);
      const newUser = await createUserAccount(values);

      if (!newUser) {
        toast({
          title: "Sign-up failed",
          description: "Failed to create user in database",
          variant: "destructive",
        });
        return;
      }
      console.log("New user created:", newUser);

      // Sign out any existing session before creating a new one
      const signOutResult = await signOutAccount();
      if (signOutResult) {
        console.log("Signed out existing session:", signOutResult);
      } else {
        console.log("No existing session to sign out");
      }

      const session = await signInAccount({
        email: values.email,
        password: values.password,
      });
      console.log("Session created:", session);

      if (!session) {
        toast({
          title: "Sign-in failed",
          description: "Please try signing in manually",
          variant: "destructive",
        });
        return;
      }

      const isLoggedIn = await checkAuthUser();
      const currentUser = await getCurrentUser();
      console.log("Is logged in:", isLoggedIn, "User:", currentUser);

      if (isLoggedIn) {
        form.reset();
        navigate("/");
      } else {
        toast({
          title: "Authentication failed",
          description: "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("SignUp error:", error);
      // Handle duplicate email error
      if (error.message.includes("A user with the same id, email, or phone already exists")) {
        toast({
          title: "Sign-up failed",
          description: (
            <span>
              A user with this email already exists. Please{" "}
              <Link to="/sign-in" className="text-primary-500 underline">
                sign in
              </Link>{" "}
              or use a different email.
            </span>
          ),
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "An unexpected error occurred",
          variant: "destructive",
        });
      }
    }
  }

  return (
    <div>
      <Form {...form}>
        <div className="sm:w-420 flex-center flex-col">
          <img src="./public/logo.svg" alt="logo" className="rounded-full w-100 h-20" />

          <h2 className="h3-bold md:h2-bold pt-5 sm:pt-12">Create a new account</h2>
          <p className="text-light-3 small-medium md:base-regular">
            To use Napbook, please enter your details
          </p>

          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5 w-full mt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input type="text" className="shad-input" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input type="text" className="shad-input" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" className="shad-input" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" className="shad-input" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="shad-button_primary">
              {isCreatingUser ? (
                <div className="flex-center flex-col gap-2">
                  <Loader /> Loading...
                </div>
              ) : (
                <div>Sign up</div>
              )}
            </Button>

            <p className="text-small-regular text-light-2 text-center mt-2">
              Already have an account?
              <Link to="/sign-in" className="text-primary-500 text-small-semibold ml-1">Log in</Link>
            </p>
          </form>
        </div>
      </Form>
    </div>
  );
};

export default SignupForm;