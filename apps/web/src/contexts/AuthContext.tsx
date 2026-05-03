import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/types";

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string) => Promise<void>;
    signup: (name: string, email: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for persisted session
        const savedUser = localStorage.getItem("votesphere_user");
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string) => {
        // Mock authentication logic
        const mockUser: User = {
            id: "user-" + Math.random().toString(36).substr(2, 4),
            name: email.split("@")[0],
            email: email,
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        };
        localStorage.setItem("votesphere_user", JSON.stringify(mockUser));
        setUser(mockUser);
    };

    const signup = async (name: string, email: string) => {
        const mockUser: User = {
            id: "user-" + Math.random().toString(36).substr(2, 4),
            name,
            email,
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
        };
        localStorage.setItem("votesphere_user", JSON.stringify(mockUser));
        setUser(mockUser);
    };

    const logout = () => {
        localStorage.removeItem("votesphere_user");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};