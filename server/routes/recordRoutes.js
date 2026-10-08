const express = require("express");
const { getRecords, getRecord, createRecord, updateRecord, deleteRecord } = require("../controllers/recordController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.route("/")
    .get(getRecords)
    .post(createRecord);

router.route("/:id")
    .get(getRecord)
    .put(updateRecord)
    .delete(deleteRecord);

module.exports = router;
