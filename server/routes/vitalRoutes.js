const express = require("express");
const { getVitals, createVital, deleteVital } = require("../controllers/vitalController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect); // protect all vitals routes

router.route("/")
    .get(getVitals)
    .post(createVital);

router.route("/:id")
    .delete(deleteVital);

module.exports = router;
