/**
 * n8n Analyzer Integration
 * Sends question and answer pairs to the n8n webhook for analysis
 * 
 * Note: The webhook URL contains an '&' character which is valid in n8n paths.
 * If routing issues occur in production, consider changing the webhook path.
 */

const ANALYZER_WEBHOOK_URL =
  "https://exercisepassion.app.n8n.cloud/webhook/analyse-q&a";
const TIMEOUT_MS = 20000; // 20 seconds

/**
 * Expected response structure from n8n webhook:
 * {
 *   "score": number (0-100),
 *   "technicalFeedback": string,
 *   "communicationFeedback": string,
 *   "improvementSuggestions": string[] (array, not string)
 * }
 */
export interface AnalyzerResponse {
  score?: number | string;
  technicalFeedback?: string;
  communicationFeedback?: string;
  improvementSuggestions?: string[]; // MUST be an array, not a string
  analysis?: string | any; // Fallback for nested or alternative structures
  [key: string]: any; // Allow other fields from n8n response (including nested output)
}

export interface AnalysisResult {
  score: number;
  technicalFeedback: string;
  communicationFeedback: string;
  improvementSuggestions: string[];
}

/**
 * Sends a question and answer pair to the n8n analyzer webhook
 * @param question - The interview question
 * @param answer - The candidate's answer (will be trimmed)
 * @returns The analysis result from the n8n webhook
 */
