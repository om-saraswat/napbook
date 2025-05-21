import { useNavigate, useLocation } from "react-router-dom";
import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/appwrite/api";

export const INITIAL_USER = {
  id: "",
  name: "",
  username: "",
  email: "",
  imageUrl: "",
  bio: "",
};

const INITIAL_STATE = {
  user: INITIAL_USER,
  isLoading: false,
  isAuthenticated: false,
  setUser: () => {},
  setIsAuthenticated: () => {},
  checkAuthUser: async () => false,
};

const AuthContext = createContext(INITIAL_STATE);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(INITIAL_USER);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const checkAuthUser = async () => {
    setIsLoading(true);
    try {
      const currentAccount = await getCurrentUser();
      if (currentAccount) {
        setUser({
          id: currentAccount.$id,
          name: currentAccount.name,
          username: currentAccount.username,
          email: currentAccount.email,
          imageUrl: currentAccount.imageurl || "", // Match the database schema
          bio: currentAccount.bio || "",
        });
        setIsAuthenticated(true);
        console.log("User state updated:", {
          id: currentAccount.$id,
          name: currentAccount.name,
          username: currentAccount.username,
          email: currentAccount.email,
          imageUrl: currentAccount.imageurl || "",
          bio: currentAccount.bio || "",
        }); // Debugging log
        return true;
      }
      setUser(INITIAL_USER); // Reset user state if no user is found
      setIsAuthenticated(false);
      return false;
    } catch (error) {
      console.error("Auth check error:", error);
      setUser(INITIAL_USER);
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (location.pathname === "/sign-up" || location.pathname === "/sign-in") {
      return;
    }

    const verifyAuth = async () => {
      const isAuth = await checkAuthUser();
      if (!isAuth) {
        navigate("/sign-in");
      }
    };

    verifyAuth();
  }, [navigate, location.pathname]);

  const value = {
    user,
    setUser,
    isLoading,
    isAuthenticated,
    setIsAuthenticated,
    checkAuthUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useUserContext = () => useContext(AuthContext);