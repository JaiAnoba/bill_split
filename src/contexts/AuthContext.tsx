import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

type UserTier = "guest" | "standard" | "premium";

interface User {
  id: string;
  name: string;
  email: string;
  nickname: string;
  tier: UserTier;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo purposes
const MOCK_USERS = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    nickname: "Johnny",
    password: "password123", // In a real app, this would be hashed
    tier: "standard" as UserTier,
    billsCreated: 2,
    maxBills: 5,
    maxParticipants: 3,
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    nickname: "Janey",
    password: "password123",
    tier: "premium" as UserTier,
    billsCreated: 8,
    maxBills: Infinity,
    maxParticipants: Infinity,
  },
  {
    id: "3",
    name: "Guest User",
    email: "guest@example.com",
    nickname: "Guest",
    password: "guest123",
    tier: "guest" as UserTier,
    billsCreated: 0,
    maxBills: 1,
    maxParticipants: 2,
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("billsplit_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const foundUser = MOCK_USERS.find(
        (u) => u.email === email && u.password === password,
      );
      if (!foundUser) {
        throw new Error("Invalid credentials");
      }

      // Remove password before storing
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword as User);
      localStorage.setItem(
        "billsplit_user",
        JSON.stringify(userWithoutPassword),
      );
      // Ensure navigation to dashboard after successful login
      navigate("/dashboard");
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Create new user with appropriate tier
      const newUser: User = {
        id: `user_${Date.now()}`,
        name: `${userData.firstName} ${userData.lastName}`,
        email: userData.email,
        nickname: userData.nickname,
        tier: userData.userTier,
      };

      setUser(newUser);
      localStorage.setItem("billsplit_user", JSON.stringify(newUser));
      navigate("/");
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("billsplit_user");
    // Ensure navigation to home/login page after logout
    navigate("/");
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem("billsplit_user", JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Using named function declaration for better Fast Refresh compatibility
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
