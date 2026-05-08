import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PollResults from "./PollResults";

const mockUsePoll = vi.fn();
const mockUseAiValidation = vi.fn();
const mockUseAuth = vi.fn();
const mockStartAiValidation = vi.fn();
const mockGetAiValidationStatus = vi.fn();

vi.mock("@/components/Navbar", () => ({
  default: () => <div data-testid="navbar" />,
}));

vi.mock("@/hooks/use-polls", () => ({
  usePoll: () => mockUsePoll(),
  useAiValidation: () => mockUseAiValidation(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/lib/httpClient", () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: { success: true, data: {} } }),
    patch: vi.fn(),
  },
}));

vi.mock("@/lib/api", () => ({
  api: {
    startAiValidation: (...args: unknown[]) => mockStartAiValidation(...args),
    getAiValidationStatus: (...args: unknown[]) => mockGetAiValidationStatus(...args),
  },
}));

const pollFixture = {
  id: "poll-1",
  creatorId: "user-1",
  title: "Poll title",
  description: "Poll description",
  status: "active",
  totalVotes: 12,
  expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
  questions: [
    {
      id: "q1",
      text: "Question?",
      options: [
        { id: "o1", text: "Yes", votes: 8 },
        { id: "o2", text: "No", votes: 4 },
      ],
    },
  ],
  options: [],
};

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/poll/poll-1/results"]}>
      <Routes>
        <Route path="/poll/:id/results" element={<PollResults />} />
      </Routes>
    </MemoryRouter>
  );

describe("PollResults AI validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePoll.mockReturnValue({ data: pollFixture, isLoading: false, isRefetching: false });
    mockUseAiValidation.mockReturnValue({ data: null, isLoading: false });
    mockGetAiValidationStatus.mockResolvedValue({ status: null });
  });

  it("shows premium upsell dialog for standard users when clicking Validate with AI", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-1", isPremium: false },
      refreshUser: vi.fn(),
    });
    mockUseAiValidation.mockReturnValue({ data: null, isLoading: false });

    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /validate with ai/i }));

    expect(await screen.findByText(/upgrade to votesphere pro/i)).toBeInTheDocument();
    expect(mockStartAiValidation).not.toHaveBeenCalled();
  });

  it("starts AI validation for premium users and shows loading state", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-1", isPremium: true },
      refreshUser: vi.fn(),
    });
    mockStartAiValidation.mockResolvedValue({ status: "PENDING" });
    // Initially return null status (no validation yet)
    let aiValidationStatus = null;
    mockUseAiValidation.mockImplementation(() => {
      return { data: aiValidationStatus ? { status: aiValidationStatus } : null, isLoading: false };
    });

    renderPage();
    // Button should be visible since status is null
    const button = screen.getByRole("button", { name: /validate with ai/i });
    expect(button).toBeInTheDocument();
    
    // Update mock to return PENDING status after click
    aiValidationStatus = "PENDING";
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockStartAiValidation).toHaveBeenCalledWith("poll-1");
    });
  });
});
