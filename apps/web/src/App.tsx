import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { VerifiedRoute } from "@/components/VerifiedRoute";

import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import CreatePoll from "./pages/CreatePoll";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import PollResults from "./pages/PollResults";
import VotePoll from "./pages/VotePoll";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import VerifyEmail from "./pages/VerifyEmail";
import AuthCallback from "./pages/AuthCallback";
import MyPolls from "./pages/MyPolls";
import Community from "./pages/Community";
import AboutUs from "./pages/AboutUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/poll/:id/results" element={<PollResults />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/community" element={<Community />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<Terms />} />

            {/* Protected Routes — login required */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/my-polls" element={<ProtectedRoute><MyPolls /></ProtectedRoute>} />

            {/* Protected + Verified Routes — email verification required */}
            <Route path="/create-poll" element={<ProtectedRoute><VerifiedRoute><CreatePoll /></VerifiedRoute></ProtectedRoute>} />
            <Route path="/poll/:id" element={<ProtectedRoute><VerifiedRoute><VotePoll /></VerifiedRoute></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><VerifiedRoute><Profile /></VerifiedRoute></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;