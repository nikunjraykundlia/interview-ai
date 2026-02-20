import React from "react";

const FeedbackTabData = ({ interview }: { interview: any }) => {
  if (!interview.feedback) {
    return (
      <div className="p-6 bg-gradient-to-r from-[#b87a9c]/20 to-[#d8a1bc]/10 rounded-xl backdrop-blur-sm border border-[#b87a9c]/30 shadow-lg overflow-hidden">
        <h2 className="mb-4 text-xl font-bold">Detailed Feedback</h2>
        <p className="dark:text-gray-300 text-gray-700">Feedback is being generated. Please refresh the page.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-r from-[#b87a9c]/20 to-[#d8a1bc]/10 rounded-xl backdrop-blur-sm border border-[#b87a9c]/30 shadow-lg overflow-hidden">
      <h2 className="mb-4 text-xl font-bold">Detailed Feedback</h2>

      <div className="mb-6">
        <h3 className="mb-2 text-lg font-semibold">Overall Assasement</h3>
        <p className="dark:text-gray-300 text-gray-700">{interview.feedback.overallFeedback || "No feedback available"}</p>
      </div>

      <div>
        <h3 className="mb-2 text-lg font-semibold dark:text-blue-400 text-blue-700">
          Improvement Goals
        </h3>
        <ul className="pl-5 space-y-2 list-disc">
          {(interview.feedback.nextSteps || []).map((step: string, index: number) => (
            <li key={index} className="dark:text-gray-300 text-gray-700">
              {step}
            </li>
          ))}
        </ul>
      </div>

      <div className="p-4 mt-8 rounded-lg dark:bg-pink-900/10 bg-pink-100/60">
        <h3 className="mb-2 font-semibold dark:text-red-400 text-red-700">
          Question-by-Question Feedback
        </h3>

        <div className="space-y-4">
          {interview.questions.map((question: any, index: number) => (
            <div
              key={index}
              className="pb-4 border-b dark:border-pink-800/40 border-pink-300 last:border-b-0"
            >
              <h4 className="font-medium">
                {" "}
                Question {index + 1}: {question.text.substring(0, 100)}...{" "}
              </h4>
              <div className="grid grid-cols-1 gap-10 mt-2 md:grid-cols-2">
                <div>
                  <h5 className="dark:text-gray-400 text-gray-600 font-medium">Technical Feedback:</h5>
                  <p className="text-sm">
                    {question.analysis?.technicalFeedback || "No technical feedback available"}
                  </p>
                </div>
                <div>
                  <h5 className="dark:text-gray-400 text-gray-600 font-medium">Communication Feedback:</h5>
                  <p className="text-sm">
                    {question.analysis?.communicationFeedback || "No communication feedback available"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeedbackTabData;
