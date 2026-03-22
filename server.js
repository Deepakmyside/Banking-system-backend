require("dotenv").config()
const app = require("./src/app")
const connectToDB = require("./src/config/db")

const PORT = process.env.PORT || 3000

const startServer = async () => {
  try {
    await connectToDB()
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  } catch (error) {
    console.log("DB connection failed:", error)
  }
}

startServer()