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
import { SigninValidation } from "../../lib/validation";
import Loader from "../../components/shared/Loader";
import { useCreateUserAccountMutation, useSignInAccount, useSignOutAccount } from "../../lib/react-query/querieandmutation";
import { useUserContext } from "../../context/AuthContext";
import { getCurrentUser } from "../../lib/appwrite/api";

const SigninForm = () => {
  const { toast } = useToast();
  const { mutateAsync: signInAccount, isPending } = useSignInAccount();
  const { mutateAsync: signOutAccount } = useSignOutAccount();
  const { checkAuthUser, isLoading: isUserLoading } = useUserContext();
  const navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(SigninValidation),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values) {
    try {
      

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
          <img src="./public/logo.png" alt="logo" className="rounded-full w-100 h-20" />

          <h2 className="h3-bold md:h2-bold pt-5 sm:pt-12">Log-in to a account</h2>
          <p className="text-light-3 small-medium md:base-regular">
            Please enter your details
          </p>

          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5 w-full mt-4">
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
              {isUserLoading ? (
                <div className="flex-center flex-col gap-2">
                  <Loader /> Loading...
                </div>
              ) : (
                <div>Log in</div>
              )}
            </Button>

            <p className="text-small-regular text-light-2 text-center mt-2">
              Don't have a account
              <Link to="/sign-up" className="text-primary-500 text-small-semibold ml-1">Sign-up</Link>
            </p>
          </form>
        </div>
      </Form>
    </div>
  );
};

export default SigninForm;