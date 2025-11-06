import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Interview from "@/models/Interview";
import { getUserIdFromToken } from "@/lib/auth";
import { generateInterviewQuestions } from "@/lib/gemini";
import { parsePdfResume, ParsedResume } from "@/lib/parseResume";
import { MAX_CONTEXT_CHARS, SECTION_LIMITS } from "@/lib/resumeConfig";

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

// default questions by category for fallback
const DEFAULT_QUESTIONS = {
  frontend: [
    "Explain the difference between localStorage, sessionStorage, and cookies.",
    "What are React hooks and how do they improve component development?",
    "Describe how you would optimize a web application's performance.",
    "Explain the concept of responsive design and how you implement it.",
    "What is the virtual DOM in React and why is it important?",
    "Describe your experience with state management libraries like Redux or Context API.",
  ],
  backend: [
    "Explain RESTful API design principles and best practices.",
    "How do you handle database transactions and ensure data integrity?",
    "Describe your experience with authentication and authorization mechanisms.",
    "How would you design a scalable microservice architecture?",
    "Explain how you would implement error handling in a backend application.",
    "Describe your approach to API security and preventing common vulnerabilities.",
  ],
  fullstack: [
    "Explain how you would structure a full-stack application from frontend to backend.",
    "Describe your experience with API integration between frontend and backend.",
    "How do you handle state management across the full application stack?",
    "Explain your approach to testing in a full-stack application.",
    "Describe your experience with deployment and CI/CD pipelines.",
    "How would you implement real-time features in a full-stack application?",
  ],
  default: [
    "Describe a challenging technical problem you've solved recently.",
    "How do you stay updated with the latest technologies in your field?",
    "Explain your approach to debugging complex issues.",
    "Describe your experience working in agile development environments.",
    "How do you ensure code quality and maintainability?",
    "Describe your experience with version control and collaborative development.",
  ],
};

const getFallBackQuestions = (
  jobRole: string,
  techStack: string[]
): string[] => {
  const role = jobRole.toLowerCase();
  const stack = techStack.map((tech) => tech.toLowerCase());

  if (
    role.includes("frontend") ||
    stack.some((tech) =>
      [
        "react",
        "vue",
        "angular",
        "javascript",
        "typescript",
        "html",
        "css",
      ].includes(tech)
    )
  ) {
    return DEFAULT_QUESTIONS.frontend;
  }

  if (
    role.includes("backend") ||
    stack.some((tech) =>
      [
        "node",
        "express",
        "django",
        "flask",
        "spring",
        "java",
        "python",
        "c#",
        ".net",
      ].includes(tech)
    )
  ) {
    return DEFAULT_QUESTIONS.backend;
  }

  if (
    role.includes("fullstack") ||
    role.includes("full stack") ||
    (stack.some((tech) => ["react", "vue", "angular"].includes(tech)) &&
      stack.some((tech) => ["node", "express", "django"].includes(tech)))
  ) {
    return DEFAULT_QUESTIONS.fullstack;
  }

  return DEFAULT_QUESTIONS.default;
};

