import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateText } from "@/lib/ai/gemini";

// Check if Gemini API key is valid
function isGeminiAvailable(): boolean {
  return !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10;
}

const INTERVIEW_SYSTEM_PROMPT = `You are a senior technical interviewer at {company}. You are interviewing a candidate for the {role} position.

Your interview style:
- Be professional but friendly
- Ask one question at a time
- Mix behavioral, technical, and problem-solving questions
- For Indian service companies (TCS, Infosys, Wipro, HCL, Cognizant): focus on aptitude, CS fundamentals, OOPs, DBMS, basic programming, puzzles
- For product companies (Amazon, Google, Microsoft, Flipkart): focus on DSA, algorithms, system design, leadership principles
- Tailor difficulty to the company's actual hiring process
- Ask follow-up questions based on answers
- Be encouraging but honest in feedback

For EVALUATION (when action=evaluate):
- Score from 1-10 based on: correctness, depth, communication, structure
- Provide specific, actionable feedback
- Mention what was good and what to improve
- Keep feedback concise (2-3 sentences)
- For the final question, provide overall assessment`;

function getCompanyContext(company: string): string {
  const contexts: Record<string, string> = {
    "TCS": "TCS focuses on aptitude (quantitative, logical), verbal ability, and basic programming. Interview rounds: online test → technical interview → HR interview. Questions often include puzzles, SQL queries, OOPs concepts, and basic DSA.",
    "Infosys": "Infosys emphasizes logical reasoning, programming fundamentals, and communication skills. Their process includes coding test, technical interview, and HR. Common topics: Java basics, DBMS normalization, OS concepts, simple puzzles.",
    "Wipro": "Wipro's hiring focuses on basic technical knowledge and communication. Questions cover C/C++ fundamentals, simple data structures, DBMS basics, and behavioral questions.",
    "HCL": "HCL typically asks about programming basics, aptitude, and interpersonal skills. Interview includes technical and HR rounds with questions on data structures basics, OS, and networking.",
    "Cognizant": "Cognizant (GenC) focuses on OOPs, DBMS, web technologies, and problem-solving. Their process includes online assessment, technical interview, and managerial round.",
    "Accenture": "Accenture uses a mix of technical and behavioral questions. They value leadership, teamwork, and client-facing skills. Technical questions focus on web development and cloud basics.",
    "Amazon": "Amazon interviews are heavily based on Leadership Principles (LPs). They ask STAR-format behavioral questions combined with DSA/coding problems. Focus on: customer obsession, ownership, bias for action, dive deep.",
    "Google": "Google interviews are notoriously difficult with 2-3 coding rounds focusing on DSA (arrays, trees, graphs, dynamic programming), system design, and Googleyness. Questions are algorithmic and require optimization.",
    "Microsoft": "Microsoft focuses on coding (medium-hard DSA), system design, and behavioral questions. They value growth mindset, collaboration, and technical depth.",
    "Flipkart": "Flipkart's interview process includes coding rounds (DSA), CS fundamentals, and system design. Questions often involve e-commerce domain problems.",
  };
  return contexts[company] || `Interview at ${company} for the role.`;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, company, role, question, answer, questionNumber, totalQuestions } = body;

    if (action === "start") {
      // Try AI first, fall back to pre-written questions
      if (isGeminiAvailable()) {
        try {
          const systemPrompt = INTERVIEW_SYSTEM_PROMPT
            .replace("{company}", company || "tech company")
            .replace("{role}", role || "Software Engineer");

          const context = getCompanyContext(company);

          const userPrompt = `You are starting a mock interview at ${company} for the ${role} position.

${context}

Start the interview with a greeting and your first question. Ask ONE question only. Make it relevant to the company's actual interview process.

Format: Brief greeting (1 sentence) + the question. Keep it conversational.`;

          const question_text = await generateText(systemPrompt, userPrompt, 0.7);
          return NextResponse.json({ question: question_text.trim() });
        } catch (aiError) {
          console.warn("AI start failed, using fallback:", aiError);
        }
      }
      // Fallback: use pre-written first question
      const firstQuestion = getStartQuestion(company, role);
      return NextResponse.json({ question: firstQuestion });
    }

    if (action === "answer") {
      const isLastQuestion = questionNumber >= totalQuestions;

      // Try AI evaluation first
      if (isGeminiAvailable()) {
        try {
          const systemPrompt = INTERVIEW_SYSTEM_PROMPT
            .replace("{company}", company || "tech company")
            .replace("{role}", role || "Software Engineer");

          const context = getCompanyContext(company);

          const evalPrompt = `INTERVIEW CONTEXT:
Company: ${company} | Role: ${role}
${context}

QUESTION ASKED:
${question}

CANDIDATE'S ANSWER:
${answer}

${isLastQuestion ? "This is the LAST question." : ""}

Evaluate this answer and provide:
1. SCORE (1-10): Rate correctness, depth, communication, and structure
2. FEEDBACK (2-3 sentences): What was good and what to improve. Be specific.
${isLastQuestion ? "3. OVERALL ASSESSMENT: Brief summary of the candidate's performance" : ""}

${isLastQuestion
  ? 'Return JSON: {"score": <1-10>, "feedback": "<feedback>", "nextQuestion": null, "overall": "<overall assessment>"}'
  : `Then ask the NEXT question relevant to ${company}'s ${role} interview process. Return JSON: {"score": <1-10}, "feedback": "<feedback>", "nextQuestion": "<next question>"}`
}

Return ONLY valid JSON, no markdown.`;

          const result = await generateText("You are a JSON-only evaluator. Return only valid JSON, no markdown code blocks, no extra text.", evalPrompt, 0.3);

          let parsed;
          try {
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              parsed = JSON.parse(jsonMatch[0]);
            } else {
              throw new Error("No JSON found");
            }
          } catch {
            parsed = {
              score: 6,
              feedback: "Good attempt. Try to be more structured and provide specific examples in your answers.",
              nextQuestion: isLastQuestion ? null : getNextQuestion(company, role, questionNumber),
            };
          }

          return NextResponse.json({
            score: Math.min(10, Math.max(1, parsed.score || 6)),
            feedback: parsed.feedback || "Good attempt. Keep practicing!",
            nextQuestion: isLastQuestion ? null : (parsed.nextQuestion || getNextQuestion(company, role, questionNumber)),
          });
        } catch (aiError) {
          console.warn("AI evaluation failed, using fallback:", aiError);
        }
      }

      // Fallback: evaluate locally with keyword scoring
      const result = evaluateLocally(company, role, question, answer, isLastQuestion);
      const nextQ = isLastQuestion ? null : getNextQuestion(company, role, questionNumber);
      return NextResponse.json({
        score: result.score,
        feedback: result.feedback,
        nextQuestion: nextQ,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Mock interview error:", error);
    return NextResponse.json({ error: error.message || "Interview failed" }, { status: 500 });
  }
}

// Local evaluation when AI is unavailable
function evaluateLocally(company: string, role: string, question: string, answer: string, isLast: boolean): { score: number; feedback: string } {
  const answerLength = answer.trim().length;
  const wordCount = answer.trim().split(/\s+/).length;

  // Basic scoring heuristics
  let score = 5;
  let feedback = "";

  // Length scoring
  if (wordCount > 100) score += 2;
  else if (wordCount > 50) score += 1;
  else if (wordCount < 15) score -= 2;

  // Structure scoring (mentions of examples, specific details)
  const hasExample = /example|instance|case|scenario|situation/i.test(answer);
  const hasTechTerms = /algorithm|complexity|database|api|function|class|interface|system/i.test(answer);
  const hasStructure = /first|second|finally|also|additionally|moreover/i.test(answer);
  const hasMetrics = /\d+%|\d+x|improved|increased|reduced|saved/i.test(answer);

  if (hasExample) score += 1;
  if (hasTechTerms) score += 1;
  if (hasStructure) score += 1;
  if (hasMetrics) score += 1;

  score = Math.min(10, Math.max(1, score));

  // Generate feedback
  const positives: string[] = [];
  const improvements: string[] = [];

  if (wordCount > 50) positives.push("Good detail in your answer");
  if (hasExample) positives.push("Nice use of examples");
  if (hasTechTerms) positives.push("Good technical depth");
  if (hasStructure) positives.push("Well-structured response");
  if (hasMetrics) positives.push("Great use of quantifiable results");

  if (wordCount < 30) improvements.push("Try to provide more detail and context");
  if (!hasExample) improvements.push("Include specific examples to strengthen your answer");
  if (!hasStructure) improvements.push("Consider using a structured format (STAR method)");
  if (!hasTechTerms && role !== "frontend") improvements.push("Mention relevant technical concepts");

  if (isLast) {
    feedback = `Interview complete! ${positives.join(". ") || "Good effort"}. ${improvements.length > 0 ? "To improve: " + improvements[0] + "." : "Keep it up!"} Overall, you showed ${score >= 7 ? "strong" : score >= 4 ? "decent" : "room for growth in"} communication skills.`;
  } else {
    feedback = `${positives.slice(0, 2).join(". ") || "Decent response"}. ${improvements.length > 0 ? "Tip: " + improvements[0] + "." : ""} (Score: ${score}/10)`;
  }

  return { score, feedback };
}

// Get the first question for a company
function getStartQuestion(company: string, role: string): string {
  const greetings: Record<string, string> = {
    "TCS": `Hello! Welcome to the TCS interview for the ${role} position. I'm glad you could make it today. Let's get started with a warm-up question:`,
    "Infosys": `Hi there! Welcome to Infosys. I'll be conducting your ${role} interview today. Let's begin:`,
    "Amazon": `Welcome to Amazon! I'm excited to talk with you about the ${role} role. At Amazon, we start with leadership principles. Let me begin:`,
    "Google": `Hi! Welcome to your Google interview for ${role}. I know you've been preparing hard, so let's dive right in:`,
  };

  const greeting = greetings[company] || `Hello! Welcome to the ${company} interview for ${role}. I'm happy to meet you today. Let's begin:`;
  const firstQ = getNextQuestion(company, role, 0);
  return `${greeting}\n\n${firstQ}`;
}

