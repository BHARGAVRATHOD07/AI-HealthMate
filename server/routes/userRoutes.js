const express = require("express");
const { protect } = require("../middleware/authMiddleware");

const {
    getUsers,
    createUser
} = require("../controllers/userController");

const router = express.Router();

router.use(protect);
router.get("/", getUsers);
router.post("/", createUser);

module.exports = router;