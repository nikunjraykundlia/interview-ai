# 🎙️ AI Powered Agentic Interview

This is a smart, full-stack agentic ai interview platform designed to simulate real-life technical interviews. Leveraging Agentic AI, it generates role-specific questions, analyzes user responses, scores performance, and offers personalized feedback. All in one seamless experience with 2 agents and 2 sub-agents.
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

- 🎨 **Mentor Dashboard**  
  A beautifully designed mentor interface with real-time feedback, performance metrics, and actionable insights.

-  **Research Page**  
  Comprehensive research interface with advanced filtering and data visualization capabilities.

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
| **Authentication** | JWT (jose) + Google Sign-In (Firebase Auth) |
| **UI/UX** | Tailwind CSS, Lucide Icons, Glassmorphism Effects, next-themes (theme support) |
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

# Firebase (Google Sign-In)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Firebase Admin (server-side verification for /api/auth/google)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Notes:
- `MONGODB_URI` can be local (e.g., `mongodb://127.0.0.1:27017`) or Atlas.

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

## 🔐 Auth & Data

- MongoDB connection configured in `lib/mongodb.ts` (db name: `interview-ai`).
- Google Sign-In flow:
  - Client popup sign-in via Firebase Auth (`lib/firebaseClient.ts`)
  - Exchange Firebase ID token at `POST /api/auth/google` to get an app JWT
  - Server-side verification via Firebase Admin (`lib/firebaseAdmin.ts`)

## 🚀 Deployment (Render)

- Use Node.js LTS. This project pins Node in `package.json` via `engines.node`.
- Set the same environment variables in Render dashboard (do not rely on `.env.local`).
- In Firebase Console add your Render domain to:
  - Authentication -> Settings -> Authorized domains

## 🤖 AI Features

- **Question Generation**: AI-powered interview questions via n8n agentic workflows
- **Response Analysis**: Real-time analysis of individual Q&A pairs via n8n analyzer webhook
- **Interview Feedback**: Comprehensive feedback generation via n8n feedback webhook
- **Mentor Feedback System**: Real-time feedback and analysis with visual metrics and improvement suggestions.

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

#### 4. Mentor Agent Review Workflow
- **Purpose**: Provides detailed critique of interviewer performance and question quality
- **Location**: `app/api/interview/[id]/mentor`
- **Response**:
  ```json
  {
  "overallCritique": "string",
  "questionQualityIssues": "string",
  "missedOpportunities": "string",
  "recommendedImprovedQuestions": "string",
  "actionableAdviceForInterviewerAgent": "string"
  }
  ```

### Workflow Trigger Points

1. **Question Generation**: Triggered when creating a new interview (`POST /api/interview`)
   - Sends job role, years of experience, job description, tech stack, and resume data
   - Returns array of interview questions
   - Falls back to Gemini if n8n fails
   - Stores questions in `workflowQuestions` field if using n8n, otherwise generates locally

2. **Answer Analysis**: Triggered asynchronously when submitting an answer (`POST /api/interview/[id]/answer`)
   - Non-blocking: answer is saved immediately, analysis happens in background
   - Updates interview document when analysis completes
   - Analysis page polls every 1.5 seconds for updates
   - Stores analysis results in `questions[].analysis` object

3. **Interview Feedback**: Triggered when completing an interview (`POST /api/interview/[id]/complete`)
   - Sends all Q&A pairs along with interview metadata
   - Generates comprehensive feedback via n8n feedback webhook
   - Stores feedback in `feedback` object with overallFeedback, strengths, areasForImprovement, nextSteps
   - Sets interview status to "completed" and updates completedAt timestamp

4. **Mentor Agent Review**: Triggered when requesting mentor feedback (`POST /api/interview/[id]/mentor`)
   - Sends completed interview data for mentor analysis
   - Generates detailed critique of question quality and interviewer performance
   - Stores review in `mentorAgentReviews` array with comprehensive feedback fields
   - Provides actionable advice for improving future interview sessions

## 📊 Database Schema

### User Model
- **name** (String, required)
- **email** (String, required, unique)
- **password** (String, required, minLength: 8)
- **createdAt** (Date, auto)
- **updatedAt** (Date, auto)

### Interview Model
- **user** (ObjectId, ref: 'User', required)
- **jobRole** (String, required)
- **techStack** ([String], required)
- **yearsOfExperience** (Number, required)
- **resumeText** (String, default: "")
- **resumeUrl** (String, default: "")
- **questions** (Array of Question objects)
  - **text** (String, required)
  - **answer** (String, default: "")
  - **analysis** (Object)
    - **score** (Number, default: 0)
    - **technicalFeedback** (String)
    - **communicationFeedback** (String)
    - **improvementSuggestions** ([String])
- **workflowQuestions** (Mixed, default: null)
- **overallScore** (Number, default: 0)
- **feedback** (Object)
  - **overallFeedback** (String)
  - **strengths** ([String])
  - **areasForImprovement** ([String])
  - **nextSteps** ([String])
- **status** (String, enum: ["pending", "in-progress", "completed"], default: "pending")
- **completedAt** (Date, default: null)
- **result** (String, default: null)
- **mentorAgentReviews** (Array of Review objects)
  - **overallCritique** (String)
  - **questionQualityIssues** (String)
  - **missedOpportunities** (String)
  - **recommendedImprovedQuestions** (String)
  - **actionableAdviceForInterviewerAgent** (String)
  - **createdAt** (Date, default: now)
- **usedFallbackQuestions** (Boolean, default: false)
- **createdAt** (Date, auto)
- **updatedAt** (Date, auto)

## 🚀 Development Notes

- Uses Next.js 15 with Turbopack for fast development
- React 19 with Server Components and Client Components
- TypeScript for type safety
- MongoDB connection pooling via Mongoose
- Environment-based configuration
- Error handling with fallback mechanisms
- Async processing for non-blocking operations
- Modern UI with glassmorphism and gradient effects
- Real-time updates with Server-Sent Events (SSE)
- Interactive UI components with smooth animations
- Advanced filtering and data visualization interface