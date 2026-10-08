const express = require("express");
const {
    getReminder,
    getReminders,
    createReminder,
    updateReminder,
    toggleReminder,
    deleteReminder
} = require("../controllers/reminderController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.route("/")
    .get(getReminders)
    .post(createReminder);

router.patch("/:id/toggle", toggleReminder);

router.route("/:id")
    .get(getReminder)
    .put(updateReminder)
    .delete(deleteReminder);

module.exports = router;
