const express = require("express");
const { getReminders, createReminder, toggleReminder, deleteReminder } = require("../controllers/reminderController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.route("/")
    .get(getReminders)
    .post(createReminder);

router.patch("/:id/toggle", toggleReminder);

router.route("/:id")
    .delete(deleteReminder);

module.exports = router;
