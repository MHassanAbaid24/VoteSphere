import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Poll } from "@/types";

export const usePolls = () => {
    return useQuery({
        queryKey: ["polls"],
        queryFn: api.getPolls,
    });
};

export const usePoll = (id: string) => {
    return useQuery({
        queryKey: ["poll", id],
        queryFn: () => api.getPoll(id),
        enabled: !!id,
    });
};

export const useCreatePoll = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.createPoll,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["polls"] });
        },
    });
};

export const useCastVote = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ pollId, optionId }: { pollId: string; optionId: string }) =>
            api.castVote(pollId, optionId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["polls"] });
            queryClient.invalidateQueries({ queryKey: ["poll", variables.pollId] });
        },
    });
};