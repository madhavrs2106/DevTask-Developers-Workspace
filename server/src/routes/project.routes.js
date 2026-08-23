import { Router } from "express";
import {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../controllers/project.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);
router.route("/").get(listProjects).post(createProject);
router.route("/:id").put(updateProject).delete(deleteProject);

export default router;
