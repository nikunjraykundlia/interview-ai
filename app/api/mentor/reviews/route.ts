import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Interview from "@/models/Interview";
import { getUserIdFromToken } from "@/lib/auth";

export async function GET(req: Request) {
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

    // Find the most recent interview with mentor review
    const latestInterview = await Interview.findOne({
      user: userId,
      mentorAgentReview: { $exists: true }
    })
    .select('jobRole completedAt mentorAgentReview createdAt')
    .sort({ createdAt: -1 });

    // Get the mentor review from the most recent interview
    const mentorReview = latestInterview ? latestInterview.mentorAgentReview : null;

    // Create a comprehensive report with the mentor review
    const comprehensiveReport = mentorReview ? {
      lastUpdated: mentorReview.createdAt,
      totalReviews: 1,
      latestInterviewRole: latestInterview.jobRole,
      latestInterviewDate: latestInterview.completedAt || latestInterview.createdAt,
      // Include the mentor review feedback
      overallCritique: mentorReview.overallCritique,
      questionQualityIssues: mentorReview.questionQualityIssues,
      missedOpportunities: mentorReview.missedOpportunities,
      recommendedImprovedQuestions: mentorReview.recommendedImprovedQuestions,
      actionableAdviceForInterviewerAgent: mentorReview.actionableAdviceForInterviewerAgent,
    } : null;

    return NextResponse.json(
      {
        message: "Comprehensive mentor report retrieved successfully",
        report: comprehensiveReport,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching mentor reviews:", error);
    return NextResponse.json(
      { message: "Internal server error", error: String(error) },
      { status: 500 }
    );
  }
}
