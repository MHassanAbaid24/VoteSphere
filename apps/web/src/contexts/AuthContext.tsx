import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/types";
import { apiClient } from "@/lib/httpClient";
import { tokenStore } from "@/lib/tokenStore";

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password?: string) => Promise<void>;
    signup: (name: string, email: string, password?: string) => Promise<{ emailSent: boolean }>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Try to restore the session using silent refresh on application mount
        const initAuth = async () => {
            try {
                // Call /v1/auth/refresh to rotate/get a new token
                const res = await apiClient.post("/v1/auth/refresh");
                const token = res.data?.data?.accessToken;
                if (token) {
                    tokenStore.set(token);
                    // Fetch user info with the newly obtained access token
                    const meRes = await apiClient.get("/v1/auth/me");
                    if (meRes.data?.success && meRes.data?.data?.user) {
                        setUser(meRes.data.data.user);
                    }
                }
            } catch (err: any) {
                const status = err.response?.status;
                if (status === 429 || (status && status >= 500)) {
                    return;
                }
                // If silent refresh fails, clear tokenStore
                tokenStore.clear();
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, []);

    const refreshUser = async () => {
        try {
            const meRes = await apiClient.get("/v1/auth/me");
            if (meRes.data?.success && meRes.data?.data?.user) {
                setUser(meRes.data.data.user);
            }
        } catch (err) {
            // Ignore any fetch errors during background/manual profile updates
        }
    };

    const login = async (email: string, password?: string) => {
        try {
            const res = await apiClient.post("/v1/auth/login", { email, password });
            if (res.data?.success && res.data?.data?.accessToken) {
                tokenStore.set(res.data.data.accessToken);
                setUser(res.data.data.user);
            } else {
                throw new Error(res.data?.error?.message || "Login failed");
            }
        } catch (err: any) {
            const backendError = err.response?.data?.error?.message;
            if (backendError) {
                throw new Error(backendError);
            }
            throw new Error(err.message || "Login failed");
        }
    };

    const signup = async (name: string, email: string, password?: string): Promise<{ emailSent: boolean }> => {
        try {
            const res = await apiClient.post("/v1/auth/register", { name, email, password });
            if (res.data?.success && res.data?.data?.accessToken) {
                tokenStore.set(res.data.data.accessToken);
                setUser(res.data.data.user);
                return { emailSent: res.data.data.emailSent ?? false };
            } else {
                throw new Error(res.data?.error?.message || "Failed to create account");
            }
        } catch (err: any) {
            const backendError = err.response?.data?.error?.message;
            if (backendError) {
                throw new Error(backendError);
            }
            throw new Error(err.message || "Failed to create account");
        }
    };

    const logout = async () => {
        try {
            await apiClient.post("/v1/auth/logout");
        } finally {
            tokenStore.clear();
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, signup, logout, refreshUser }}>
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