export async function POST(req: Request) {
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

    // parse form data
    const formData = await req.formData();
    const jobRole = formData.get("jobRole") as string;
    const techStackRaw = JSON.parse(formData.get("techStack") as string);
    // Normalize resume details/tech stack: accept string or array, convert to tokens
    const techStack: string[] = Array.isArray(techStackRaw)
      ? (techStackRaw as string[])
      : typeof techStackRaw === "string"
      ? (techStackRaw
          .toLowerCase()
          .match(/[a-z0-9+#.]+/gi) || [])
      : [];
    const yearsOfExperience = JSON.parse(
      formData.get("yearsOfExperience") as string
    );
    const resumeFile = formData.get("resume") as File | null;

    // Debug: log all form data keys
    console.log("[Interview API] FormData keys:", Array.from(formData.keys()));
    console.log("[Interview API] Resume in FormData:", formData.has("resume"));

    if (!jobRole || (!techStack || techStack.length === 0)) {
      return NextResponse.json(
        { message: "All feilds are required" },
        { status: 400 }
      );
    }

    // parse resume using layout-aware extractor
    let resumeText = "";
    let parsedResume: ParsedResume | null = null;
    console.log("[Interview API] Resume file received:", !!resumeFile, resumeFile?.name, resumeFile?.size);
    if (resumeFile) {
      console.log("[Interview API] Resume file type:", typeof resumeFile, resumeFile.constructor.name);
    }
    try {
      if (resumeFile) {
        const buf = Buffer.from(await resumeFile.arrayBuffer());
        console.log("[Interview API] Buffer created, size:", buf.length);
        parsedResume = await parsePdfResume(buf);
        
        // If parsing returned scanned/failed result, log and set to null instead
        if (parsedResume?.scanned) {
          console.warn("[Interview API] PDF parsing failed or detected as scanned:", parsedResume.notes);
          console.log("[Interview API] Continuing without resume context");
          parsedResume = null;
        } else {
          // Debug: print parsed resume to server logs
          console.log("[Interview API] Parsed resume:", JSON.stringify(parsedResume, null, 2));
          resumeText = parsedResume.rawText || "";
        }
      } else {
        console.log("[Interview API] No resume file provided");
      }
    } catch (error) {
      console.error("[Interview API] Error processing resume: ", error);
      parsedResume = null;
    }

    // Build a single structured context object including the parsed resume
    const resumeForContext = parsedResume
      ? {
          scanned: parsedResume.scanned || false,
          notes: parsedResume.notes || undefined,
          // cap sections by configured limits
          experience: (parsedResume.experience || []).slice(0, SECTION_LIMITS.experienceItems),
          internships: (parsedResume.internships || []).slice(0, SECTION_LIMITS.experienceItems),
          projects: (parsedResume.projects || []).slice(0, SECTION_LIMITS.projectItems),
          skills: (parsedResume.skills || []).slice(0, SECTION_LIMITS.skillItems),
          education: (parsedResume.education || []).slice(0, SECTION_LIMITS.educationItems),
          confidence: parsedResume.confidence || undefined,
          // rawText and otherSections omitted to keep size small
        }
      : undefined;

    // Construct concise resume summary text
    let resumeSummary = "";
    if (parsedResume && !parsedResume.scanned) {
      const parts: string[] = [];
      if (resumeForContext?.experience?.length)
        parts.push(`Experience: ${resumeForContext.experience.join(" | ")}`);
      if (resumeForContext?.projects?.length)
        parts.push(`Projects: ${resumeForContext.projects.join(" | ")}`);
      if (resumeForContext?.skills?.length)
        parts.push(`Skills: ${resumeForContext.skills.join(", ")}`);
      if (resumeForContext?.education?.length)
        parts.push(`Education: ${resumeForContext.education.join(" | ")}`);
      resumeSummary = parts.join("\n");
    } else if (parsedResume && parsedResume.scanned) {
      resumeSummary = "PDF appears scanned or non-selectable; ignoring resume text.";
    } else if (resumeText) {
      resumeSummary = resumeText.slice(0, 2000);
    }

    const contextObj: any = {
      jobRole,
      techStack,
      yearsOfExperience,
      resume: resumeForContext || null,
      resumeSummary: resumeSummary || null,
    };

    // Debug: print gathered context (object)
    console.log("[Interview API] Context object:", JSON.stringify(contextObj, null, 2));
    console.log("[Interview API] Resume included:", !!resumeForContext);
    console.log("[Interview API] Resume summary length:", resumeSummary?.length || 0);
    console.log("[Interview API] Combined context preview:", JSON.stringify({
      jobRole,
      techStack,
      yearsOfExperience,
      resume: resumeForContext ? "Resume data included" : undefined,
      resumeSummary: resumeSummary ? "Resume summary included" : undefined,
    }, null, 2));
    console.log("[Interview API] Combined context string:", JSON.stringify(contextObj, null, 2));

    // Stringify with size enforcement
    let context = JSON.stringify(contextObj);
    if (context.length > MAX_CONTEXT_CHARS) {
      // If still too large, truncate resumeSummary proportionally
      const baseObj = { ...contextObj, resumeSummary: undefined };
      let baseStr = JSON.stringify(baseObj);
      const remaining = Math.max(0, MAX_CONTEXT_CHARS - baseStr.length - 20);
      const clippedSummary = (resumeSummary || "").slice(0, remaining);
      context = JSON.stringify({ ...baseObj, resumeSummary: clippedSummary });
    }

    // Debug: print gathered context (final string)
    console.log("[Interview API] Context length:", context.length);
    console.log("[Interview API] Context string (truncated 2000 chars):", context.slice(0, 2000));
    console.log("[Interview API] Sending combined context to Gemini API with resume data:", {
      hasResume: !!resumeForContext,
      hasResumeSummary: !!resumeSummary,
      resumeItems: resumeForContext ? {
        experience: (resumeForContext.experience || []).length,
        projects: (resumeForContext.projects || []).length,
        skills: (resumeForContext.skills || []).length,
        education: (resumeForContext.education || []).length,
        internships: (resumeForContext.internships || []).length,
      } : null,
    });

    let questions;
    let usedFallBack = false;

    try {
      questions = await generateInterviewQuestions(context);
    } catch (error: any) {
      console.error(
        "Failed to generate questions with gemini api, using fall back questions: ",
        error
      );

      // check if it's rate limit error
      const isRateLimitError =
        error.message &&
        (error.message.includes("429") ||
          error.message.includes("Too Many Requests") ||
          error.message.includes("RATE_LIMIT_EXCEEDED"));

      questions = getFallBackQuestions(jobRole, techStack);
      usedFallBack = true;
    }

    // create new interview session
    const newInterview = new Interview({
      user: userId,
      jobRole,
      techStack,
      yearsOfExperience,
      resumeText,
      questions: questions.map((question) => ({
        text: question,
        answer: "",
        analysis: null,
      })),
      status: "in-progress",
      usedFallbackQuestions: usedFallBack,
    });

    await newInterview.save();

    return NextResponse.json(
      {
        message: usedFallBack
          ? "interview created with default questions due to AI service limitation. Try again later for personalized questions."
          : "interview created successfully",
        interview: newInterview,
        // Dev-only debug payload to surface gathered context in browser console
        debug:
          process.env.NODE_ENV !== "production"
            ? {
                contextObject: contextObj,
                contextStringPreview: context.slice(0, 2000),
              }
            : undefined,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating interview: ", error);

    //provide more specific errors
    let errorMessage = "Internal server error";
    let statusCode = 500;

    if (
      (error.message && error.message.includes("rate limit")) ||
      (error.message && error.message.includes("429")) ||
      (error.message && error.message.includes("Too Many Requests"))
    ) {
      errorMessage =
        "AI service is currently busy. Please try again in few minutes.";
      statusCode = 429;
    } else if (
      error.message &&
      error.message.includes("failed to generate interview questions")
    ) {
      errorMessage =
        "Unable to generate interview questions. Please try again later.";
    }

    return NextResponse.json({ message: errorMessage }, { status: statusCode });
  }
}
