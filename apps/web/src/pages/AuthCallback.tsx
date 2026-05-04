import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const processToken = async () => {
      const token = searchParams.get("token");
      if (!token) {
        toast.error("No access token provided from authentication.");
        navigate("/login", { replace: true });
        return;
      }

      try {
        await loginWithToken(token);
        toast.success("Successfully logged in via OAuth!");
        navigate("/dashboard", { replace: true });
      } catch (err: any) {
        toast.error(err.message || "Failed to finalize session.");
        navigate("/login", { replace: true });
      }
    };

    processToken();
  }, [searchParams, loginWithToken, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary animate-pulse">
        <span className="text-xl font-bold text-primary-foreground">V</span>
      </div>
      <p className="text-sm text-muted-foreground animate-pulse">Finalizing your secure session...</p>
    </div>
  );
};

export default AuthCallback;
