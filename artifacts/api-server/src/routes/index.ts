import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import subscribersRouter from "./subscribers";
import mechanicsRouter from "./mechanics";
import bookingsRouter from "./bookings";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(subscribersRouter);
router.use(mechanicsRouter);
router.use(bookingsRouter);
router.use(dashboardRouter);

export default router;
