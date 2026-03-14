const { Router } = require("express");
const authMiddleware = require("../middleware/auth.middleware")
const transactionController = require("../controllers/transaction.controller")
const transactionRoutes = Router();

//  POST /api/transactions/
//  Create a new transaction
transactionRoutes.post("/", authMiddleware.authMiddleware, transactionController.createTransaction)

// POST /api/transaction/system/intial-funds
//  Create initial funds transaction from system user
transactionRoutes.post("/system/intial-funds", authMiddleware.authSystemUserMiddleware, transactionController.createInitialFundsTransaction)

module.exports = transactionRoutes; 