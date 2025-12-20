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

    // Find all interviews for the user that have mentor reviews
    const interviews = await Interview.find({
      user: userId,
      mentorAgentReviews: { $exists: true, $ne: [] }
    })
    .select('jobRole completedAt mentorAgentReviews createdAt')
    .sort({ createdAt: -1 });

    // Aggregate all mentor feedback into a single comprehensive report
    const allReviews = interviews.flatMap(interview => 
      interview.mentorAgentReviews.map(review => ({
        interviewId: interview._id,
        jobRole: interview.jobRole,
        interviewDate: interview.completedAt || interview.createdAt,
        reviewDate: review.createdAt,
        overallCritique: review.overallCritique,
        questionQualityIssues: review.questionQualityIssues,
        missedOpportunities: review.missedOpportunities,
        recommendedImprovedQuestions: review.recommendedImprovedQuestions,
        actionableAdviceForInterviewerAgent: review.actionableAdviceForInterviewerAgent,
      }))
    );

    // Sort by review date (newest first)
    allReviews.sort((a, b) => new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime());

    // Create a single comprehensive report
    const comprehensiveReport = allReviews.length > 0 ? {
      lastUpdated: allReviews[0].reviewDate,
      totalReviews: allReviews.length,
      latestInterviewRole: allReviews[0].jobRole,
      latestInterviewDate: allReviews[0].interviewDate,
      // Aggregate all feedback into comprehensive sections
      overallCritique: allReviews.map(review => 
        `[${review.jobRole} - ${new Date(review.interviewDate).toLocaleDateString()}]\n${review.overallCritique}`
      ).join('\n\n---\n\n'),
      questionQualityIssues: allReviews.map(review => 
        `[${review.jobRole} - ${new Date(review.interviewDate).toLocaleDateString()}]\n${review.questionQualityIssues}`
      ).join('\n\n---\n\n'),
      missedOpportunities: allReviews.map(review => 
        `[${review.jobRole} - ${new Date(review.interviewDate).toLocaleDateString()}]\n${review.missedOpportunities}`
      ).join('\n\n---\n\n'),
      recommendedImprovedQuestions: allReviews.map(review => 
        `[${review.jobRole} - ${new Date(review.interviewDate).toLocaleDateString()}]\n${review.recommendedImprovedQuestions}`
      ).join('\n\n---\n\n'),
      actionableAdviceForInterviewerAgent: allReviews.map(review => 
        `[${review.jobRole} - ${new Date(review.interviewDate).toLocaleDateString()}]\n${review.actionableAdviceForInterviewerAgent}`
      ).join('\n\n---\n\n'),
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
