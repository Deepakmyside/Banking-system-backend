const mongoose = require("mongoose")

const tokenBlacklistSchema = new mongoose.Schema({
    token : {
        type: String,
        required: [true, "Token is required to blacklist token"],
        unique: [true, "Token is already blackisted"]
    },
    blacklistedAt: {
        type: Date,
        default: Date.now,
        immmutable: true
    }
}, {
    timstamps: true
})

tokenBlacklistSchema.index({ createdAt: 1 }, {
    expireAfterSeconds: 60 * 60 * 24 * 3 // 3 Days
})

const tokenBlackListModel = mongoose.model("tokenBlacklist", tokenBlacklistSchema)

module.exports = tokenBlackListModel;