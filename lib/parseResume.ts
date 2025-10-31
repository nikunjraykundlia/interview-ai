// NOTE: Uses pdfjs-dist (Mozilla PDF.js) - fully compatible with Turbopack
// Use legacy build for Node.js server-side environment
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

export interface ParsedResume {
  rawText: string;
  internships: string[];
  projects: string[];
  education: string[];
  skills: string[];
  experience: string[];
  otherSections?: Record<string, string[]>;
  scanned?: boolean;
  notes?: string;
  confidence?: Record<string, "direct" | "heuristic">;
}

const HEADING_REGEX = /^(?:\s*((?:summary|about me|internship|internships|work experience|professional experience|experience|projects|project|education|education & certifications|skills|technical skills|certifications))\b[:\s-]*)/gim;
const BULLET_REGEX = /^\s*(?:[-•*–]|\d+\.|[a-zA-Z]\.)\s*/;
const MONTH = "(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)";
const DATE_RANGE_RE = new RegExp(`${MONTH}\\.?[a-z]*\\s?\\d{2,4}\\s*[–-]\\s*(?:${MONTH}\\.?[a-z]*\\s?\\d{2,4}|present|current)`, "i");
const PROJECT_VERB_RE = /^(project:|\s*(built|developed|implemented|created|designed|engineered|architected|led|optimized)\b)/i;
const TITLE_LINE_RE = /([A-Z][A-Za-z0-9&\-\/\s]{2,})\s+[—\-–]\s+([A-Z][A-Za-z0-9&\-\/\s]{2,})/;

function normalizeWhitespace(s: string) {
  return s.replace(/\u00A0/g, " ").replace(/[\t ]+/g, " ").trimEnd();
}

function splitLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => normalizeWhitespace(l))
    .filter((l) => l.length > 0);
}

function removeRepeatedHeadersFooters(pagesLines: string[][]): string[][] {
  if (pagesLines.length < 2) return pagesLines;
  const topMap = new Map<string, number>();
  const bottomMap = new Map<string, number>();
  for (const lines of pagesLines) {
    if (lines.length === 0) continue;
    const top = lines[0].slice(0, 120);
    const bottom = lines[lines.length - 1].slice(0, 120);
    topMap.set(top, (topMap.get(top) || 0) + 1);
    bottomMap.set(bottom, (bottomMap.get(bottom) || 0) + 1);
  }
  const isHeader = (s: string) => (topMap.get(s.slice(0, 120)) || 0) >= Math.max(2, Math.floor(pagesLines.length * 0.6));
  const isFooter = (s: string) => (bottomMap.get(s.slice(0, 120)) || 0) >= Math.max(2, Math.floor(pagesLines.length * 0.6));
  return pagesLines.map((lines) => {
    const res = lines.slice();
    if (res.length > 0 && isHeader(res[0])) res.shift();
    if (res.length > 0 && isFooter(res[res.length - 1])) res.pop();
    return res;
  });
}

function splitBullets(lines: string[]): string[] {
  const out: string[] = [];
  for (const line of lines) {
    const parts = line.split(/\n+/);
    for (let p of parts) {
      p = p.trim();
      if (!p) continue;
      out.push(p);
    }
  }
  return out;
}

function extractSections(rawLines: string[]): ParsedResume {
  const sections: Record<string, string[]> = {};
  let current: string | null = null;
  for (const line of rawLines) {
    const m = line.match(HEADING_REGEX);
    if (m) {
      const key = m[0].toLowerCase().replace(/[:\s-]+$/g, "").trim();
      current = key;
      if (!sections[current]) sections[current] = [];
      continue;
    }
    if (current) {
      sections[current].push(line);
    }
  }

  const toArray = (k: string) => sections[k] || [];

  function groupJobs(lines: string[]): string[] {
    const entries: string[] = [];
    let buf: string[] = [];
    const flush = () => { if (buf.length) { entries.push(buf.join(" \u2022 ")); buf = []; } };
    for (const l of lines) {
      const line = l.replace(BULLET_REGEX, "");
      const isStart = DATE_RANGE_RE.test(line) || TITLE_LINE_RE.test(line);
      if (isStart) flush();
      buf.push(line);
      const short = line.trim();
      if (DATE_RANGE_RE.test(short)) { /* likely entry boundary soon */ }
    }
    flush();
    return entries.filter((s) => s.length > 0);
  }

  function detectProjects(lines: string[], rawAll: string[]): string[] {
    const out: string[] = [];
    for (const l of lines) {
      const s = l.trim();
      if (PROJECT_VERB_RE.test(s) || /^\s*project\s*[:\-]/i.test(s) || /^[A-Z][A-Za-z0-9\s\-]{3,}\:$/.test(s)) {
        out.push(s.replace(/^project\s*[:\-]\s*/i, ""));
      }
    }
    if (out.length === 0) {
      for (const l of rawAll) {
        const s = l.trim();
        if (PROJECT_VERB_RE.test(s)) out.push(s);
        if (out.length >= 50) break;
      }
    }
    return Array.from(new Set(out));
  }

  function extractSkillsBuckets(sk: string[]): string[] {
    const base = sk.flatMap((l) => l.split(/[,•;|]/g)).map((s) => s.trim()).filter(Boolean);
    return base;
  }

  const expLines = [
    ...toArray("experience"),
    ...toArray("work experience"),
    ...toArray("professional experience"),
  ];
  const internLines = [
    ...toArray("internship"),
    ...toArray("internships"),
  ];
  const experience = groupJobs(expLines.concat(internLines));

  const projectLines = [
    ...toArray("projects"),
    ...toArray("project"),
  ];
  const allLines = Object.values(sections).flat();
  const projects = detectProjects(projectLines, allLines);
  const education = toArray("education");
  const skills = extractSkillsBuckets([...toArray("skills"), ...toArray("technical skills")]);

  const other: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(sections)) {
    if (![
      "experience",
      "work experience",
      "professional experience",
      "internship",
      "internships",
      "projects",
      "project",
      "education",
      "skills",
      "technical skills",
    ].includes(k)) {
      other[k] = v;
    }
  }

  return {
    rawText: rawLines.join("\n"),
    internships: toArray("internship").concat(toArray("internships")),
    projects,
    education,
    skills,
    experience,
    otherSections: Object.keys(other).length ? other : undefined,
    confidence: {
      internships: sections["internship"] || sections["internships"] ? "direct" : "heuristic",
      projects: sections["projects"] || sections["project"] ? "direct" : "heuristic",
      education: sections["education"] ? "direct" : "heuristic",
      skills: sections["skills"] || sections["technical skills"] ? "direct" : "heuristic",
      experience: sections["experience"] || sections["work experience"] || sections["professional experience"] ? "direct" : "heuristic",
    },
  };
}

