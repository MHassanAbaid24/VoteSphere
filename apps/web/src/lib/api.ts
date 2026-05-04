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
  questions: p.questions,
  coverImage: p.coverImage,
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

    castVote: async (pollId: string, answers: { questionId: string; optionId: string }[]): Promise<void> => {
        try {
            const res = await apiClient.post(`/v1/polls/${pollId}/vote`, { answers });
            if (!res.data?.success) {
                throw new Error(res.data?.error?.message || "Failed to cast vote");
            }
        } catch (err: any) {
            console.error("Error casting vote:", err);
            throw new Error(err.response?.data?.error?.message || err.message || "Failed to cast vote");
        }
    },

    hasVoted: async (pollId: string, userId?: string): Promise<boolean> => {
        try {
            const res = await apiClient.get(`/v1/polls/${pollId}/vote/status`);
            if (res.data?.success && res.data?.data) {
                return res.data.data.hasVoted ?? false;
            }
            return false;
        } catch (err) {
            console.error(`Error checking voted status for poll ${pollId}:`, err);
            return false;
        }
    },


    // --- Statistics Helpers ---

    getGlobalStats: async () => {
        try {
            const res = await apiClient.get("/v1/analytics/global");
            if (res.data?.success && res.data?.data) {
                return res.data.data;
            }
            return { totalPolls: 0, totalVotes: 0, activePolls: 0 };
        } catch (err) {
            console.error("Error fetching global stats:", err);
            return { totalPolls: 0, totalVotes: 0, activePolls: 0 };
        }
    }
};