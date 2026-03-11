const mongoose = require("mongoose")


const accountSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required:[true, "Account must be associated with a user"],
    index: true
    },

    status:{
        type:String,
        enum: {
            values: ["ACTIVE", "FROZEN", "CLOSED"],
            message: "Status can be either ACTIVE, FROZEN OR CLOSED",
        },
        default:"ACTIVE"
    },
    currency: {
        type: String,
        required: [true, "Currency is reuired for creating account"],
        default: "INR"
    }
},{
    timestamps: true 
})

accountSchema.index({ user:  1, status: 1})

const accountModel = mongoose.model("account", accountSchema)
module.exports = accountModel