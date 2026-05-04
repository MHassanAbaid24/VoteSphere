import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { apiClient } from "@/lib/httpClient";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Status = "verifying" | "success" | "error";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<Status>("verifying");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setErrorMessage("No verification token found in the URL.");
      return;
    }

    const verify = async () => {
      try {
        const res = await apiClient.post("/v1/auth/verify-email", { token });
        if (res.data?.success) {
          setStatus("success");
        } else {
          setStatus("error");
          setErrorMessage(res.data?.error?.message || "Verification failed.");
        }
      } catch (err: any) {
        setStatus("error");
        setErrorMessage(
          err.response?.data?.error?.message || "The link may be invalid or has expired."
        );
      }
    };

    verify();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 flex justify-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-xs font-bold text-primary-foreground">V</span>
            </div>
            <span className="text-lg font-bold text-foreground">VoteSphere</span>
          </Link>
        </div>

        <Card>
          <CardContent className="p-10 text-center space-y-6">
            {/* Verifying */}
            {status === "verifying" && (
              <>
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Verifying your email…</h1>
                  <p className="mt-2 text-sm text-muted-foreground">Please wait a moment.</p>
                </div>
              </>
            )}

            {/* Success */}
            {status === "success" && (
              <>
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Email Verified!</h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Your email address has been successfully verified. You can now access all features of VoteSphere.
                  </p>
                </div>
                <Button asChild className="w-full" size="lg">
                  <Link to="/login">Continue to Login</Link>
                </Button>
              </>
            )}

            {/* Error */}
            {status === "error" && (
              <>
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                    <XCircle className="h-8 w-8 text-destructive" />
                  </div>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Verification Failed</h1>
                  <p className="mt-2 text-sm text-muted-foreground">{errorMessage}</p>
                </div>
                <div className="flex flex-col gap-3">
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/login">
                      <Mail className="mr-2 h-4 w-4" />
                      Resend Verification Email
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" className="w-full">
                    <Link to="/">Back to Home</Link>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail;
