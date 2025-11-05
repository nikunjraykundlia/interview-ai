import { GoogleGenerativeAI } from "@google/generative-ai";

let genAIInstance: GoogleGenerativeAI | null = null;
const getGenAI = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("Missing GEMINI_API_KEY environment variable");
  }
  if (!genAIInstance) {
    genAIInstance = new GoogleGenerativeAI(key);
  }
  return genAIInstance;
};

// Configure for Flash model
const generationConfig = {
  temperature: 0.7,
  topP: 1,
  topK: 32,
  maxOutputTokens: 2000,
};

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000;

/**
 * Helper function to implement exponential backoff for API calls
 */
const retryWithExponentialBackoff = async <T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = INITIAL_RETRY_DELAY
): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    // Check if it's a rate limit error (429)
    if (retries > 0 && error?.status === 429) {
      console.log(
        `Rate limit exceeded. Retrying in ${delay}ms... (${retries} retries left)`
      );

      // Wait for the specified delay
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Retry with increased delay (exponential backoff)
      return retryWithExponentialBackoff(fn, retries - 1, delay * 2);
    }

    // If it's not a rate limit error or we've exhausted retries, throw the error
    throw error;
  }
};

interface GeneratedQuestions {
  questions: string[];
}

interface AnalysisResult {
  score: number;
  technicalFeedback: string;
  communicationFeedback: string;
  improvementSuggestions: string[];
}

interface FeedbackResult {
  overallFeedback: string;
  strengths: string[];
  areasForImprovement: string[];
  nextSteps: string[];
}

export const generateInterviewQuestions = async (
  context: string
): Promise<string[]> => {
  try {
    const model = getGenAI().getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig,
    });

    // Debug: log the context being sent to Gemini
    console.log("[Gemini API] Context received (first 500 chars):", context.slice(0, 500));
    console.log("[Gemini API] Full context length:", context.length);
    
    // Parse context once and extract key info
    const parsedContext = JSON.parse(context);
    const jobRole = parsedContext.jobRole || "software developer";
    const techStack = parsedContext.techStack || [];
    const resume = parsedContext.resume || {};
    const resumeSummary = parsedContext.resumeSummary || "";
    
    // Log the parsed structure
    console.log("[Gemini API] Parsed context structure:", {
      jobRole,
      techStack,
      yearsOfExperience: parsedContext.yearsOfExperience,
      hasResume: !!parsedContext.resume,
      hasResumeSummary: !!parsedContext.resumeSummary,
      resumeSummary,
      resumeStructure: parsedContext.resume ? {
        experience: parsedContext.resume.experience?.length || 0,
        projects: parsedContext.resume.projects?.length || 0,
        skills: parsedContext.resume.skills?.length || 0,
        education: parsedContext.resume.education?.length || 0,
        internships: parsedContext.resume.internships?.length || 0,
      } : null,
    });
    
    // Log the actual resume data being used for questions
    console.log("[Gemini API] Resume data for questions:", {
      resumeSummary,
      projects: resume.projects,
      experience: resume.experience,
      skills: resume.skills,
      internships: resume.internships,
    });

    // Build resume details section
    const resumeDetails: string[] = [];
    if (resume?.projects?.length > 0) {
      resumeDetails.push(`Projects: ${JSON.stringify(resume.projects)}`);
    }
    if (resume?.experience?.length > 0) {
      resumeDetails.push(`Experience: ${JSON.stringify(resume.experience)}`);
    }
    if (resume?.internships?.length > 0) {
      resumeDetails.push(`Internships: ${JSON.stringify(resume.internships)}`);
    }
    if (resume?.skills?.length > 0) {
      resumeDetails.push(`Skills: ${resume.skills.join(", ")}`);
    }
    if (resume?.education?.length > 0) {
      resumeDetails.push(`Education: ${JSON.stringify(resume.education)}`);
    }
    
    const hasResumeData = resumeDetails.length > 0;
    const resumeDetailsSection = hasResumeData ? `\n\nADDITIONAL RESUME DETAILS:\n${resumeDetails.join("\n")}` : "";

    // Build technical rules section to avoid template literal nesting issues
    const techStackStr = techStack.length > 0 ? techStack.join(", ") : "general software development";
    const technicalRules = hasResumeData 
      ? "- At least 6 of the 12 technical questions MUST reference specific items from the resume\n- Use exact names from the resume (projects, companies, technologies, frameworks)\n- Reference concrete experiences, projects, or technologies from the resume above\n- Examples from resume: \"How did you [specific task] in [ProjectName]?\""
      : `- Focus on ${techStackStr} since no resume was provided`;

    const prompt = `You are an expert technical interviewer. Generate exactly 15 personalized interview questions.

CONTEXT:
- Job Role: ${jobRole}
- Tech Stack: ${techStack.join(", ")}
- Years of Experience: ${parsedContext.yearsOfExperience || 0}
- Resume Data: ${resumeSummary || "No resume provided"}${resumeDetailsSection}

REQUIREMENTS:
1. First 3 questions: Soft-skill questions based on their experience/internships
2. Remaining 12 questions: Technical questions

CRITICAL RULES FOR TECHNICAL QUESTIONS:
${technicalRules}

Keep questions professional, concise, and specific. Each question should be a single sentence ending with "?".

Return ONLY valid JSON in this exact format:
{
  "questions": [
    "Question 1?",
    "Question 2?",
    ...15 questions total
  ]
}`;

    const result = await retryWithExponentialBackoff(() =>
      model.generateContent(prompt)
    );

    const text = await result.response.text();

    // Clean response and parse
    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const parsed: GeneratedQuestions = JSON.parse(cleaned);

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error("Invalid question format from API");
    }

    return parsed.questions;
  } catch (error) {
    console.error("Error generating questions:", error);
    throw new Error("Failed to generate interview questions");
  }
};

