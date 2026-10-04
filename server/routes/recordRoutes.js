const express = require("express");
const { getRecords, createRecord, deleteRecord } = require("../controllers/recordController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.route("/")
    .get(getRecords)
    .post(createRecord);

router.route("/:id")
    .delete(deleteRecord);

module.exports = router;
