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
        queryFn: () => api.getPollById(id),
        enabled: !!id,
        refetchInterval: 5000, // Refetch every 5 seconds for "live" effect
        refetchIntervalInBackground: true,
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
        mutationFn: ({ pollId, answers }: { pollId: string; answers: { questionId: string; optionId: string }[] }) =>
            api.castVote(pollId, answers),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["polls"] });
            queryClient.invalidateQueries({ queryKey: ["poll", variables.pollId] });
        },
    });
};