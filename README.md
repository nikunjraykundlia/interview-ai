# 🎙️ AI Powered Agentic Interview

InterviewAI is a smart, full-stack mock interview platform designed to simulate real-life technical interviews. Leveraging Agentic AI, it generates role-specific questions, analyzes user responses, scores performance, and offers personalized feedback — all in one seamless experience with 2 agents and 2 sub-agents.
---

## 🚀 Features

- 🧠 **AI-Generated Questions**  
  Get tailored interview questions based on your job role and the Resume Details you enter.

- 🎤 **Voice-Based Interviewing**  
  Use your mic to respond — the AI converts speech to text and evaluates your answers.

- ✍️ **Editable Transcripts**  
  Fix any misinterpretations from the mic input before submitting for analysis.

- 📊 **Smart Scoring System**  
  Your responses are scored on relevance, clarity, and depth.

- 💡 **Personalized Feedback**  
  Get improvement tips for each answer and your overall performance.

- 📄 **PDF Resume Upload & Parsing**  
  Upload your resume as PDF and the system automatically extracts skills, experience, projects, and education.

- 📈 **Test History & Dashboard**  
  Track your past interviews, scores, and feedback — all in one place.

- 🔍 **Real-time Analysis Updates**  
  Get instant feedback as you answer questions with automatic polling for analysis results.

- 📊 **Detailed Results Page**  
  View comprehensive results with Overview and Detailed Feedback tabs, including print and share functionality.

- 🎯 **Question Analysis Page**  
  Review individual question analysis with scores, technical feedback, and improvement suggestions.

---

## 🛠️ Tech Stack

| Category       | Technology       |
|----------------|------------------|
| **Frontend**   | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| **Backend**    | Next.js API Routes (Node.js runtime) |
| **Database**   | MongoDB with Mongoose ODM |
| **AI & NLP**   | Google Gemini API, N8N Agentic Workflows |
| **Voice Input**| Web Speech API (Browser) |
| **File Processing** | PDF.js (pdfjs-dist), pdf-parse |
| **Storage**    | ImageKit (for resume uploads) |
| **Authentication** | JWT (jsonwebtoken, jose) |
| **UI Libraries** | Lucide React (icons), next-themes (theme support) |

---

## 📦 Requirements

- Node.js 18.18+ (20+ recommended)
- MongoDB (local service or MongoDB Atlas)

## 🔐 Environment Variables

Create a `.env.local` in the project root with:

```
JWT_SECRET=your_strong_secret
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key

# ImageKit Integration (For resume uploads)
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=your_imagekit_url_endpoint
IMAGEKIT_FOLDER=your_imagekit_folder
```

Notes:
- `MONGODB_URI` can be local (e.g., `mongodb://127.0.0.1:27017`) or Atlas.
- `JWT_SECRET` can be any strong random string.

## ▶️ Run locally

```bash
# install deps
npm install

# start dev server (http://localhost:3000)
npm run dev
```

## 🧪 Scripts

- `npm run dev` — start Next.js dev server (Turbopack)
- `npm run build` — production build
- `npm start` — start production server

## 📁 Project structure (high level)

```
app/
  api/                    # Next.js API routes
    auth/                 # Authentication endpoints
      check/              # Token validation
      login/              # User login
      logout/             # User logout
      signup/             # User registration
    interview/            # Interview API endpoints
      [id]/               # Interview-specific operations
        route.ts          # GET, POST, DELETE interview
        answer/           # Answer submission with n8n analyzer
        complete/         # Interview completion with n8n feedback
      route.ts            # POST - Create new interview
      user/               # GET - Get user's interviews
    upload-resume/        # POST - PDF resume upload & parsing
  interview/              # Interview pages
    [id]/                 # Interview session pages
      page.tsx            # Main interview session
      analysis/           # Question-by-question analysis page
      results/            # Results page (Overview & Feedback tabs)
    new/                  # Create new interview form
    page.tsx              # Interview list page
  dashboard/             # User dashboard
  login/, signup/        # Authentication pages
  about/                 # About page
components/
  AnalysisPage/          # Question analysis components
  auth-components/       # Login/signup form components
  interview/             # Interview session components
  interviewSession/     # Interview recording & voice input
  ResultsPage/           # Results display components
  small-components/      # Reusable UI components
  errors/                # Error handling components
lib/
  mongodb.ts             # MongoDB connection
  auth.ts                # JWT authentication utilities
  gemini.ts              # Gemini AI fallback integration
  n8nAnalyzer.ts         # n8n Q&A analyzer webhook
  n8nInterviewFeedback.ts # n8n interview feedback webhook
  parseResume.ts         # PDF resume parsing logic
  pdfExtractor.ts        # PDF text extraction utilities
  resumeConfig.ts        # Resume upload configuration
models/
  User.ts                # User MongoDB schema
  Interview.ts           # Interview MongoDB schema
public/                  # Static assets (images, logo)
```

