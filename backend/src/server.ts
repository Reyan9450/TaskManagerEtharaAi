// dotenv.config() must be called before importing app so that all
// environment variables are available when the module is first loaded.
import dotenv from 'dotenv'
dotenv.config()

import mongoose from 'mongoose'
import app from './app'

const PORT = process.env.PORT || 5000
const MONGO_URI = process.env.MONGO_URI

if (!MONGO_URI) {
  console.error('MONGO_URI environment variable is not set. Exiting.')
  process.exit(1)
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB')
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
  .catch((err: Error) => {
    console.error('Failed to connect to MongoDB:', err.message)
    process.exit(1)
  })
