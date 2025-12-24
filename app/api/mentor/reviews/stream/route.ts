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
            // Find the most recent interview with mentor review
            const latestInterview = await Interview.findOne({
              user: userId,
              mentorAgentReview: { $exists: true },
            })
            .select('jobRole completedAt mentorAgentReview createdAt updatedAt')
            .sort({ createdAt: -1 });

            if (latestInterview && latestInterview.mentorAgentReview) {
              const mentorReview = latestInterview.mentorAgentReview;
              
              // Check if the mentor review is newer than lastCheck
              if (new Date(mentorReview.createdAt) > lastCheck) {
                lastCheck = new Date();
                
                // Create the updated comprehensive report with the mentor review
                const comprehensiveReport = {
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
                };
                
                sendUpdate({
                  type: 'report_updated',
                  report: comprehensiveReport,
                  newReviewsCount: 1
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
