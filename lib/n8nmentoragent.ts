/* n8nmentoragent.ts
   - Called by the WindSurf interview pipeline when an interview finishes.
   - Only POSTs when interview.result exists.
   - Posts the specific fields required by the n8n Mentor webhook.
   - Fetches interview data from results API to get complete context.
   - Stores mentor response in MongoDB.
*/

import Interview from "../models/Interview";
import { connectDB } from "./mongodb";

const N8N_MENTOR_WEBHOOK = "https://exercisepassion.app.n8n.cloud/webhook/mentor-agent";

export async function sendToN8nMentor(interview: any, token?: string) {
  // Defensive checks
  if (!interview) {
    console.warn('n8nmentoragent: no interview provided');
    return { sent: false, reason: 'no_interview' };
  }

  // Only send when result section exists (user requirement)
  if (!('result' in interview) || interview.result == null || interview.result === '') {
    console.info('n8nmentoragent: interview has no result section — not sending webhook');
    return { sent: false, reason: 'no_result' };
  }

  try {
    // Fetch complete interview data from results API to get all feedback
    let completeInterviewData = interview;
    
    if (token && interview._id) {
      try {
        const response = await fetch(`http://localhost:3000/api/interview/${interview._id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          completeInterviewData = data.interview;
          console.log('Successfully fetched complete interview data from results API');
        } else {
          console.warn('Could not fetch complete interview data, using provided data');
        }
      } catch (fetchError) {
        console.warn('Error fetching complete interview data:', fetchError);
      }
    }

    // Build payload expected by n8n workflow with nested body structure
    const payload = {
      body: {
        body: {
          areasForImprovement: completeInterviewData.feedback?.areasForImprovement?.join('\n') || 
                              completeInterviewData.feedback?.nextSteps?.join('\n') || 
                              'No areas for improvement recorded',
          resume: {
            url: completeInterviewData.resumeUrl || ''
          },
          nextSteps: completeInterviewData.feedback?.nextSteps?.join('\n') || 
                    completeInterviewData.feedback?.areasForImprovement?.join('\n') || 
                    'No actionable steps recorded',
          overallFeedback: completeInterviewData.feedback?.overallFeedback || 
                         'No overall feedback available',
          strengths: completeInterviewData.feedback?.strengths?.join('\n') || 
                    'No strengths recorded',
          result: completeInterviewData.result,
          // Add other helpful debug fields
          interviewId: completeInterviewData._id || completeInterviewData.id || null,
          interviewerAgentId: completeInterviewData.interviewerAgentId || null,
          completedAt: completeInterviewData.completedAt || new Date().toISOString()
        },
        text: completeInterviewData.resumeText || ''
      }
    };

    console.log('Sending payload to n8n mentor:', JSON.stringify(payload, null, 2));

    const res = await fetch(N8N_MENTOR_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('n8nmentoragent: webhook returned non-OK', res.status, text);
      return { sent: false, status: res.status, responseText: text };
    }

    const json = await res.json().catch(() => null);
    console.info('n8nmentoragent: webhook POST successful');

    // Store mentor response in MongoDB if we have a valid response
    if (json && completeInterviewData._id) {
      try {
        await connectDB();
        
        // Extract the mentor response from the n8n output
        let mentorResponse = null;
        if (Array.isArray(json) && json.length > 0 && json[0].output) {
          mentorResponse = json[0].output;
        } else if (json.output) {
          mentorResponse = json.output;
        }
        
        if (mentorResponse) {
          await Interview.findByIdAndUpdate(
            completeInterviewData._id,
            {
              $push: {
                mentorAgentReviews: {
                  overallCritique: mentorResponse.overallCritique || '',
                  questionQualityIssues: mentorResponse.questionQualityIssues || '',
                  missedOpportunities: mentorResponse.missedOpportunities || '',
                  recommendedImprovedQuestions: mentorResponse.recommendedImprovedQuestions || '',
                  actionableAdviceForInterviewerAgent: mentorResponse.actionableAdviceForInterviewerAgent || '',
                  createdAt: new Date()
                }
              }
            }
          );
          console.log('Successfully stored mentor response in MongoDB');
        }
      } catch (dbError) {
        console.error('Error storing mentor response in MongoDB:', dbError);
        // Don't fail the request if storage fails
      }
    }

    return { sent: true, status: res.status, response: json };
  } catch (err) {
    console.error('n8nmentoragent: error posting webhook', err);
    return { sent: false, reason: 'exception', error: String(err) };
  }
}
