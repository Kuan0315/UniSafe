import express from "express";
import { getContacts, addContact, updateContact, deleteContact } from "../controllers/emergencyController.js";

const router = express.Router();

router.get("/", getContacts);
router.post("/", addContact);    // teacher/admin only
router.put("/:id", updateContact); // teacher/admin only
router.delete("/:id", deleteContact); // teacher/admin only

export default router;
