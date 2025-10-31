export const MAX_CONTEXT_CHARS = parseInt(process.env.RESUME_MAX_CONTEXT_CHARS || "50000", 10);

export const SECTION_LIMITS = {
  experienceItems: parseInt(process.env.RESUME_LIMIT_EXPERIENCE || "12", 10),
  projectItems: parseInt(process.env.RESUME_LIMIT_PROJECTS || "8", 10),
  skillItems: parseInt(process.env.RESUME_LIMIT_SKILLS || "40", 10),
  educationItems: parseInt(process.env.RESUME_LIMIT_EDUCATION || "6", 10),
};

export const UPLOAD_LIMIT_BYTES = parseInt(process.env.RESUME_UPLOAD_LIMIT_BYTES || String(10 * 1024 * 1024), 10);
