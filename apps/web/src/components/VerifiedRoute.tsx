import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiClient } from "@/lib/httpClient";
import { toast } from "sonner";

/**
 * Wraps a route that requires email verification.
 * Must be used INSIDE a <ProtectedRoute> so that `user` is always present.
 */
export const VerifiedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, isLoading } = useAuth();
    const [isResending, setIsResending] = useState(false);

    const handleResend = async () => {
        if (!user?.email) return;
        setIsResending(true);
        try {
            await apiClient.post("/v1/auth/resend-verification", { email: user.email });
            toast.success("Verification email resent successfully! Please check your inbox.");
        } catch (err: any) {
            toast.error(err.response?.data?.error?.message || "Failed to resend. Please try again later.");
        } finally {
            setIsResending(false);
        }
    };

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    if (user && user.emailVerified === false) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-6">
                <div className="w-full max-w-md">
                    <Card>
                        <CardContent className="p-10 text-center space-y-6">
                            <div className="flex justify-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                                    <MailCheck className="h-8 w-8 text-primary" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-foreground">Email Verification Required</h1>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Please verify your email address before using this feature.
                                    Check your inbox at <span className="font-medium text-foreground">{user.email}</span> for the verification link.
                                </p>
                            </div>
                            <div className="flex flex-col gap-3">
                                <Button onClick={handleResend} disabled={isResending} variant="default" className="w-full">
                                    {isResending ? "Resending..." : "Resend Verification Email"}
                                </Button>
                                <Button asChild variant="outline" className="w-full">
                                    <Link to="/dashboard">Back to Dashboard</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};
