# 🎙️ InterviewAI — AI-Powered Mock Interview Platform

InterviewAI is a smart, full-stack mock interview platform designed to simulate real-life technical interviews. Leveraging AI, it generates role-specific questions, analyzes user responses, scores performance, and offers personalized feedback — all in one seamless experience.
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

- 📝 **Single-field Resume Details**  
  Provide your skills, projects, and experience in one field.

- 📈 **Test History & Dashboard**  
  Track your past interviews, scores, and feedback — all in one place.

---

## 🛠️ Tech Stack

| Category       | Technology       |
|----------------|------------------|
| **Frontend**   | Next.js (App Router), TypeScript, Tailwind CSS |
| **Backend**    | Next.js API Routes (Edge/Node runtimes) |
| **Database**   | MongoDB          |
| **AI & NLP**   | Google Gemini API |
| **Voice Input**| Web Speech API |

---

## 📦 Requirements

- Node.js 18.18+ (20+ recommended)
- MongoDB (local service or MongoDB Atlas)
- Google Generative AI Key (Gemini)

## 🔐 Environment Variables

Create a `.env.local` in the project root with:

```
JWT_SECRET=your_strong_secret
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
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
  api/            # Next.js API routes (auth, interview)
  dashboard/      # Dashboard page
  login/, signup/ # Auth pages
components/       # UI components (NavBar, Hero, interview components)
lib/              # libs (mongodb, auth, gemini)
public/           # static assets (images, logo)
```

## 🔐 Auth & Data

- JWT-based auth; token stored in `localStorage` as `auth_token`.
- MongoDB connection configured in `lib/mongodb.ts` (db name: `interview-ai`).

## 🤖 AI Features

- Question generation, response analysis, and interview feedback via Gemini models (`lib/gemini.ts`).