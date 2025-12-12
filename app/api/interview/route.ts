import { NextResponse } from "next/server";
import { Buffer } from "buffer";
import ImageKit from "imagekit";
import { connectDB } from "@/lib/mongodb";
import Interview from "@/models/Interview";
import { getUserIdFromToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

const WORKFLOW_ENDPOINT =
  process.env.N8N_WORKFLOW_URL ??
  "https://exercisepassion.app.n8n.cloud/webhook/generate-interview-question";

const IMAGEKIT_UPLOAD_URL =
  process.env.IMAGEKIT_UPLOAD_URL ??
  "https://upload.imagekit.io/api/v1/files/upload";
const IMAGEKIT_PUBLIC_KEY = process.env.IMAGEKIT_PUBLIC_KEY;
const IMAGEKIT_PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY;
const IMAGEKIT_URL_ENDPOINT = process.env.IMAGEKIT_URL_ENDPOINT;
const IMAGEKIT_FOLDER = process.env.IMAGEKIT_FOLDER;

const imagekit = new ImageKit({
  publicKey: IMAGEKIT_PUBLIC_KEY || "",
  privateKey: IMAGEKIT_PRIVATE_KEY || "",
  urlEndpoint: IMAGEKIT_URL_ENDPOINT || "",
});

const tokenize = (value: string): string[] =>
  value
    .toLowerCase()
    .match(/[a-z0-9+#.]+/gi)?.map((token) => token.toLowerCase()) ?? [];

const buildTechStack = (jobDescription: string, jobRole: string): string[] => {
  const descriptionTokens = tokenize(jobDescription);
  if (descriptionTokens.length > 0) {
    return descriptionTokens;
  }

  const roleTokens = tokenize(jobRole);
  if (roleTokens.length > 0) {
    return roleTokens;
  }

  return ["general"];
};

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const extractQuestions = (payload: any): string[] => {
  const stack: any[] = [payload];
  const seen = new Set<any>();

  while (stack.length) {
    const current = stack.pop();
    if (current === undefined || current === null) {
      continue;
    }

    if (isStringArray(current)) {
      return current;
    }

    if (typeof current !== "object") {
      continue;
    }

    if (seen.has(current)) {
      continue;
    }
    seen.add(current);

    const directCandidates = [
      (current as any)?.Top15Questions,
      (current as any)?.questions,
      (current as any)?.result?.questions,
      (current as any)?.data?.questions,
      (current as any)?.output?.questions,
      (current as any)?.json?.questions,
    ];

    for (const candidate of directCandidates) {
      if (isStringArray(candidate)) {
        return candidate;
      }
    }

    if (Array.isArray(current)) {
      stack.push(...current);
    } else {
      stack.push(
        (current as any)?.result,
        (current as any)?.data,
        (current as any)?.output,
        (current as any)?.json
      );
    }
  }

  return [];
};

const ensureDataUrl = (base64: string, mimeType?: string): string => {
  const trimmed = base64.trim();
  if (trimmed.toLowerCase().startsWith("data:")) {
    return trimmed;
  }

  const normalized = trimmed.replace(/^data:[^,]+,/i, "");
  const safeMime = mimeType?.trim() || "application/pdf";
  return `data:${safeMime};base64,${normalized}`;
};

const fileToDataUrl = async (file: File): Promise<string> => {
  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  const mimeType = file.type || "application/pdf";
  return `data:${mimeType};base64,${base64}`;
};
const uploadResumeToImageKit = async (
  fileName: string,
  dataUrl: string
): Promise<string> => {
  if (!IMAGEKIT_PUBLIC_KEY || !IMAGEKIT_PRIVATE_KEY || !IMAGEKIT_URL_ENDPOINT) {
    throw new Error("ImageKit credentials are not configured");
  }

  const base64File = dataUrl.replace(/^data:[^,]+,/, "");

  try {
    const response = await imagekit.upload({
      file: base64File,
      fileName,
      folder: IMAGEKIT_FOLDER || undefined,
    });

    if (!response?.url) {
      throw new Error("Failed to upload resume to ImageKit");
    }

    return response.url;
  } catch (err) {
    console.error("[Interview API] ImageKit upload failed", err);
    throw new Error("Failed to upload resume to ImageKit");
  }
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

    const contentType = req.headers.get("content-type") || "";
    let requestPayload: Record<string, any> = {};

    if (contentType.includes("application/json")) {
      requestPayload = await req.json();
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      formData.forEach((value, key) => {
        requestPayload[key] = value;
      });
    } else {
      return NextResponse.json(
        { status: "error", message: "Unsupported Content-Type" },
        { status: 415 }
      );
    }

    const resumeUrl =
      typeof requestPayload.resumeurl === "string"
        ? requestPayload.resumeurl.trim()
        : "";
    const jobDescription =
      typeof requestPayload.JobDescription === "string"
        ? requestPayload.JobDescription.trim()
        : "";
    const jobRole =
      typeof requestPayload.JobRole === "string"
        ? requestPayload.JobRole.trim()
        : "";
    const yearsInput = requestPayload.yearsOfExperience;
    const yearsOfExperience =
      typeof yearsInput === "number"
        ? yearsInput
        : typeof yearsInput === "string"
        ? Number(yearsInput)
        : NaN;

    let resumeFileName =
      typeof requestPayload.resumeFileName === "string" &&
      requestPayload.resumeFileName.trim()
        ? requestPayload.resumeFileName.trim()
        : "";
    let resumeBase64 =
      typeof requestPayload.resumeFileBase64 === "string"
        ? requestPayload.resumeFileBase64.trim()
        : "";
    const resumeFile =
      requestPayload.resumeFile instanceof File
        ? (requestPayload.resumeFile as File)
        : null;

    if (!resumeBase64 && resumeFile) {
      resumeBase64 = await fileToDataUrl(resumeFile);
      if (!resumeFileName && resumeFile.name) {
        resumeFileName = resumeFile.name;
      }
      if (!requestPayload.resumeFileType) {
        requestPayload.resumeFileType = resumeFile.type;
      }
    }

    if (!resumeFileName) {
      resumeFileName = "resume.pdf";
    }

    if (!resumeBase64) {
      return NextResponse.json(
        { status: "error", message: "A resume file is required" },
        { status: 400 }
      );
    }

    const normalizedResumeDataUrl = ensureDataUrl(
      resumeBase64,
      typeof requestPayload.resumeFileType === "string"
        ? requestPayload.resumeFileType
        : undefined
    );

    let uploadedResumeUrl = resumeUrl;

    if (!uploadedResumeUrl) {
      try {
        uploadedResumeUrl = await uploadResumeToImageKit(
          resumeFileName,
          normalizedResumeDataUrl
        );
      } catch (uploadError) {
        console.error("[Interview API] Resume upload error:", uploadError);
        return NextResponse.json(
          { status: "error", message: "Failed to upload resume to ImageKit" },
          { status: 502 }
        );
      }
    }

    if (!uploadedResumeUrl || !jobRole || !jobDescription) {
      return NextResponse.json(
        {
          status: "error",
          message: "resume, JobDescription, and JobRole are required",
        },
        { status: 400 }
      );
    }

    if (Number.isNaN(yearsOfExperience) || yearsOfExperience < 0) {
      return NextResponse.json(
        { status: "error", message: "yearsOfExperience must be a valid non-negative number" },
        { status: 400 }
      );
    }

    const techStack = buildTechStack(jobDescription, jobRole);

    const workflowBody = {
      resumeurl: uploadedResumeUrl,
      JobDescription: jobDescription,
      JobRole: jobRole,
      yearsOfExperience: yearsOfExperience.toString(),
    };

    const workflowResponse = await fetch(WORKFLOW_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(workflowBody),
    });

    if (!workflowResponse.ok) {
      const errorText = await workflowResponse.text();
      console.error("[Interview API] Workflow error:", workflowResponse.status, errorText);
      return NextResponse.json(
        {
          status: "error",
          message: `Workflow request failed with status ${workflowResponse.status}`,
        },
        { status: 502 }
      );
    }

    const workflowPayload = await workflowResponse.json().catch((err) => {
      console.error("[Interview API] Failed to parse workflow response:", err);
      throw new Error("Invalid workflow response format");
    });

    // Ensure the original JobDescription is preserved in workflowQuestions
    const workflowPayloadWithJobDescription = {
      ...workflowPayload,
      JobDescription: jobDescription,
    };

    const workflowQuestions = extractQuestions(workflowPayload);

    if (!workflowQuestions.length) {
      return NextResponse.json(
        {
          status: "error",
          message: "Workflow response did not contain a valid questions array",
        },
        { status: 502 }
      );
    }

    const topQuestions = workflowQuestions
      .filter((question) => typeof question === "string" && question.trim())
      .slice(0, 15)
      .map((question) => question.trim());

    if (!topQuestions.length) {
      return NextResponse.json(
        {
          status: "error",
          message: "No valid questions were returned from the workflow",
        },
        { status: 502 }
      );
    }

    const newInterview = new Interview({
      user: userId,
      jobRole,
      techStack,
      yearsOfExperience,
      resumeText: "",
      resumeUrl: uploadedResumeUrl,
      questions: topQuestions.map((question) => ({
        text: question,
        answer: "",
        analysis: null,
      })),
      workflowQuestions: workflowPayloadWithJobDescription,
      status: "in-progress",
      usedFallbackQuestions: false,
    });

    await newInterview.save();

    return NextResponse.json(
      {
        status: "success",
        resumeurl: uploadedResumeUrl,
        questions: topQuestions,
        Top15Questions: topQuestions,
        interview: newInterview,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating interview: ", error);
    const errorMessage =
      typeof error?.message === "string"
        ? error.message
        : "Internal server error";
    return NextResponse.json(
      { status: "error", message: errorMessage },
      { status: error.statusCode || 500 }
    );
  }
}

