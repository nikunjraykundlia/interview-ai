import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Interview from "@/models/Interview";
import { getUserIdFromToken } from "@/lib/auth";
import { fireAnalyzerWebhookAsync, AnalysisResult } from "@/lib/n8nAnalyzer";

/**
 * Background function to update interview with analysis results when webhook completes
 * This runs asynchronously and doesn't block the main response
 */
async function updateInterviewAnalysisInBackground(
  interviewId: string,
  questionIndex: number,
  analysisResult: AnalysisResult,
  userId: string
): Promise<void> {
  try {
    // Ensure database connection
    await connectDB();

    // Find the interview
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      console.error(
        `[Background] Interview not found: ${interviewId} for analysis update`
      );
      return;
    }

    // Verify ownership
    if (interview.user.toString() !== userId) {
      console.error(
        `[Background] Unauthorized: User ${userId} does not own interview ${interviewId}`
      );
      return;
    }

    // Validate question index
    if (
      questionIndex < 0 ||
      questionIndex >= interview.questions.length
    ) {
      console.error(
        `[Background] Invalid question index ${questionIndex} for interview ${interviewId}`
      );
      return;
    }

    // Get current questions array
    const questions = interview.questions;
    if (!questions || questionIndex >= questions.length) {
      console.error(`[Background] Invalid question index ${questionIndex}`);
      return;
    }

    // Prepare the analysis object
    const analysisData = {
      score: analysisResult.score,
      technicalFeedback: analysisResult.technicalFeedback,
      communicationFeedback: analysisResult.communicationFeedback,
      improvementSuggestions: analysisResult.improvementSuggestions,
    };

    // Update the question's analysis in the array
    questions[questionIndex].analysis = analysisData;

    // Calculate the current overall score based on answered questions with analysis
    let totalScore = 0;
    let answeredQuestions = 0;

    for (const q of questions) {
      if (q.answer && q.analysis && typeof q.analysis.score === "number") {
        totalScore += q.analysis.score;
        answeredQuestions++;
      }
    }

    // Calculate overall score
    const overallScore = answeredQuestions > 0 ? Math.round(totalScore / answeredQuestions) : 0;

    // CRITICAL: Use findByIdAndUpdate with $set operator for reliable nested array updates
    // This is more reliable than markModified + save for nested arrays
    const updateResult = await Interview.findByIdAndUpdate(
      interviewId,
      {
        $set: {
          [`questions.${questionIndex}.analysis`]: analysisData,
          overallScore: overallScore,
        },
      },
      {
        new: true, // Return updated document
        runValidators: false, // Skip validation for nested updates
      }
    );

    if (updateResult) {
      // Verify the update was successful
      const savedAnalysis = updateResult.questions[questionIndex]?.analysis;
      if (savedAnalysis && savedAnalysis.score === analysisResult.score) {
        console.log(
          `[Background] ✅ Interview updated successfully! Question ${questionIndex}. Score: ${analysisResult.score}`
        );
      } else {
        console.error(
          `[Background] ⚠️ Update completed but verification shows score mismatch. Expected: ${analysisResult.score}, Got: ${savedAnalysis?.score}`
        );
      }
    } else {
      console.error(`[Background] ❌ Failed to update interview ${interviewId}`);
    }
  } catch (error) {
    console.error(
      `[Background] Error updating interview ${interviewId} with analysis:`,
      error
    );
    // Don't throw - this is background processing
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log("Received request for interview:", id);

    // connect to MongoDB
    try {
      await connectDB();
      console.log("MongoDB connected successfully");
    } catch (dbError) {
      console.error("MongoDB connection error:", dbError);
      return NextResponse.json(
        {
          message: "Database connection error",
          error: "Failed to connect to database",
        },
        { status: 500 }
      );
    }

    // get and validate token
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    if (!token) {
      console.log("No token provided");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // get user ID from token
    let userId;
    try {
      userId = await getUserIdFromToken(token);
      console.log("User ID from token:", userId);
    } catch (tokenError) {
      console.error("Token verification error:", tokenError);
      return NextResponse.json(
        {
          message: "Invalid or expired token",
          error: "Authentication failed",
        },
        { status: 401 }
      );
    }

    // get interview ID from params
    const interviewId = id;
    console.log("Looking for interview:", interviewId);

    // parse request body
    const { questionIndex, answer } = await request.json();
    console.log("Received answer for question index:", questionIndex);

    // validate request body
    if (questionIndex === undefined || !answer) {
      return NextResponse.json(
        {
          message: "Question index and answer are required",
          received: { questionIndex, answer: answer ? "present" : "missing" },
        },
        { status: 400 }
      );
    }

    // find the interview
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      console.log("Interview not found:", interviewId);
      return NextResponse.json(
        { message: "Interview not found" },
        { status: 404 }
      );
    }

    // verify that the interview belongs to the user
    if (interview.user.toString() !== userId) {
      console.log("Unauthorized access attempt:", {
        userId,
        interviewUserId: interview.user,
      });
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // check if the question index is valid
    if (questionIndex < 0 || questionIndex >= interview.questions.length) {
      return NextResponse.json(
        {
          message: "Invalid question index",
          received: questionIndex,
          validRange: `0 to ${interview.questions.length - 1}`,
        },
        { status: 400 }
      );
    }

    // Get question text for webhook call
    const question = interview.questions[questionIndex].text;
    const timestamp = new Date();

    // STEP 1: Store answer immediately in MongoDB
    // Update the interview with the answer, candidateId (userId), and timestamp
    interview.questions[questionIndex].answer = answer;
    
    // Save the answer immediately (before webhook call)
    await interview.save();
    console.log(
      `Answer stored immediately for question ${questionIndex}. CandidateId: ${userId}, Timestamp: ${timestamp.toISOString()}`
    );

    // STEP 2: Fire asynchronous POST request to analyzer webhook (don't wait)
    // This happens in the background and doesn't block the response
    fireAnalyzerWebhookAsync(
      question,
      answer,
      // Handle webhook completion in background
      (analysisResult) => {
        console.log(
          `[Background] Webhook analysis completed for question ${questionIndex} with score: ${analysisResult.score}`
        );
        // Update the interview with analysis in the background
        updateInterviewAnalysisInBackground(
          interviewId,
          questionIndex,
          analysisResult,
          userId
        ).catch((error) => {
          console.error(
            `[Background] Error updating interview with analysis:`,
            error
          );
        });
      },
      // Handle webhook errors in background
      (error) => {
        console.error(
          `[Background] Webhook error for question ${questionIndex}:`,
          error
        );
        // Errors are logged but don't affect the response
      }
    );

    // STEP 3: Return immediately (don't block UI) - webhook processes in background
    return NextResponse.json(
      {
        message: "Answer submitted successfully. Analysis is being processed.",
        interview: {
          _id: interview._id,
          jobRole: interview.jobRole,
          techStack: interview.techStack,
          yearsOfExperience: interview.yearsOfExperience,
          questions: interview.questions,
          overallScore: interview.overallScore,
          status: interview.status,
          createdAt: interview.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in answer submission route:", error);

    // check for specific error types
    if (error instanceof Error) {
      if (error.message.includes("MongoDB")) {
        return NextResponse.json(
          {
            message: "Database error",
            error: "Failed to connect to database",
          },
          { status: 500 }
        );
      }
      // Check for analyzer webhook errors
      if (error.message.includes("Analyzer") || error.message.includes("analyzer")) {
        return NextResponse.json(
          {
            message: "Analysis service error",
            error: error.message,
          },
          { status: 500 }
        );
      }
    }

    // default error response
    return NextResponse.json(
      {
        message: "Internal server error",
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
