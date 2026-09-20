import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storyRouter from "./story";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storyRouter);

export default router;
