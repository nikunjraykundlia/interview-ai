# 🎙️ AI Powered Agentic Interview

This is a smart, full-stack Agentic AI interview platform designed to simulate real-life technical interviews. Leveraging Agentic AI, it generates role-specific questions, analyzes user responses, scores performance, and offers personalized feedback. All in one seamless experience with 2 agents and 2 sub-agents.
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

- 📱 **Mobile-First Design**  
  Fully responsive interface optimized for all devices, ensuring a seamless experience on mobile, tablet, and desktop.

- 🌓 **Dark & Light Mode**  
  Native theme support with system preference detection and manual toggle, featuring carefully crafted color palettes for both modes.

- 🎨 **Mentor Dashboard**  
  A beautifully designed mentor interface with real-time feedback, performance metrics, and actionable insights.

- 🔬 **Research Page**  
  Comprehensive research interface with advanced filtering and data visualization capabilities.

---

## 🛠️ Tech Stack

| Category       | Technology       |
|----------------|------------------|
| **Frontend**   | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
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

# start dev server (http://localhost:3030)
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
