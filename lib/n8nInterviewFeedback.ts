/**
 * n8n Interview Feedback Integration
 * Sends all question-answer pairs to the n8n webhook for overall interview feedback
 * 
 * Webhook URL: https://goartificialnow.app.n8n.cloud/webhook/interview-feedback
 */

const INTERVIEW_FEEDBACK_WEBHOOK_URL =
  "https://goartificialnow.app.n8n.cloud/webhook/interview-feedback";
const TIMEOUT_MS = 30000; // 30 seconds
const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 2000; // 2 seconds

export interface InterviewFeedbackInput {
  candidateId?: string;
  sessionId?: string;
  JobRole?: string;
  yearsOfExperience?: string | number;
  jobDescription?: string;
  resume?: object | null;
  qas: Array<{
    question: string;
    answer: string;
  }>;
  timestamp?: string;
}

export interface InterviewFeedbackResponse {
  overallFeedback: string;
  strengths: string[];
  areasForImprovement: string[];
  nextSteps: string[];
}

export interface FinalOutput {
  status: "success" | "error";
  candidateId?: string;
  sessionId?: string;
  correlationId?: string;
  analysis: {
    overallFeedback: string | null;
    strengths: string[];
    areasForImprovement: string[];
    nextSteps: string[];
    raw?: object;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Generates a correlation ID for tracking
 */
function generateCorrelationId(): string {
  return `feedback-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Trims whitespace from strings but preserves content
 */
function trimWhitespace(str: string): string {
  return str.trim();
}

/**
 * Builds the combined payload for n8n webhook
 * Includes primary_preferred format, legacy_keyed format, and single_latest_fallback
 */
function buildWebhookPayload(input: InterviewFeedbackInput): object {
  const { JobRole, yearsOfExperience, jobDescription, resume, qas } = input;

  // Validate qas
  if (!qas || !Array.isArray(qas) || qas.length === 0) {
    throw new Error("qas array is required and must not be empty");
  }

  // Trim all questions and answers
  const trimmedQas = qas.map((qa) => ({
    question: trimWhitespace(qa.question),
    answer: trimWhitespace(qa.answer),
  }));

  // Primary preferred format: questions array
  const questions = trimmedQas.map((qa) => ({
    question: qa.question,
    answer: qa.answer,
  }));

  // Legacy keyed format: question1..question15, answer1..answer15
  const legacyKeyed: Record<string, string | null> = {};
  for (let i = 0; i < 15; i++) {
    if (i < trimmedQas.length) {
      legacyKeyed[`question${i + 1}`] = trimmedQas[i].question;
      legacyKeyed[`answer${i + 1}`] = trimmedQas[i].answer;
    } else {
      legacyKeyed[`question${i + 1}`] = null;
      legacyKeyed[`answer${i + 1}`] = null;
    }
  }

  // Single latest fallback: last Q&A as question/answer
  const lastQa = trimmedQas[trimmedQas.length - 1];

  // Build combined payload
  const payload: any = {
    JobRole: JobRole || null,
    yearsOfExperience: yearsOfExperience || null,
    jobDescription: jobDescription || null,
    resume: resume || null,
    questions,
    ...legacyKeyed,
    question: lastQa.question,
    answer: lastQa.answer,
  };

  // Add optional fields if present
  if (input.candidateId) {
    payload.candidateId = input.candidateId;
  }
  if (input.sessionId) {
    payload.sessionId = input.sessionId;
  }
  if (input.timestamp) {
    payload.timestamp = input.timestamp;
  }

  return payload;
}

/**
 * Normalizes the n8n response to extract feedback fields
 */
function normalizeN8nResponse(
  rawResponse: any
): InterviewFeedbackResponse | null {
  if (!rawResponse || typeof rawResponse !== "object") {
    return null;
  }

  // Check for direct fields
  if (
    rawResponse.overallFeedback &&
    Array.isArray(rawResponse.strengths) &&
    Array.isArray(rawResponse.areasForImprovement) &&
    Array.isArray(rawResponse.nextSteps)
  ) {
    return {
      overallFeedback: String(rawResponse.overallFeedback),
      strengths: rawResponse.strengths.map((s: any) => String(s)),
      areasForImprovement: rawResponse.areasForImprovement.map((s: any) =>
        String(s)
      ),
      nextSteps: rawResponse.nextSteps.map((s: any) => String(s)),
    };
  }

  // Check nested paths: response.data, response.body, response.overallFeedback
  const paths = [
    rawResponse.data,
    rawResponse.body,
    rawResponse.response,
    rawResponse.output,
  ];

  for (const path of paths) {
    if (
      path &&
      typeof path === "object" &&
      path.overallFeedback &&
      Array.isArray(path.strengths) &&
      Array.isArray(path.areasForImprovement) &&
      Array.isArray(path.nextSteps)
    ) {
      return {
        overallFeedback: String(path.overallFeedback),
        strengths: path.strengths.map((s: any) => String(s)),
        areasForImprovement: path.areasForImprovement.map((s: any) =>
          String(s)
        ),
        nextSteps: path.nextSteps.map((s: any) => String(s)),
      };
    }
  }

  return null;
}

/**
 * Sanitizes response for logging (truncates long content, removes PII)
 */
function sanitizeForLogging(response: any, maxLength: number = 512): string {
  const str = JSON.stringify(response);
  if (str.length <= maxLength) {
    return str;
  }
  return str.substring(0, maxLength) + "... [truncated]";
}

/**
 * Calls the n8n interview feedback webhook with retry logic
 */
async function callWebhookWithRetry(
  payload: object,
  correlationId: string,
  attempt: number = 0
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(INTERVIEW_FEEDBACK_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-correlation-id": correlationId,
        ...(process.env.N8N_WORKFLOW_SECRET && {
          "x-workflow-secret": process.env.N8N_WORKFLOW_SECRET,
        }),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);

    // Retry on timeout or network errors
    if (
      (error.name === "AbortError" || error instanceof TypeError) &&
      attempt < MAX_RETRIES
    ) {
      console.log(
        `[n8n Interview Feedback] Retry attempt ${attempt + 1}/${MAX_RETRIES} after ${RETRY_DELAY_MS}ms`
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return callWebhookWithRetry(payload, correlationId, attempt + 1);
    }

    throw error;
  }
}

/**
 * Main function to get interview feedback from n8n webhook
 */
export async function getInterviewFeedbackFromN8n(
  input: InterviewFeedbackInput
): Promise<FinalOutput> {
  const correlationId = generateCorrelationId();
  const timestamp = new Date().toISOString();

  // Log request (without PII)
  console.log(
    `[n8n Interview Feedback] Triggering webhook at ${timestamp}`,
    {
      candidateId: input.candidateId || "not provided",
      sessionId: input.sessionId || "not provided",
      qaCount: input.qas?.length || 0,
      correlationId,
      resumeUrl: input.resume && typeof input.resume === "object" && "url" in input.resume
        ? (input.resume as any).url
        : "not provided",
    }
  );

  // Validate input
  if (!input.qas || !Array.isArray(input.qas) || input.qas.length === 0) {
    return {
      status: "error",
      candidateId: input.candidateId,
      sessionId: input.sessionId,
      correlationId,
      analysis: {
        overallFeedback: null,
        strengths: [],
        areasForImprovement: [],
        nextSteps: [],
      },
      error: {
        code: "missing_qas",
        message: "qas array is required and must not be empty",
      },
    };
  }

  // Build payload
  let payload: object;
  try {
    payload = buildWebhookPayload({
      ...input,
      timestamp,
    });
  } catch (error: any) {
    return {
      status: "error",
      candidateId: input.candidateId,
      sessionId: input.sessionId,
      correlationId,
      analysis: {
        overallFeedback: null,
        strengths: [],
        areasForImprovement: [],
        nextSteps: [],
      },
      error: {
        code: "invalid_input",
        message: error.message || "Failed to build webhook payload",
      },
    };
  }

  // Call webhook with retry
  try {
    const response = await callWebhookWithRetry(payload, correlationId);

    // Log response status
    console.log(
      `[n8n Interview Feedback] HTTP ${response.status} returned`,
      { correlationId }
    );

    // Handle 5xx errors
    if (response.status >= 500 && response.status < 600) {
      const errorText = await response.text().catch(() => "Unknown error");
      return {
        status: "error",
        candidateId: input.candidateId,
        sessionId: input.sessionId,
        correlationId,
        analysis: {
          overallFeedback: null,
          strengths: [],
          areasForImprovement: [],
          nextSteps: [],
        },
        error: {
          code: "n8n_server_error",
          message: `n8n server error: ${response.status} ${response.statusText}`,
          details: sanitizeForLogging(errorText),
        },
      };
    }

    // Handle non-2xx responses
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      return {
        status: "error",
        candidateId: input.candidateId,
        sessionId: input.sessionId,
        correlationId,
        analysis: {
          overallFeedback: null,
          strengths: [],
          areasForImprovement: [],
          nextSteps: [],
        },
        error: {
          code: "n8n_error",
          message: `n8n returned error: ${response.status} ${response.statusText}`,
          details: sanitizeForLogging(errorText),
        },
      };
    }

    // Parse response
    const responseText = await response.text();
    let rawResponse: any;

    try {
      rawResponse = JSON.parse(responseText);
    } catch (parseError) {
      return {
        status: "error",
        candidateId: input.candidateId,
        sessionId: input.sessionId,
        correlationId,
        analysis: {
          overallFeedback: null,
          strengths: [],
          areasForImprovement: [],
          nextSteps: [],
        },
        error: {
          code: "invalid_n8n_response",
          message: "Failed to parse n8n response as JSON",
          details: sanitizeForLogging(responseText),
        },
      };
    }

    // Normalize response
    const normalized = normalizeN8nResponse(rawResponse);

    if (!normalized) {
      return {
        status: "error",
        candidateId: input.candidateId,
        sessionId: input.sessionId,
        correlationId,
        analysis: {
          overallFeedback: null,
          strengths: [],
          areasForImprovement: [],
          nextSteps: [],
          raw: rawResponse,
        },
        error: {
          code: "invalid_n8n_response",
          message: "n8n response does not contain expected feedback structure",
          details: sanitizeForLogging(rawResponse),
        },
      };
    }

    // Success
    console.log(
      `[n8n Interview Feedback] Successfully received feedback`,
      { correlationId }
    );

    return {
      status: "success",
      candidateId: input.candidateId,
      sessionId: input.sessionId,
      correlationId,
      analysis: {
        overallFeedback: normalized.overallFeedback,
        strengths: normalized.strengths,
        areasForImprovement: normalized.areasForImprovement,
        nextSteps: normalized.nextSteps,
        raw: rawResponse,
      },
    };
  } catch (error: any) {
    // Handle timeout
    if (error.name === "AbortError") {
      return {
        status: "error",
        candidateId: input.candidateId,
        sessionId: input.sessionId,
        correlationId,
        analysis: {
          overallFeedback: null,
          strengths: [],
          areasForImprovement: [],
          nextSteps: [],
        },
        error: {
          code: "n8n_timeout",
          message: `Request timed out after ${TIMEOUT_MS}ms`,
        },
      };
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return {
        status: "error",
        candidateId: input.candidateId,
        sessionId: input.sessionId,
        correlationId,
        analysis: {
          overallFeedback: null,
          strengths: [],
          areasForImprovement: [],
          nextSteps: [],
        },
        error: {
          code: "network_error",
          message: "Failed to connect to n8n webhook",
          details: error.message,
        },
      };
    }

    // Generic error
    return {
      status: "error",
      candidateId: input.candidateId,
      sessionId: input.sessionId,
      correlationId,
      analysis: {
        overallFeedback: null,
        strengths: [],
        areasForImprovement: [],
        nextSteps: [],
      },
      error: {
        code: "unknown_error",
        message: error.message || "Unknown error occurred",
      },
    };
  }
}
