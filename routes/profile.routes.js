import {Router} from "express"
import {protect} from "../middlewares/authMiddleware.js";
import {getProfile, updateProfile} from "../controllers/profile.controller.js";

const profileRouter = Router();

profileRouter.get("/", protect, getProfile);
profileRouter.post("/", protect, updateProfile);

export default profileRouter;