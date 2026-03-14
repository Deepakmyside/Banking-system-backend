const express = require("express")
const authController = require("../controllers/auth.controller")

const router = express.Router()
console.log("Auth routes loaded")
/*Post /api/auth/register */
router.post("/register", authController.userRegisterController)
    
/*Post /api/auth/login*/
router.post("/login", authController.userLoginController )
console.log("login route hit");
module.exports = router 

//  POST /api/auth/logout 

router.post("/logout", authController.userLogoutController)