export async function analyzeResponseWithN8n(
  question: string,
  answer: string
): Promise<AnalysisResult> {
  // Validate inputs
  if (!question || typeof question !== "string" || question.trim() === "") {
    throw new Error("Question is required and must be a non-empty string");
  }

  if (!answer || typeof answer !== "string" || answer.trim() === "") {
    throw new Error("Answer is required and must be a non-empty string");
  }

  // Trim whitespace from answer (but preserve its meaning)
  const trimmedAnswer = answer.trim();
  const trimmedQuestion = question.trim();

  // Prepare the request body with ONLY question and answer
  // IMPORTANT: Keys must be lowercase "question" and "answer" (not "Question" or "Answer")
  // The n8n workflow expects body.question and body.answer (case-sensitive)
  const requestBody = {
    question: trimmedQuestion,
    answer: trimmedAnswer,
  };

  console.log(
    `[n8n Analyzer] Sending Q&A pair to webhook: "${trimmedQuestion.substring(
      0,
      50
    )}..." with answer length: ${trimmedAnswer.length}`
  );

  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    // Make the POST request to n8n webhook
    const response = await fetch(ANALYZER_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Check if the response is ok
    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[n8n Analyzer] Webhook returned error status ${response.status}:`,
        errorText
      );
      throw new Error(
        `Analyzer webhook returned error: ${response.status} ${response.statusText}`
      );
    }

    // Get the response text and try to parse as JSON
    const responseText = await response.text();
    console.log(
      `[n8n Analyzer] Received response (first 200 chars):`,
      responseText.substring(0, 200)
    );

    let rawAnalyzerResponse: AnalyzerResponse | AnalyzerResponse[];
    try {
      rawAnalyzerResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error(
        `[n8n Analyzer] Failed to parse response as JSON:`,
        responseText
      );
      throw new Error(
        "Invalid JSON response from analyzer. Response: " + responseText
      );
    }

    // Normalize and transform the n8n response to match the expected AnalysisResult format
    const normalizedResponse = normalizeAnalyzerResponse(rawAnalyzerResponse);
    return transformN8nResponse(normalizedResponse);
  } catch (error: any) {
    // Handle timeout
    if (error.name === "AbortError") {
      console.error(`[n8n Analyzer] Request timed out after ${TIMEOUT_MS}ms`);
      throw new Error(
        "Analyzer request timed out. Please try again or check your connection."
      );
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes("fetch")) {
      console.error(`[n8n Analyzer] Network error:`, error);
      throw new Error(
        "Failed to connect to analyzer service. Please check your network connection."
      );
    }

    // Re-throw other errors
    console.error(`[n8n Analyzer] Error:`, error);
    throw error instanceof Error
      ? error
      : new Error("Unknown error occurred during analysis");
  }
}

/**
 * Transforms the n8n webhook response to match the expected AnalysisResult format
 * @param n8nResponse - The raw response from n8n webhook
 * @returns Transformed AnalysisResult matching the database schema
 */
function normalizeAnalyzerResponse(
  rawResponse: AnalyzerResponse | AnalyzerResponse[]
): AnalyzerResponse {
  if (Array.isArray(rawResponse)) {
    // Find the first valid entry that contains useful data
    for (const entry of rawResponse) {
      const normalized = normalizeAnalyzerResponse(entry);
      if (normalized && Object.keys(normalized).length > 0) {
        return normalized;
      }
    }
    return {};
  }

  if (!rawResponse || typeof rawResponse !== "object") {
    return {};
  }

  // Handle { output: {...} } wrapper (common with n8n)
  if (rawResponse.output && typeof rawResponse.output === "object") {
    return normalizeAnalyzerResponse(rawResponse.output);
  }

  // Handle { data: { output: {...} } } or { result: {...} }
  if (rawResponse.data && typeof rawResponse.data === "object") {
    return normalizeAnalyzerResponse(rawResponse.data);
  }
  if (rawResponse.result && typeof rawResponse.result === "object") {
    return normalizeAnalyzerResponse(rawResponse.result);
  }

  return rawResponse;
}

function toNumber(value: any): number | undefined {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function transformN8nResponse(n8nResponse: AnalyzerResponse): AnalysisResult {
  // Handle different response shapes from n8n
  let score: number;
  let analysisText: string;
  let improvementSuggestions: string[] = [];

  // Case 1: Direct response with score and analysis fields
  const detectedScore =
    toNumber(n8nResponse.score) ??
    (n8nResponse.analysis &&
    typeof n8nResponse.analysis === "object" &&
    "score" in n8nResponse.analysis
      ? toNumber(n8nResponse.analysis.score)
      : undefined);

  if (typeof detectedScore === "number") {
    score = detectedScore;
  } else if (
    n8nResponse.analysis &&
    typeof n8nResponse.analysis === "object" &&
    "score" in n8nResponse.analysis &&
    typeof n8nResponse.analysis.score === "number"
  ) {
    score = n8nResponse.analysis.score;
  } else {
    // Default score if not provided
    console.warn("[n8n Analyzer] No score found in response, defaulting to 0");
    score = 0;
  }

  // Extract analysis text
  if (typeof n8nResponse.analysis === "string") {
    analysisText = n8nResponse.analysis;
  } else if (
    n8nResponse.analysis &&
    typeof n8nResponse.analysis === "object"
  ) {
    // If analysis is an object, try to extract meaningful text
    if (n8nResponse.analysis.text) {
      analysisText = String(n8nResponse.analysis.text);
    } else if (n8nResponse.analysis.feedback) {
      analysisText = String(n8nResponse.analysis.feedback);
    } else {
      analysisText = JSON.stringify(n8nResponse.analysis);
    }
  } else {
    analysisText = "Analysis completed. Review your answer for improvements.";
  }

  // Extract improvement suggestions - MUST be an array, never a string
  // n8n workflow should return improvementSuggestions as an array: []
  if (Array.isArray(n8nResponse.improvementSuggestions)) {
    improvementSuggestions = n8nResponse.improvementSuggestions.map(
      (s: any) => String(s)
    );
  } else if (
    n8nResponse.analysis &&
    typeof n8nResponse.analysis === "object" &&
    Array.isArray(n8nResponse.analysis.improvementSuggestions)
  ) {
    improvementSuggestions = n8nResponse.analysis.improvementSuggestions.map(
      (s: any) => String(s)
    );
  } else if (
    n8nResponse.analysis &&
    typeof n8nResponse.analysis === "object" &&
    Array.isArray(n8nResponse.analysis.suggestions)
  ) {
    improvementSuggestions = n8nResponse.analysis.suggestions.map((s: any) =>
      String(s)
    );
  } else if (
    n8nResponse.improvementSuggestions &&
    typeof n8nResponse.improvementSuggestions === "string"
  ) {
    // Fallback: If somehow a string was returned, convert to array
    console.warn(
      "[n8n Analyzer] improvementSuggestions received as string, converting to array"
    );
    improvementSuggestions = [n8nResponse.improvementSuggestions];
  }

  // Extract technical and communication feedback
  // Expected n8n response structure:
  // {
  //   "score": number,
  //   "technicalFeedback": string,
  //   "communicationFeedback": string,
  //   "improvementSuggestions": string[]
  // }
  let technicalFeedback = analysisText;
  let communicationFeedback = "Your communication is clear and effective.";

  // Check for direct fields on the response
  if (
    typeof n8nResponse.technicalFeedback === "string" &&
    n8nResponse.technicalFeedback.trim() !== ""
  ) {
    technicalFeedback = n8nResponse.technicalFeedback;
  } else if (
    n8nResponse.analysis &&
    typeof n8nResponse.analysis === "object" &&
    typeof n8nResponse.analysis.technicalFeedback === "string"
  ) {
    technicalFeedback = n8nResponse.analysis.technicalFeedback;
  }

  if (
    typeof n8nResponse.communicationFeedback === "string" &&
    n8nResponse.communicationFeedback.trim() !== ""
  ) {
    communicationFeedback = n8nResponse.communicationFeedback;
  } else if (
    n8nResponse.analysis &&
    typeof n8nResponse.analysis === "object" &&
    typeof n8nResponse.analysis.communicationFeedback === "string"
  ) {
    communicationFeedback = n8nResponse.analysis.communicationFeedback;
  }

  // Ensure score is within valid range (0-100)
  if (score < 0) score = 0;
  if (score > 100) score = 100;

  return {
    score: Math.round(score),
    technicalFeedback,
    communicationFeedback,
    improvementSuggestions:
      improvementSuggestions.length > 0
        ? improvementSuggestions
        : ["Continue practicing and refining your answers."],
  };
}

/**
 * Fires an asynchronous POST request to the n8n analyzer webhook without waiting for response
 * This is a fire-and-forget operation that doesn't block the calling code
 * @param question - The interview question
 * @param answer - The candidate's answer
 * @param onComplete - Optional callback to handle the analysis result when it completes
 * @param onError - Optional callback to handle errors
 */
export function fireAnalyzerWebhookAsync(
  question: string,
  answer: string,
  onComplete?: (result: AnalysisResult) => void,
  onError?: (error: Error) => void
): void {
  // Validate inputs
  if (!question || typeof question !== "string" || question.trim() === "") {
    const error = new Error("Question is required and must be a non-empty string");
    if (onError) onError(error);
    return;
  }

  if (!answer || typeof answer !== "string" || answer.trim() === "") {
    const error = new Error("Answer is required and must be a non-empty string");
    if (onError) onError(error);
    return;
  }

  // Trim whitespace
  const trimmedAnswer = answer.trim();
  const trimmedQuestion = question.trim();

  // Prepare the request body
  const requestBody = {
    question: trimmedQuestion,
    answer: trimmedAnswer,
  };

  console.log(
    `[n8n Analyzer] Firing async webhook call: "${trimmedQuestion.substring(0, 50)}..."`
  );

  // Fire the request asynchronously - don't await it
  analyzeResponseWithN8n(trimmedQuestion, trimmedAnswer)
    .then((result) => {
      console.log(
        `[n8n Analyzer] Async webhook completed with score: ${result.score}`
      );
      if (onComplete) {
        onComplete(result);
      }
    })
    .catch((error) => {
      console.error(`[n8n Analyzer] Async webhook error:`, error);
      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    });
}