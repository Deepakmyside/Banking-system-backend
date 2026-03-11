const express = require("express")
const authMiddleware = require("../middleware/auth.middleware"
)
const acccountController = require("../controllers/account.controller")

const router = express.Router();


// POST  /api/accounts/
// - Create a new account
// - Protected route 

router.post("/", authMiddleware.authMiddleware, acccountController.createAccountController)

module.exports = router