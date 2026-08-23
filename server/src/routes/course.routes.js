import { Router } from "express";
import {
  listCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} from "../controllers/course.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);
router.route("/").get(listCourses).post(createCourse);
router.route("/:id").put(updateCourse).delete(deleteCourse);

export default router;
