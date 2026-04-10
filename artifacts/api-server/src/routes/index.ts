import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import resumesRouter from "./resumes";
import analysisRouter from "./analysis";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(resumesRouter);
router.use(analysisRouter);

export default router;