// Fallback questions in case AI fails
function getNextQuestion(company: string, role: string, questionNumber: number): string {
  const fallbackQuestions: Record<string, string[]> = {
    "TCS": [
      "Tell me about yourself and why you want to join TCS.",
      "What is the difference between array and linked list? When would you use each?",
      "Explain the concept of normalization in DBMS. What are its benefits?",
      "What are the pillars of Object-Oriented Programming? Explain with examples.",
      "Write a program to reverse a string without using built-in functions.",
    ],
    "Infosys": [
      "Tell me about yourself and your interest in Infosys.",
      "What is the difference between stack and queue? Give real-world examples.",
      "Explain normalization in DBMS. What is 3NF?",
      "Write a program to find the factorial of a number.",
      "What are the different types of joins in SQL? Explain with examples.",
    ],
    "Wipro": [
      "Introduce yourself and tell us why Wipro?",
      "What is the difference between C and C++?",
      "Explain the concept of pointers in C. Why are they important?",
      "What is a deadlock? How can it be prevented?",
      "Write a program to check if a number is a palindrome.",
    ],
    "HCL": [
      "Tell me about yourself and your technical background.",
      "What is the difference between process and thread?",
      "Explain the concept of virtual memory in operating systems.",
      "What is the OSI model? Name all 7 layers.",
      "Write a program to find the largest element in an array.",
    ],
    "Cognizant": [
      "Tell me about yourself and why Cognizant GenC?",
      "Explain the 4 pillars of OOPs with real-world examples.",
      "What is the difference between SQL and NoSQL databases?",
      "Explain the concept of RESTful APIs. How do they work?",
      "Write a program to find the second largest element in an array.",
    ],
    "Accenture": [
      "Tell me about yourself and why Accenture?",
      "Describe a time when you had to work under a tight deadline.",
      "What is cloud computing? Explain different service models (IaaS, PaaS, SaaS).",
      "How would you handle a disagreement with a team member?",
      "Explain the concept of microservices architecture.",
    ],
    "Amazon": [
      "Tell me about a time you went above and beyond for a customer.",
      "Describe a situation where you had to make a decision without complete information.",
      "How would you design a URL shortener like bit.ly?",
      "Tell me about a time you disagreed with a team decision.",
      "Explain the difference between BFS and DFS. When would you use each?",
    ],
    "Google": [
      "Given an array of integers, find two numbers that sum to a target. What's the optimal approach?",
      "Explain the concept of hash tables. How do you handle collisions?",
      "How would you design a system to handle millions of concurrent users?",
      "Tell me about a time you simplified a complex problem.",
      "What is the difference between TCP and UDP? When would you use each?",
    ],
    "Microsoft": [
      "Tell me about yourself and why Microsoft?",
      "Design a parking lot system. What classes and methods would you create?",
      "Given a binary tree, implement level-order traversal.",
      "Explain the difference between Process and Thread. How does multithreading work?",
      "Tell me about a time you showed leadership in a project.",
    ],
    "Flipkart": [
      "Tell me about yourself and why Flipkart?",
      "How would you design the product recommendation engine for Flipkart?",
      "Given a matrix, find the row with the maximum number of 1s.",
      "Explain the concept of dynamic programming with an example.",
      "How would you handle flash sales like Big Billion Days from a system design perspective?",
    ],
  };

  const questions = fallbackQuestions[company] || [
    "Tell me about yourself and why you're interested in this role.",
    "What are your strongest technical skills?",
    "Describe a challenging project you've worked on.",
    "How do you handle pressure and tight deadlines?",
    "Where do you see yourself in 5 years?",
  ];

  return questions[questionNumber % questions.length];
}
