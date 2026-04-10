import { Router, type IRouter } from "express";
import { eq, and, avg, max, desc } from "drizzle-orm";
import { db, resumesTable } from "@workspace/db";
import { CreateResumeBody, GetResumeParams, DeleteResumeParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function formatResume(resume: typeof resumesTable.$inferSelect) {
  return {
    id: resume.id,
    userId: resume.userId,
    title: resume.title,
    content: resume.content,
    overallScore: resume.overallScore,
    atsScore: resume.atsScore,
    jobRole: resume.jobRole,
    createdAt: resume.createdAt.toISOString(),
    updatedAt: resume.updatedAt.toISOString(),
  };
}

router.get("/resumes", requireAuth, async (req, res): Promise<void> => {
  const resumes = await db
    .select()
    .from(resumesTable)
    .where(eq(resumesTable.userId, req.userId!))
    .orderBy(desc(resumesTable.createdAt));

  res.json(resumes.map(formatResume));
});

router.post("/resumes", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateResumeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [resume] = await db
    .insert(resumesTable)
    .values({
      userId: req.userId!,
      title: parsed.data.title,
      content: parsed.data.content,
      jobRole: parsed.data.jobRole ?? null,
    })
    .returning();

  res.status(201).json(formatResume(resume));
});

router.get("/resumes/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetResumeParams.safeParse({ id: parseInt(raw, 10) });
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

  res.json(formatResume(resume));
});

router.delete("/resumes/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteResumeParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid resume ID" });
    return;
  }

  const [deleted] = await db
    .delete(resumesTable)
    .where(and(eq(resumesTable.id, params.data.id), eq(resumesTable.userId, req.userId!)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Resume not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/dashboard/stats", requireAuth, async (req, res): Promise<void> => {
  const userResumes = await db
    .select()
    .from(resumesTable)
    .where(eq(resumesTable.userId, req.userId!))
    .orderBy(desc(resumesTable.createdAt));

  const totalResumes = userResumes.length;
  const scoredResumes = userResumes.filter((r) => r.overallScore !== null);
  const averageScore =
    scoredResumes.length > 0
      ? scoredResumes.reduce((sum, r) => sum + (r.overallScore ?? 0), 0) / scoredResumes.length
      : null;
  const bestScore =
    scoredResumes.length > 0
      ? Math.max(...scoredResumes.map((r) => r.overallScore ?? 0))
      : null;

  res.json({
    totalResumes,
    averageScore: averageScore !== null ? Math.round(averageScore * 10) / 10 : null,
    bestScore,
    recentActivity: userResumes.slice(0, 5).map((r) => ({
      id: r.id,
      userId: r.userId,
      title: r.title,
      content: r.content,
      overallScore: r.overallScore,
      atsScore: r.atsScore,
      jobRole: r.jobRole,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
  });
});

export default router;
