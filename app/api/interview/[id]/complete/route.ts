import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Interview from "@/models/Interview";
import { getUserIdFromToken } from "@/lib/auth";
import { getInterviewFeedbackFromN8n } from "@/lib/n8nInterviewFeedback";
import { generateInterviewFeedback } from "@/lib/gemini";
import { sendToN8nMentor } from "@/lib/n8nmentoragent";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    // get token from authorization header
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // get user id from token
    const userId = await getUserIdFromToken(token);

    // get interview id from params
    const interviewId = params.id;
    console.log(`Completing interview: ${interviewId}`);

    //find the interview
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return NextResponse.json(
        { message: "Interview not found" },
        { status: 404 }
      );
    }

    // verify that the interview belongs to the user
    if (interview.user.toString() !== userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // check if all questions have answers
    const unansweredQuestions = interview.questions.filter(
      (q: any) => !q.answer || q.answer.trim() === ""
    );
    if (unansweredQuestions.length > 0) {
      return NextResponse.json(
        {
          message:
            "All questions must be answered before completing the interview",
          unansweredCount: unansweredQuestions.length,
        },
        { status: 400 }
      );
    }

    // calculate the overall score based on the individual question scores
    const totalQuestions = interview.questions.length;
    let answeredQuestions = 0;
    let totalScore = 0;

    for (const question of interview.questions) {
      if (question.answer && question.analysis && question.analysis.score) {
        totalScore += question.analysis.score;
        answeredQuestions++;
      }
    }

    // calculate the average score
    const overallScore =
      answeredQuestions > 0 ? Math.round(totalScore / answeredQuestions) : 0;
    console.log(
      `Generating feedback for interview with overall score: ${overallScore}`
    );

    // Prepare Q&A pairs for n8n webhook
    const qas = interview.questions.map((q: any) => ({
      question: q.text || "",
      answer: q.answer || "",
    }));

    // Prepare resume object (can be null or object with url)
    const resume = interview.resumeUrl
      ? { url: interview.resumeUrl }
      : interview.resumeText
      ? { text: interview.resumeText }
      : null;

    // Extract job description from workflowQuestions if available
    const jobDescription = 
      interview.workflowQuestions && 
      typeof interview.workflowQuestions === 'object' && 
      'JobDescription' in interview.workflowQuestions
        ? String(interview.workflowQuestions.JobDescription || '')
        : null;

    // Call n8n webhook to get interview feedback
    console.log("Calling n8n interview feedback webhook...");
    const n8nResult = await getInterviewFeedbackFromN8n({
      candidateId: userId,
      sessionId: interviewId,
      JobRole: interview.jobRole,
      yearsOfExperience: interview.yearsOfExperience,
      jobDescription: jobDescription ?? undefined,
      resume: resume,
      qas: qas,
      timestamp: new Date().toISOString(),
    });

    let feedback;

    if (n8nResult.status === "success" && n8nResult.analysis) {
      // Use n8n feedback if successful
      feedback = {
        overallFeedback: n8nResult.analysis.overallFeedback || "",
        strengths: n8nResult.analysis.strengths || [],
        areasForImprovement: n8nResult.analysis.areasForImprovement || [],
        nextSteps: n8nResult.analysis.nextSteps || [],
      };
      console.log("Feedback received from n8n webhook successfully");
    } else {
      // Fallback to Gemini if n8n fails
      console.warn(
        "n8n webhook failed, falling back to Gemini:",
        n8nResult.error?.message || "Unknown error"
      );
      try {
        feedback = await generateInterviewFeedback(interview);
        console.log("Feedback generated using Gemini fallback");
      } catch (geminiError) {
        console.error("Gemini fallback also failed:", geminiError);
        // Use empty feedback structure if both fail
        feedback = {
          overallFeedback:
            "Feedback generation failed. Please try again later.",
          strengths: [],
          areasForImprovement: [],
          nextSteps: [],
        };
      }
    }

    // update the interview with the overall score and feedback
    interview.overallScore = overallScore;
    interview.feedback = feedback;
    interview.status = "completed";
    interview.completedAt = new Date();
    
    // Set result based on overall score
    interview.result = overallScore >= 70 ? "passed" : overallScore >= 50 ? "passed-with-notes" : "failed";

    await interview.save();
    console.log("Interview marked as completed and feedback saved to MongoDB");

    // Send to n8n mentor webhook if result exists
    try {
      const mentorResult = await sendToN8nMentor(interview.toObject(), token);
      if (mentorResult.sent) {
        console.log("Successfully sent interview to n8n mentor webhook");
      } else {
        console.log("Did not send to n8n mentor:", mentorResult.reason);
      }
    } catch (mentorError) {
      console.error("Error sending to n8n mentor webhook:", mentorError);
      // Don't fail the request if mentor webhook fails
    }

    // get the updated interview
    const updatedInterview = await Interview.findById(interviewId);
    if (!updatedInterview) {
      return NextResponse.json(
        { message: "Interview not found after completion" },
        { status: 404 }
      );
    }

    // return a simplified response
    return NextResponse.json(
      {
        message: "Interview completed successfully",
        success: true,
        interviewId: updatedInterview._id,
        status: "completed",
        feedback: updatedInterview.feedback,
        redirectUrl: `/interview/${updatedInterview._id}/results`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error completing interview:", error);
    return NextResponse.json(
      { message: "Internal server error", error: String(error) },
      { status: 500 }
    );
  }
}
