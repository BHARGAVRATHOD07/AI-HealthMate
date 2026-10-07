const express = require("express");
const { getMedications, createMedication, updateMedication, setMedicationTaken, deleteMedication } = require("../controllers/medicationController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.route("/")
    .get(getMedications)
    .post(createMedication);

router.route("/:id")
    .put(updateMedication)
    .delete(deleteMedication);

router.patch("/:id/taken", setMedicationTaken);

module.exports = router;
