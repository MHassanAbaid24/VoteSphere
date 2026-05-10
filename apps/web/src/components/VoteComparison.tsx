interface VoteOption {
  id: string;
  text: string;
}

interface VoteData {
  realVotes: Record<string, number>;
  simulatedVotes: Record<string, number>;
  options: VoteOption[];
}

interface VoteComparisonProps {
  questionId: string;
  questionText: string;
  data: VoteData;
}

export const VoteComparison = ({ questionText, data }: VoteComparisonProps) => {
  // Calculate max votes for scaling
  const allVotes = [
    ...Object.values(data.realVotes),
    ...Object.values(data.simulatedVotes),
  ];
  const maxVotes = Math.max(...allVotes, 1);

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-foreground text-sm">{questionText}</h4>

      <div className="space-y-3">
        {data.options.map((option) => {
          const realCount = data.realVotes[option.id] || 0;
          const simCount = data.simulatedVotes[option.id] || 0;
          const realPercent = (realCount / maxVotes) * 100;
          const simPercent = (simCount / maxVotes) * 100;

          return (
            <div key={option.id} className="space-y-1">
              <div className="text-xs text-muted-foreground font-medium">{option.text}</div>

              {/* Real Votes */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground/80 min-w-8">Real</span>
                <div className="flex-1 h-6 bg-muted/50 rounded border border-primary/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-end px-2 transition-all"
                    style={{ width: `${Math.max(realPercent, 5)}%` }}
                  >
                    {realCount > 0 && <span className="text-xs font-semibold text-white">{realCount}</span>}
                  </div>
                </div>
              </div>

              {/* Simulated Votes */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground/80 min-w-8">AI</span>
                <div className="flex-1 h-6 bg-muted/50 rounded border border-primary/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-end px-2 transition-all"
                    style={{ width: `${Math.max(simPercent, 5)}%` }}
                  >
                    {simCount > 0 && <span className="text-xs font-semibold text-white">{simCount}</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
