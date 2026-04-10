import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, resumesTable } from "@workspace/db";
import { AnalyzeResumeParams, AnalyzeResumeBody, EnhanceResumeParams, GetInterviewQuestionsParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { openai } from "@workspace/integrations-openai-ai-server";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/resumes/:id/analyze", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = AnalyzeResumeParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid resume ID" });
    return;
  }

  const bodyParsed = AnalyzeResumeBody.safeParse(req.body);
  const jobRole = bodyParsed.success ? bodyParsed.data.jobRole : undefined;
  const jobDescription = bodyParsed.success ? bodyParsed.data.jobDescription : undefined;

  const [resume] = await db
    .select()
    .from(resumesTable)
    .where(and(eq(resumesTable.id, params.data.id), eq(resumesTable.userId, req.userId!)));

  if (!resume) {
    res.status(404).json({ error: "Resume not found" });
    return;
  }

  const targetRole = jobRole || resume.jobRole || "Software Engineer";

  const prompt = `You are an expert resume analyst and career coach. Analyze this resume thoroughly and provide detailed, actionable insights.

RESUME CONTENT:
${resume.content}

TARGET ROLE: ${targetRole}
${jobDescription ? `JOB DESCRIPTION: ${jobDescription}` : ""}

Analyze the resume and return a JSON object with EXACTLY this structure (no additional keys):
{
  "overallScore": <integer 0-100, comprehensive resume quality>,
  "atsScore": <integer 0-100, ATS/keyword compatibility>,
  "toneScore": <integer 0-100, professional tone quality>,
  "clarityScore": <integer 0-100, clarity and readability>,
  "impactScore": <integer 0-100, impact of achievements/results>,
  "detectedSkills": [
    {"name": "<skill name>", "level": "<Beginner|Intermediate|Expert>", "category": "<Technical|Soft|Domain>"}
  ],
  "missingSkills": [
    {"name": "<skill name>", "importance": "<Critical|High|Medium>", "reason": "<why it matters for this role>"}
  ],
  "careerPaths": [
    {"role": "<job title>", "match": <integer 0-100>, "description": "<why this role suits the candidate>"}
  ],
  "strengths": ["<specific strength>"],
  "weaknesses": ["<specific weakness>"],
  "summary": "<2-3 paragraph professional assessment of this resume>",
  "jobRoleMatch": <integer 0-100, how well resume matches target role>,
  "toneAnalysis": "<detailed analysis of the resume's tone, language style, and professionalism>"
}

Be specific and realistic. Include 5-10 detected skills, 3-5 missing skills, 3 career paths, 4-6 strengths, 4-6 weaknesses. Return ONLY valid JSON, no markdown.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_completion_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    const analysis = JSON.parse(content);

    await db
      .update(resumesTable)
      .set({
        overallScore: analysis.overallScore,
        atsScore: analysis.atsScore,
        jobRole: targetRole,
      })
      .where(eq(resumesTable.id, resume.id));

    res.json({
      resumeId: resume.id,
      ...analysis,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to analyze resume");
    res.status(500).json({ error: "Analysis failed. Please try again." });
  }
});

router.post("/resumes/:id/enhance", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = EnhanceResumeParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid resume ID" });
    return;
  }

  const [resume] = await db
    .select()
    .from(resumesTable)
    .where(and(eq(resumesTable.id, params.data.id), eq(resumesTable.userId, req.userId!)));

  if (!resume) {
    res.status(404).json({ error: "Resume not found" });
    return;
  }

  const prompt = `You are an expert resume writer and career coach. Review this resume and provide detailed enhancement suggestions.

RESUME CONTENT:
${resume.content}

${resume.jobRole ? `TARGET ROLE: ${resume.jobRole}` : ""}

Return a JSON object with EXACTLY this structure (no additional keys):
{
  "enhancements": [
    {
      "section": "<section name e.g. Summary, Experience, Skills, Education>",
      "issue": "<specific problem found>",
      "suggestion": "<detailed how to fix it>",
      "priority": "<Critical|High|Medium|Low>",
      "originalText": "<exact text from resume with the issue, or null>",
      "improvedText": "<rewritten version of that text, or null>"
    }
  ],
  "rewrittenSummary": "<completely rewritten professional summary optimized for the target role>",
  "keywordsToAdd": ["<keyword1>", "<keyword2>"],
  "formattingTips": ["<specific formatting improvement>"]
}

Include 6-10 enhancement items covering different sections. Be specific and actionable. Provide real before/after text examples. Return ONLY valid JSON, no markdown.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_completion_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    const enhancement = JSON.parse(content);

    res.json({
      resumeId: resume.id,
      ...enhancement,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to enhance resume");
    res.status(500).json({ error: "Enhancement failed. Please try again." });
  }
});

router.get("/resumes/:id/interview-questions", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetInterviewQuestionsParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid resume ID" });
    return;
  }

  const [resume] = await db
    .select()
    .from(resumesTable)
    .where(and(eq(resumesTable.id, params.data.id), eq(resumesTable.userId, req.userId!)));

  if (!resume) {
    res.status(404).json({ error: "Resume not found" });
    return;
  }

  const prompt = `You are an expert interviewer. Based on this resume, generate realistic and challenging interview questions that a hiring manager would ask.

RESUME CONTENT:
${resume.content}

${resume.jobRole ? `TARGET ROLE: ${resume.jobRole}` : ""}

Return a JSON object with EXACTLY this structure:
{
  "questions": [
    {
      "question": "<interview question>",
      "category": "<Technical|Behavioral|Situational|Culture Fit>",
      "difficulty": "<Easy|Medium|Hard>",
      "tip": "<specific advice on how to answer this question well>"
    }
  ]
}

Generate 12-15 questions covering all categories. Make questions specific to the candidate's background and target role. Return ONLY valid JSON, no markdown.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_completion_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    const result = JSON.parse(content);

    res.json({
      resumeId: resume.id,
      ...result,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to generate interview questions");
    res.status(500).json({ error: "Question generation failed. Please try again." });
  }
});

export default router;