function keywordFallback(rawText: string): Partial<ParsedResume> {
  const sentences = rawText.split(/[\n\.]+/).map((s) => s.trim()).filter(Boolean);
  const pick = (kw: RegExp, n = 8) => sentences.filter((s) => kw.test(s)).slice(0, n);
  return {
    internships: pick(/intern/i),
    projects: pick(/project|built|developed|implemented/i),
    experience: pick(/engineer|developer|led|managed|designed/i),
    education: pick(/university|bachelor|master|b\.?tech|m\.?tech|degree/i),
    skills: pick(/js|javascript|typescript|python|react|node|sql|aws|docker|kubernetes|java|c\+\+|c#|go/i, 20),
  } as Partial<ParsedResume>;
}

export async function parsePdfResume(buffer: Buffer): Promise<ParsedResume> {
  console.log("[parseResume] Starting PDF parse, buffer size:", buffer.length);
  
  let rawText = "";
  try {
    console.log("[parseResume] Loading PDF document...");
    // Load PDF document with worker disabled for Node.js environment
    const loadingTask = pdfjsLib.getDocument({ 
      data: new Uint8Array(buffer),
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true
    });
    const pdfDoc = await loadingTask.promise;
    console.log("[parseResume] PDF loaded successfully, pages:", pdfDoc.numPages);
    
    // Extract text from all pages
    const textPromises = [];
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      textPromises.push(
        pdfDoc.getPage(i).then(page => {
          console.log(`[parseResume] Processing page ${i}...`);
          return page.getTextContent().then(content => {
            const pageText = content.items.map((item: any) => item.str).join(' ');
            console.log(`[parseResume] Page ${i} text length:`, pageText.length);
            return pageText;
          });
        })
      );
    }
    
    const pageTexts = await Promise.all(textPromises);
    rawText = pageTexts.join('\n');
    console.log("[parseResume] PDF parsed successfully, total text length:", rawText.length);
    console.log("[parseResume] First 200 chars:", rawText.slice(0, 200));
  } catch (e: any) {
    console.error("[parseResume] Failed to parse PDF - Error name:", e?.name);
    console.error("[parseResume] Failed to parse PDF - Error message:", e?.message);
    console.error("[parseResume] Failed to parse PDF - Full error:", e);
    return {
      rawText: "",
      internships: [],
      projects: [],
      education: [],
      skills: [],
      experience: [],
      scanned: true,
      notes: `Failed to parse PDF: ${e?.message || 'Unknown error'}`,
    };
  }

  const pages = rawText.split("\n"); // Split by newlines from page joins
  const pagesLines = [splitLines(rawText)]; // Treat as single document
  const cleanedPages = removeRepeatedHeadersFooters(pagesLines);
  const allLines = cleanedPages.flat();

  const scannedLikely = rawText.length < Math.max(800, Math.floor(buffer.length * 0.002));
  if (scannedLikely) {
    return {
      rawText,
      internships: [],
      projects: [],
      education: [],
      skills: [],
      experience: [],
      scanned: true,
      notes: `PDF appears scanned or non-selectable (bytes=${buffer.length}, text=${rawText.length}). No OCR attempted.`,
    };
  }

  const structured = extractSections(splitBullets(allLines));

  // If no headings were found, apply keyword fallback to populate sections (except skills)
  const hasAnySection =
    structured.experience.length ||
    structured.projects.length ||
    structured.skills.length ||
    structured.education.length ||
    (structured.internships?.length || 0) > 0;

  if (!hasAnySection) {
    const fb = keywordFallback(rawText);
    structured.internships = fb.internships || structured.internships;
    structured.projects = fb.projects || structured.projects;
    structured.education = fb.education || structured.education;
    structured.experience = fb.experience || structured.experience;
    structured.notes = ((structured.notes ? structured.notes + " " : "") +
      "Sections inferred heuristically due to missing headings.").trim();
  }

  return structured;
}
