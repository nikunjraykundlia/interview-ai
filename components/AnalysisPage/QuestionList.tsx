import React from "react";

interface QuestionListProps {
  interview: any;
  onClick: (index: number) => void;
  activeQuestionIndex: number;
}

const QuestionList = ({
  interview,
  onClick,
  activeQuestionIndex,
}: QuestionListProps) => {
  return (
    <div className="md:col-span-1 bg-gradient-to-r from-[#b87a9c]/20 to-[#d8a1bc]/10 rounded-xl backdrop-blur-sm border border-[#b87a9c]/30 shadow-lg overflow-hidden p-4 h-fit">
      <h2 className="mb-3 text-lg font-semibold">Questions</h2>
      <div className="space-y-2 max-h-[250px] md:max-h-[calc(100vh-200px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {interview.questions.map((question: any, index: number) => (
          <button
            key={index}
            onClick={() => onClick(index)}
            className={`w-full text-left p-3 rounded-md transition-colors border border-transparent ${!question.answer
              ? "opacity-50 cursor-not-allowed dark:bg-pink-300/10 bg-pink-100/50"
              : activeQuestionIndex === index
                ? "dark:bg-[var(--theme-color)]/30 bg-[var(--theme-color)]/20 dark:text-zinc-300 text-gray-800 border-[var(--theme-color)]/50"
                : "dark:hover:bg-pink-300/30 dark:active:bg-pink-300/40 hover:bg-pink-100/50 active:bg-pink-200/50"
              }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">Q{index + 1}</span>

              {question.analysis && question.answer && (
                <span
                  className={`px-2 py-0.5 text-xs rounded-full border ${question.analysis.score >= 80
                    ? "dark:bg-green-900/30 dark:text-green-300 dark:border-transparent bg-green-100 text-green-800 border-green-300"
                    : question.analysis.score >= 60
                      ? "dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-transparent bg-yellow-100 text-yellow-800 border-yellow-300"
                      : "dark:bg-red-900/30 dark:text-red-300 dark:border-transparent bg-red-100 text-red-800 border-red-300"
                    }`}
                >
                  {question.analysis.score}
                </span>
              )}

              {!question.answer && (
                <span className="px-2 py-0.5 text-xs rounded-full dark:bg-pink-300/10 dark:text-gray-400 bg-pink-100 text-gray-600 border dark:border-transparent border-pink-200">
                  Not Answered
                </span>
              )}
            </div>

            <p className="mt-1 text-sm truncate dark:text-zinc-300 text-gray-600">
              {question.text.length > 50
                ? `${question.text.substring(0, 50)}...`
                : question.text}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuestionList;
