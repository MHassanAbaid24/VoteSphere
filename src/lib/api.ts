import { Poll, Vote } from "@/types";

const DELAY = 500;
const POLLS_KEY = "votesphere_polls";
const VOTES_KEY = "votesphere_votes";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Initial Data Seed
const seedData = () => {
    if (!localStorage.getItem(POLLS_KEY)) {
        const initialPolls: Poll[] = [
            {
                id: "1",
                creatorId: "user-1",
                title: "Community Future Initiative",
                description: "Which priority should our local government focus on for the next fiscal year?",
                options: [
                    { id: "opt-1", text: "Renewable Energy Projects", votes: 2430 },
                    { id: "opt-2", text: "Public Transport Expansion", votes: 1620 },
                    { id: "opt-3", text: "Local Park Renovations", votes: 1350 },
                ],
                status: "active",
                visibility: "public",
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                totalVotes: 5400,
                category: "Community"
            }
        ];
        localStorage.setItem(POLLS_KEY, JSON.stringify(initialPolls));
    }
};

seedData();

export const api = {
    getPolls: async (): Promise<Poll[]> => {
        await sleep(DELAY);
        return JSON.parse(localStorage.getItem(POLLS_KEY) || "[]");
    },

    getPoll: async (id: string): Promise<Poll | undefined> => {
        await sleep(DELAY);
        const polls = JSON.parse(localStorage.getItem(POLLS_KEY) || "[]") as Poll[];
        return polls.find((p) => p.id === id);
    },

    createPoll: async (pollData: Omit<Poll, "id" | "createdAt" | "totalVotes">): Promise<Poll> => {
        await sleep(DELAY);
        const polls = JSON.parse(localStorage.getItem(POLLS_KEY) || "[]");
        const newPoll: Poll = {
            ...pollData,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString(),
            totalVotes: 0,
        };
        localStorage.setItem(POLLS_KEY, JSON.stringify([newPoll, ...polls]));
        return newPoll;
    },

    castVote: async (pollId: string, optionId: string): Promise<void> => {
        await sleep(DELAY);
        const polls = JSON.parse(localStorage.getItem(POLLS_KEY) || "[]") as Poll[];
        const pollIndex = polls.findIndex((p) => p.id === pollId);

        if (pollIndex !== -1) {
            const option = polls[pollIndex].options.find((o) => o.id === optionId);
            if (option) {
                option.votes += 1;
                polls[pollIndex].totalVotes += 1;
                localStorage.setItem(POLLS_KEY, JSON.stringify(polls));
            }
        }
    }
};