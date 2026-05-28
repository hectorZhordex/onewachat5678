import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profilesRouter from "./profiles";
import translationsRouter from "./translations";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profilesRouter);
router.use(translationsRouter);

export default router;
