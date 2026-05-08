interface FeasibilityScoreProps {
  score: number;
  summary: string;
}

export const FeasibilityScore = ({ score, summary }: FeasibilityScoreProps) => {
  // Calculate circumference for progress ring (radius 45, so circumference = 2*π*45 ≈ 283)
  const circumference = 283;
  const offset = circumference - (score / 100) * circumference;

  // Color based on score
  let scoreColor = 'text-red-500';
  let ringColor = '#ef4444';
  let bgColor = 'from-red-500/5 to-red-500/5';

  if (score >= 70) {
    scoreColor = 'text-green-500';
    ringColor = '#22c55e';
    bgColor = 'from-green-500/5 to-green-500/5';
  } else if (score >= 50) {
    scoreColor = 'text-yellow-500';
    ringColor = '#eab308';
    bgColor = 'from-yellow-500/5 to-yellow-500/5';
  }

  return (
    <div className={`p-6 rounded-lg border border-primary/20 bg-gradient-to-br ${bgColor} backdrop-blur-sm`}>
      <h3 className="text-lg font-semibold text-white mb-6">Feasibility Analysis</h3>

      <div className="flex flex-col items-center gap-6">
        {/* Score Ring */}
        <div className="relative w-40 h-40">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#ffffff"
              strokeWidth="3"
              opacity="0.1"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={ringColor}
              strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{
                transition: 'stroke-dashoffset 0.6s ease-in-out',
              }}
            />
          </svg>
          {/* Score text in center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-bold ${scoreColor}`}>{score}</span>
            <span className="text-xs text-gray-400 mt-1">/ 100</span>
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <div className="w-full">
            <p className="text-sm text-gray-300 leading-relaxed text-center">{summary}</p>
          </div>
        )}
      </div>
    </div>
  );
};
