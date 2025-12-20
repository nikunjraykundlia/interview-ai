import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Interview from "@/models/Interview";
import { getUserIdFromToken } from "@/lib/auth";

// Define the mentor review interface for type safety
interface MentorReviewData {
  overallCritique: string;
  questionQualityIssues: string;
  missedOpportunities: string;
  recommendedImprovedQuestions: string;
  actionableAdviceForInterviewerAgent: string;
  createdAt: Date;
}

export async function GET(req: Request) {
  try {
    await connectDB();

    // Get token from query parameter since EventSource doesn't support custom headers
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // get user id from token
    const userId = await getUserIdFromToken(token);

    // Set up Server-Sent Events
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Function to send updates
        const sendUpdate = async (data: any) => {
          try {
            const formattedData = `data: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(encoder.encode(formattedData));
          } catch (error) {
            console.error("Error sending SSE update:", error);
          }
        };

        // Initial data fetch
        const fetchInitialData = async () => {
          try {
            const interviews = await Interview.find({
              user: userId,
              mentorAgentReviews: { $exists: true, $ne: [] }
            })
            .select('jobRole completedAt mentorAgentReviews createdAt')
            .sort({ createdAt: -1 });

            // Aggregate all mentor feedback into a single comprehensive report
            const allReviews = interviews.flatMap(interview => 
              interview.mentorAgentReviews.map((review: MentorReviewData) => ({
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

            sendUpdate({
              type: 'initial',
              report: comprehensiveReport
            });
          } catch (error) {
            console.error("Error fetching initial mentor reviews:", error);
            sendUpdate({
              type: 'error',
              message: 'Failed to fetch initial data'
            });
          }
        };

        // Poll for new mentor reviews every 5 seconds
        let lastCheck = new Date();
        const pollInterval = setInterval(async () => {
          try {
            const interviews = await Interview.find({
              user: userId,
              mentorAgentReviews: { $exists: true, $ne: [] },
            })
            .select('jobRole completedAt mentorAgentReviews createdAt updatedAt')
            .sort({ createdAt: -1 });

            if (interviews.length > 0) {
              // Aggregate all mentor feedback into a single comprehensive report
              const allReviews = interviews.flatMap(interview => 
                interview.mentorAgentReviews.map((review: MentorReviewData) => ({
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

              // Find reviews that are newer than lastCheck
              const newReviews = allReviews.filter(review => 
                new Date(review.reviewDate) > lastCheck
              );

              if (newReviews.length > 0) {
                lastCheck = new Date();
                
                // Create the updated comprehensive report
                const comprehensiveReport = {
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
                };
                
                sendUpdate({
                  type: 'report_updated',
                  report: comprehensiveReport,
                  newReviewsCount: newReviews.length
                });
              }
            }
          } catch (error) {
            console.error("Error polling for new mentor reviews:", error);
          }
        }, 5000);

        // Send initial data
        fetchInitialData();

        // Cleanup on connection close
        req.signal.addEventListener('abort', () => {
          clearInterval(pollInterval);
          controller.close();
        });

        // Send periodic keep-alive messages
        const keepAliveInterval = setInterval(() => {
          sendUpdate({ type: 'keepalive', timestamp: new Date().toISOString() });
        }, 30000);

        req.signal.addEventListener('abort', () => {
          clearInterval(pollInterval);
          clearInterval(keepAliveInterval);
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    });
  } catch (error) {
    console.error("Error watches mentor reviews SSE:", error);
    return NextResponse.json(
      { message: "Internal server error", error: String(error) },
      { status: 500 }
    );
  }
}