export const analyzeResponse = async (
  question: string,
  answer: string
): Promise<AnalysisResult> => {
  try {
    const model = getGenAI().getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig,
    });

    const prompt = `Analyze this interview response (1-100 score) considering:
      - Technical accuracy (40%)
      - Communication clarity (30%)
      - Problem-solving (20%)
      - Best practices (10%)
      
      Question: ${question}
      Answer: ${answer}
      
      Return valid JSON format:
      {
        "score": number,
        "technicalFeedback": string,
        "communicationFeedback": string,
        "improvementSuggestions": string[]
      }`;

    // Use retry mechanism for API call
    const result = await retryWithExponentialBackoff(() =>
      model.generateContent(prompt)
    );

    const text = await result.response.text();

    // Clean and validate response
    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const parsed: AnalysisResult = JSON.parse(cleaned);

    // Validate response structure
    if (
      typeof parsed.score !== "number" ||
      typeof parsed.technicalFeedback !== "string" ||
      typeof parsed.communicationFeedback !== "string" ||
      !Array.isArray(parsed.improvementSuggestions)
    ) {
      throw new Error("Invalid analysis format from API");
    }

    return parsed;
  } catch (error) {
    console.error("Error analyzing response:", error);
    throw new Error("Failed to analyze interview response");
  }
};

export const generateInterviewFeedback = async (
  interview: any
): Promise<FeedbackResult> => {
  try {
    const model = getGenAI().getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig,
    });

    // Prepare the interview data for the prompt
    const questionsAndAnswers = interview.questions
      .map((q: any, index: number) => {
        return `
      Question ${index + 1}: ${q.text}
      Answer: ${q.answer || "No answer provided"}
      Score: ${q.analysis?.score || "N/A"}
      Technical Feedback: ${q.analysis?.technicalFeedback || "N/A"}
      Communication Feedback: ${q.analysis?.communicationFeedback || "N/A"}
      `;
      })
      .join("\n");

    const prompt = `Generate comprehensive interview feedback based on the following interview for a ${
      interview.jobRole
    } position with ${
      interview.yearsOfExperience
    } years of experience in ${interview.techStack.join(", ")}.
    
    ${questionsAndAnswers}
    
    Provide an overall assessment of the candidate's performance, highlighting strengths, areas for improvement, and specific next steps for growth.
    
    Return valid JSON format:
    {
      "overallFeedback": string,
      "strengths": string[],
      "areasForImprovement": string[],
      "nextSteps": string[]
    }`;

    const result = await retryWithExponentialBackoff(() =>
      model.generateContent(prompt)
    );

    const text = await result.response.text();

    // Clean and validate response
    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const parsed: FeedbackResult = JSON.parse(cleaned);

    // Validate response structure
    if (
      typeof parsed.overallFeedback !== "string" ||
      !Array.isArray(parsed.strengths) ||
      !Array.isArray(parsed.areasForImprovement) ||
      !Array.isArray(parsed.nextSteps)
    ) {
      throw new Error("Invalid feedback format from API");
    }

    return parsed;
  } catch (error) {
    console.error("Error generating interview feedback:", error);
    throw new Error("Failed to generate interview feedback");
  }
};
