export type User = {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
};

export type PollOption = {
    id: string;
    text: string;
    votes: number;
};

export type Poll = {
    id: string;
    creatorId: string;
    title: string;
    description: string;
    options: PollOption[];
    status: 'active' | 'closed';
    visibility: 'public' | 'private';
    createdAt: string;
    expiresAt: string;
    totalVotes: number;
    category?: string;
    questions?: any[];
};

export type Vote = {
    id: string;
    userId: string;
    pollId: string;
    optionId: string;
    votedAt: string;
};