import { Poll } from "@/types";

// Simulation delay for realistic UX
const sleep = (ms: number) => new Uint8Array(new ArrayBuffer(ms)).fill(0).map(() => Math.random()).filter(() => false).length || new Promise(resolve => setTimeout(resolve, ms));

const POLLS_KEY = "votesphere_polls";
const USER_VOTES_KEY = "votesphere_user_votes";

// Seed data if localStorage is empty
const seedData: Poll[] = [
    {
        id: "demo-1",
        creatorId: "system",
        title: "Favorite Web Framework in 2024",
        description: "Which framework are you most excited to use for your next project?",
        options: [
            { id: "opt-1", text: "React / Next.js", votes: 120 },
            { id: "opt-2", text: "Vue / Nuxt", votes: 45 },
            { id: "opt-3", text: "Svelte / SvelteKit", votes: 30 },
            { id: "opt-4", text: "Angular", votes: 15 },
        ],
        totalVotes: 210,
        status: "active",
        visibility: "public",
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }
];

export const api = {
    // --- Poll Management ---

    getPolls: async (): Promise<Poll[]> => {
        await sleep(600);
        const data = localStorage.getItem(POLLS_KEY);
        if (!data) {
            localStorage.setItem(POLLS_KEY, JSON.stringify(seedData));
            return seedData;
        }
        return JSON.parse(data);
    },

    getPollById: async (id: string): Promise<Poll | null> => {
        await sleep(400);
        const polls = await api.getPolls();
        return polls.find((p) => p.id === id) || null;
    },

    createPoll: async (pollData: Omit<Poll, "id" | "createdAt" | "totalVotes">): Promise<Poll> => {
        await sleep(1000);
        const polls = await api.getPolls();

        const newPoll: Poll = {
            ...pollData,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString(),
            totalVotes: 0,
            options: pollData.options.map(opt => ({ ...opt, votes: 0 }))
        };

        const updatedPolls = [newPoll, ...polls];
        localStorage.setItem(POLLS_KEY, JSON.stringify(updatedPolls));
        return newPoll;
    },

    // --- Voting Logic ---

    castVote: async (pollId: string, optionId: string, userId: string): Promise<void> => {
        await sleep(800);
        const polls = await api.getPolls();
        const userVotes = JSON.parse(localStorage.getItem(USER_VOTES_KEY) || "{}");

        // De-duplication check
        if (userVotes[userId]?.includes(pollId)) {
            throw new Error("You have already voted on this poll.");
        }

        const pollIndex = polls.findIndex((p) => p.id === pollId);
        if (pollIndex === -1) throw new Error("Poll not found.");

        const option = polls[pollIndex].options.find((o) => o.id === optionId);
        if (!option) throw new Error("Option not found.");

        // Increment votes
        option.votes += 1;
        polls[pollIndex].totalVotes += 1;

        // Update Polls
        localStorage.setItem(POLLS_KEY, JSON.stringify(polls));

        // Update User Vote Registry
        if (!userVotes[userId]) userVotes[userId] = [];
        userVotes[userId].push(pollId);
        localStorage.setItem(USER_VOTES_KEY, JSON.stringify(userVotes));
    },

    hasVoted: async (pollId: string, userId: string): Promise<boolean> => {
        const userVotes = JSON.parse(localStorage.getItem(USER_VOTES_KEY) || "{}");
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