import React from "react";

interface OverviewTabDataProps {
  interview: any;
  scoreLabel: any;
  scoreColor: any;
}

const OverviewTabData = ({
  interview,
  scoreColor,
  scoreLabel,
}: OverviewTabDataProps) => {
  return (
    <div className="bg-gradient-to-r from-[#b87a9c]/20 to-[#d8a1bc]/10 rounded-xl backdrop-blur-sm border border-[#b87a9c]/30 shadow-lg overflow-hidden p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">Overall Performance</h2>

      <div className="flex flex-col items-center justify-center mb-6">
        {/* Overall Score Display */}
        <div className="flex flex-col items-center gap-2">
          <div
            className={`text-5xl font-bold ${scoreColor(
              interview.overallScore || 0
            )}`}
          >
            {interview.overallScore || 0}
          </div>
          <div
            className={`text-xl font-semibold ${scoreColor(
              interview.overallScore || 0
            )}`}
          >
            {scoreLabel(interview.overallScore || 0)}
          </div>
        </div>
      </div>

      {interview.feedback && (
        <div className="space-y-6">
          {/* Overall Feedback and Next Steps - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overall Feedback */}
            <div className="bg-zinc-800/20 rounded-lg p-4 border border-zinc-700/30">
              <h3 className="font-semibold text-lg text-zinc-300 mb-2">
                Overall Feedback
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {interview.feedback.overallFeedback || "No overall feedback available"}
              </p>
            </div>

            {/* Next Steps */}
            <div className="bg-zinc-800/20 rounded-lg p-4 border border-zinc-700/30">
              <h3 className="font-semibold text-lg text-zinc-300 mb-2">
                Next Steps
              </h3>
              <ul className="list-disc pl-5 space-y-1">
                {(interview.feedback.nextSteps || []).length > 0 ? (
                  interview.feedback.nextSteps.map(
                    (step: string, index: number) => (
                      <li className="text-gray-300 text-sm" key={index}>
                        {step}
                      </li>
                    )
                  )
                ) : (
                  <li className="text-gray-400 text-sm italic">No next steps provided</li>
                )}
              </ul>
            </div>
          </div>

          {/* Strengths and Areas for Improvement - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* strengths */}
            <div className="bg-green-900/20 rounded-lg p-4">
              <h3 className="font-semibold text-lg text-green-400 mb-2">
                Strengths
              </h3>
              <ul className="list-disc pl-5 space-y-1">
                {(interview.feedback.strengths || []).length > 0 ? (
                  interview.feedback.strengths.map(
                    (strength: string, index: number) => (
                      <li className="text-gray-300 text-sm" key={index}>
                        {strength}
                      </li>
                    )
                  )
                ) : (
                  <li className="text-gray-400 text-sm italic">No strengths identified</li>
                )}
              </ul>
            </div>

            {/* areas of improvement */}
            <div className="bg-red-900/20 rounded-lg p-4">
              <h3 className="font-semibold text-lg text-red-400 mb-2">
                Areas for Improvement
              </h3>
              <ul className="list-disc pl-5 space-y-1">
                {(interview.feedback.areasForImprovement || []).length > 0 ? (
                  interview.feedback.areasForImprovement.map(
                    (area: string, index: number) => (
                      <li className="text-gray-300 text-sm" key={index}>
                        {area}
                      </li>
                    )
                  )
                ) : (
                  <li className="text-gray-400 text-sm italic">No areas for improvement identified</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewTabData;
