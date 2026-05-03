import { Poll } from "@/types";
import { apiClient } from "./httpClient";

const mapPoll = (p: any): Poll => ({
  id: p.id,
  creatorId: p.creatorId,
  title: p.title,
  description: p.description,
  options: p.questions?.[0]?.options?.map((opt: any) => ({
    id: opt.id,
    text: opt.text,
    votes: opt.votes || 0,
  })) || [],
  status: p.status?.toLowerCase() === 'active' ? 'active' : 'closed',
  visibility: p.visibility?.toLowerCase() === 'public' ? 'public' : 'private',
  createdAt: p.createdAt,
  expiresAt: p.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  totalVotes: p.totalVotes || 0,
  category: p.category,
});

export const api = {
    // --- Poll Management ---

    getPolls: async (): Promise<Poll[]> => {
        try {
            const res = await apiClient.get("/v1/polls");
            if (res.data?.success && Array.isArray(res.data.data)) {
                return res.data.data.map(mapPoll);
            }
            return [];
        } catch (err) {
            console.error("Error fetching polls:", err);
            return [];
        }
    },

    getPollById: async (id: string): Promise<Poll | null> => {
        try {
            const res = await apiClient.get(`/v1/polls/${id}`);
            if (res.data?.success && res.data?.data) {
                return mapPoll(res.data.data);
            }
            return null;
        } catch (err) {
            console.error(`Error fetching poll ${id}:`, err);
            return null;
        }
    },

    createPoll: async (pollData: Omit<Poll, "id" | "createdAt" | "totalVotes">): Promise<Poll> => {
        try {
            const res = await apiClient.post("/v1/polls", {
                title: pollData.title,
                description: pollData.description,
                visibility: pollData.visibility?.toUpperCase() || "PUBLIC",
                status: "ACTIVE",
                category: pollData.category,
                expiresAt: pollData.expiresAt,
                questions: [
                    {
                        text: "Default Question",
                        options: pollData.options.map(opt => ({ text: opt.text }))
                    }
                ]
            });

            if (res.data?.success && res.data?.data) {
                return mapPoll(res.data.data);
            }
            throw new Error(res.data?.error?.message || "Failed to create poll");
        } catch (err: any) {
            console.error("Error creating poll:", err);
            throw new Error(err.response?.data?.error?.message || err.message || "Failed to create poll");
        }
    },

    // --- Voting Logic ---

    castVote: async (pollId: string, optionId: string, userId: string): Promise<void> => {
        const polls = await api.getPolls();
        const userVotes = JSON.parse(localStorage.getItem("votesphere_user_votes") || "{}");

        // De-duplication check
        if (userVotes[userId]?.includes(pollId)) {
            throw new Error("You have already voted on this poll.");
        }

        const pollIndex = polls.findIndex((p) => p.id === pollId);
        if (pollIndex === -1) throw new Error("Poll not found.");

        const option = polls[pollIndex].options.find((o) => o.id === optionId);
        if (!option) throw new Error("Option not found.");

        option.votes += 1;
        polls[pollIndex].totalVotes += 1;

        if (!userVotes[userId]) userVotes[userId] = [];
        userVotes[userId].push(pollId);
        localStorage.setItem("votesphere_user_votes", JSON.stringify(userVotes));
    },

    hasVoted: async (pollId: string, userId: string): Promise<boolean> => {
        const userVotes = JSON.parse(localStorage.getItem("votesphere_user_votes") || "{}");
        return userVotes[userId]?.includes(pollId) || false;
    },

    // --- Statistics Helpers ---

    getGlobalStats: async () => {
        const polls = await api.getPolls();
        const totalVotes = polls.reduce((sum, p) => sum + p.totalVotes, 0);
        const activePolls = polls.filter(p => p.status === "active").length;

        return {
            totalPolls: polls.length,
            totalVotes,
            activePolls
        };
    }
};