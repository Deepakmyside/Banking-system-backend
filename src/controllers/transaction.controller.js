const transactionModel = require("../models/transaction.model")
const ledgerModel = require("../models/ledger.model")
const emailService = require("../services/email.service")
const accountModel = require("../models/account.model")
const mongoose = require("mongoose")
const { userLoginController } = require("./auth.controller")
/* Create a new transaction
THE 1--STEP TRANSFER FLOW:
* 1. Validate request
* 2. Validate idempotency Key
* 3. Check account status
* 4. Derives sender balance from ledger
* 5. Create transaction (PENDING)
* 6. Create DEBIT ledger entry 
* 7. create CREDIT ledger entry 
* 8. Mark transaction  COMPLETED
* 9. Commit MongoDB session 
* 10. Send email notification
 */


async function createTransaction(req, res) {

    
    // * 1. Validate request

    const{ fromAccount, toAccount, amount, idempotencyKey} = req.body

if(!fromAccount || !toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
         message: "FromAccount, toAccount, amount and idempotencyKey are required"
    })
}
const fromUserAccount = await accountModel.findOne({
    _id: fromAccount,
})

const toUserAccount = await accountModel.findOne({
    _id: toAccount
})

if (!fromUserAccount || !toUserAccount) {
    return res.status(400).json({
        message: "Invalid fromAccount or toAccount"
    })
}

//  * 2. Validate idempotency key

  const isTransactionAlreadyExists = await transactionModel.findOne({
    idempotencyKey: idempotencyKey
  })

  if (isTransactionAlreadyExists){
    if(isTransactionAlreadyExists.status === "COMPLETED"){
        return res.status(200).json({
            message:" Transaction already processed",
            transaction: isTransactionAlreadyExists
        })
    }
    if(isTransactionAlreadyExists.status === "PENDING"){
        return res.status(200).json({
            message:"Transaction is still processing"
        })
    }
    if(isTransactionAlreadyExists.status === "FAILED"){
         return res.status(500).json({
            message:" Transaction processsing failed, please retry"
        })
    }
    if(isTransactionAlreadyExists.status === "REVERSED"){
       return  res.status(500).json ({
            message: " Transaction was reversed, please retry"
        })
    }
  }

//  * 3. Check Account status

        if(fromUserAccount.status !=="ACTIVE" || toUserAccount.status !== "ACTIVE") {
           return res.status(400).json({
                message: "Both fromAccount and toAccount must be ACTIVE to process transaction"
            })
        }
  
//  * 4. Derive sender balance from ledger  
      const balance = await  fromUserAccount.getBalance()
      if(balance < amount) {
         return  res.status(400).json({
             message: 
             `Insufficient balance. Current balance is ${balance}. Requested amount is ${amount}.`
        })
      }
       let transaction;
    try {
    //   * 5. Create transaction(PENDING) 


    //  we using session startTransaction so that starting from point 5 to 6 to 7  to 8 if first 3 processes complete and any error came at marking trasaction COMPLETED  so half steps doesn't store in mongoose. with help of startTransaction session if any error came at 4th processs all first 3 processes will revert back 

    const session =await mongoose.startSession()
    session.startTransaction()

     transaction = (await transactionModel.create([{
        fromAccount,
        toAccount,
        amount,
        idempotencyKey,
        status:"PENDING"
    }], {session}) ) [ 0 ]

      const debitLedgerEntry = await ledgerModel.create([{
        account: fromAccount,
        amount: amount,
        transaction : transaction._id,
        type: "DEBIT"
       }], {session})

       await (()=> {
        return new Promise((resolve) => setTimeout(resolve, 10 * 1000));
       })()

    const creditLedgereEntry = await ledgerModel.create([{
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT"
    }] ,{session})

    await transactionModel.findOneAndUpdate(
      { _id: transaction._id},
      { status: "COMPLETED"},
      { session }
    )

    await session.commitTransaction()
    session.endSession()

} catch(error) {
    return res.status(400).json({
        message: "Transaction is pending due to some reason, please retry after sometime"
    })
}
    //  Send Email notification

    await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount)
    return res.status(201).json({
        message: "Transaction completed successfully",
        transaction: transaction
    })
} 

async function createInitialFundsTransaction( req, res) {
    const { toAccount, amount, idempotencyKey } = req.body
    
    console.log("Request body:", req.body)

    if(!toAccount || !amount || !idempotencyKey) {
       return res.status(400).json({
        message: "toAccount, amount and idempotencyKey are required "
       })
    }

    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
     })
     
     console.log("To user account:", toUserAccount)

     if(!toUserAccount){
        return res.status(400).json({
            message: " Invalid toAccount"
        })
     }

     const fromUserAccount = await accountModel.findOne({
       
        user: req.user._id
     })

     if(!fromUserAccount) {
        return res.status(400).json({
            message: "System user account not found"
        })
     }

     const session = await mongoose.startSession()
        session.startTransaction()

     const transaction = new transactionModel({
      fromAccount : fromUserAccount._id, toAccount, amount, idempotencyKey,
      status: "PENDING",
      },)


    const debitLedgerEntry = await ledgerModel.create([{
        account: fromUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT"
    }], { session })

    console.log("Debit ledger created:", debitLedgerEntry)

    const creditLedgerEntry = await ledgerModel.create([{
        account: toUserAccount._id,
        amount: amount,
        transaction : transaction._id,
        type: "CREDIT"
    }], { session })

    console.log("Credit ledger created:", creditLedgerEntry)

    transaction.status = ("COMPLETED")
    await transaction.save({session})

    await session.commitTransaction()
    session.endSession()
    
    
    
    return res.status(201).json({
        messsage: " Initial funds transaction completed successfully",
        transaction: transaction
    })


}


module.exports = { createTransaction, createInitialFundsTransaction}