## 🔐 Auth & Data

- JWT-based auth; token stored in `localStorage` as `auth_token`.
- MongoDB connection configured in `lib/mongodb.ts` (db name: `interview-ai`).

## 🤖 AI Features

- **Question Generation**: AI-powered interview questions via n8n agentic workflows
- **Response Analysis**: Real-time analysis of individual Q&A pairs via n8n analyzer webhook
- **Interview Feedback**: Comprehensive feedback generation via n8n feedback webhook

### n8n Agentic Workflow Integration

The platform integrates with three n8n agentic workflows for enhanced AI capabilities:

#### 1. Question Generation Workflow
- **Purpose**: Generates role-specific interview questions based on job description and resume
- **Location**: `app/api/interview/route.ts`
- **Payload**: Job role, years of experience, job description, resume details, tech stack
- **Response**: Array of interview questions

#### 2. Q&A Analyzer Workflow
- **Purpose**: Analyzes individual question-answer pairs in real-time
- **Location**: `lib/n8nAnalyzer.ts`
- **Usage**: Called asynchronously when answers are submitted (non-blocking)
- **Response**:
  ```json
  {
    "score": 0-100,
    "technicalFeedback": "string",
    "communicationFeedback": "string",
    "improvementSuggestions": ["string"]
  }
  ```
- **Features**:
  - Asynchronous processing (fire-and-forget)
  - Automatic database updates when analysis completes
  - 20-second timeout
  - Handles nested response structures

#### 3. Interview Feedback Workflow
- **Purpose**: Generates comprehensive overall interview feedback after completion
- **Location**: `lib/n8nInterviewFeedback.ts`
- **Response**:
  ```json
  {
    "overallFeedback": "string",
    "strengths": ["string"],
    "areasForImprovement": ["string"],
    "nextSteps": ["string"]
  }
  ```
- **Features**:
  - Retry logic (1 retry with 2-second delay)
  - 30-second timeout
  - Automatic fallback to Gemini if n8n fails
  - Supports multiple payload formats (primary, legacy, fallback)
  - Correlation ID tracking for debugging
  - Handles nested response structures (data, body, output, response)

### Workflow Trigger Points

1. **Question Generation**: Triggered when creating a new interview (`POST /api/interview`)
   - Sends job role, years of experience, job description, tech stack, and resume data
   - Returns array of 15 interview questions
   - Falls back to Gemini if n8n fails

2. **Answer Analysis**: Triggered asynchronously when submitting an answer (`POST /api/interview/[id]/answer`)
   - Non-blocking: answer is saved immediately, analysis happens in background
   - Updates interview document when analysis completes
   - Analysis page polls every 1.5 seconds for updates

3. **Interview Feedback**: Triggered when completing an interview (`POST /api/interview/[id]/complete`)
   - Sends all Q&A pairs along with interview metadata
   - Generates overall feedback, strengths, areas for improvement, and next steps

## 📊 Database Schema

### Interview Model
- User reference (ObjectId)
- Job role, tech stack, years of experience
- Resume text/URL
- Questions array with answers and analysis
- Overall score and feedback
- Status (pending, in-progress, completed)
- Timestamps (createdAt, completedAt)

### User Model
- Email, password (hashed)
- User profile information
- Timestamps

## 🚀 Development Notes

- Uses Next.js 15 with Turbopack for fast development
- React 19 with Server Components and Client Components
- TypeScript for type safety
- MongoDB connection pooling via Mongoose
- Environment-based configuration
- Error handling with fallback mechanisms
- Async processing for non-blocking operations