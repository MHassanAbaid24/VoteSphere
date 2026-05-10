import { Poll } from "@/types";
import { apiClient } from "./httpClient";

export type AiInsightStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export type AiInsightResponse = {
    id?: string;
    status: AiInsightStatus;
    updatedAt?: string;
    score?: number | null;
    summary?: string | null;
    errorMessage?: string | null;
    generationCount?: number;
    simulatedVotes?: any;
    personaFeedback?: any;
    sources?: any;
} | null;

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
  visibility: ['public', 'private', 'unlisted'].includes(p.visibility?.toLowerCase()) 
              ? p.visibility.toLowerCase() as 'public' | 'private' | 'unlisted' 
              : 'private',
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
  deletedAt: p.deletedAt,
  expiresAt: p.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  totalVotes: p.totalVotes || 0,
  category: p.category,
  questions: p.questions,
  coverImage: p.coverImage,
});

export const api = {
    // --- Poll Management ---

    getPolls: async (showDeleted?: boolean): Promise<Poll[]> => {
        try {
            const url = showDeleted ? "/v1/polls?showDeleted=true" : "/v1/polls";
            const res = await apiClient.get(url);
            if (res.data?.success && Array.isArray(res.data.data)) {
                return res.data.data.map(mapPoll);
            }
            return [];
        } catch (err) {
            console.error("Error fetching polls:", err);
            return [];
        }
    },

    getMyPolls: async (showDeleted?: boolean): Promise<Poll[]> => {
        try {
            const url = showDeleted ? "/v1/polls/me?showDeleted=true" : "/v1/polls/me";
            const res = await apiClient.get(url);
            if (res.data?.success && Array.isArray(res.data.data)) {
                return res.data.data.map(mapPoll);
            }
            return [];
        } catch (err) {
            console.error("Error fetching my polls:", err);
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
                questions: pollData.questions || [
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
    },

    getTrendingPolls: async (limit: number = 10): Promise<Poll[]> => {
        try {
            const res = await apiClient.get(`/v1/community/trending?limit=${limit}`);
            if (res.data?.success && Array.isArray(res.data.data)) {
                return res.data.data.map(mapPoll);
            }
            return [];
        } catch (err) {
            console.error("Error fetching trending polls:", err);
            return [];
        }
    },

    // --- Notifications Logic ---

    getNotifications: async (filters?: { page?: number; limit?: number; unreadOnly?: boolean }) => {
        try {
            const params = new URLSearchParams();
            if (filters?.page) params.append('page', String(filters.page));
            if (filters?.limit) params.append('limit', String(filters.limit));
            if (filters?.unreadOnly !== undefined) params.append('unreadOnly', String(filters.unreadOnly));

            const res = await apiClient.get(`/v1/notifications?${params.toString()}`);
            if (res.data?.success) {
                return {
                    notifications: res.data.data || [],
                    pagination: res.data.pagination
                };
            }
            return { notifications: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } };
        } catch (err) {
            console.error("Error fetching notifications:", err);
            return { notifications: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } };
        }
    },

    getUnreadNotificationsCount: async (): Promise<number> => {
        try {
            const res = await apiClient.get("/v1/notifications/count");
            if (res.data?.success) {
                return res.data.data?.count ?? 0;
            }
            return 0;
        } catch (err) {
            console.error("Error fetching unread count:", err);
            return 0;
        }
    },

    markAllNotificationsAsRead: async (): Promise<void> => {
        try {
            await apiClient.patch("/v1/notifications/read-all");
        } catch (err) {
            console.error("Error marking all notifications as read:", err);
            throw err;
        }
    },

    markNotificationAsRead: async (id: string): Promise<void> => {
        try {
            await apiClient.patch(`/v1/notifications/${id}`);
        } catch (err) {
            console.error(`Error marking notification ${id} as read:`, err);
            throw err;
        }
    },

    startAiValidation: async (pollId: string): Promise<AiInsightResponse> => {
        try {
            const res = await apiClient.post(`/v1/polls/${pollId}/ai-validate`);
            if (res.data?.success) {
                return res.data?.data ?? null;
            }
            throw new Error(res.data?.error?.message || "Failed to start AI validation");
        } catch (err: any) {
            console.error(`Error starting AI validation for poll ${pollId}:`, err);
            throw new Error(err.response?.data?.error?.message || err.message || "Failed to start AI validation");
        }
    },

    getAiValidationStatus: async (pollId: string): Promise<AiInsightResponse> => {
        try {
            const res = await apiClient.get(`/v1/polls/${pollId}/ai-validate`);
            if (res.data?.success) {
                return res.data?.data ?? null;
            }
            return null;
        } catch (err) {
            console.error(`Error fetching AI validation status for poll ${pollId}:`, err);
            return null;
        }
    },
};
