import { Router } from "express";
import {
  listTasks,
  createTask,
  updateTask,
  reorderTasks,
  deleteTask,
} from "../controllers/task.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);
router.patch("/reorder", reorderTasks);
router.route("/").get(listTasks).post(createTask);
router.route("/:id").put(updateTask).delete(deleteTask);

export default router;
