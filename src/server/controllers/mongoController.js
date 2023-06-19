const mongoose = require('mongoose')

const mongoDbUrl = process.env.MONGODB_URL
console.log(mongoDbUrl)

const connectToMongoDb = async () => {
    try {
        await mongoose.connect(mongoDbUrl, { useNewUrlParser: true, useUnifiedTopology: true })   
        console.log('connected to MongoDB')
        console.log('Current database:', mongoose.connection.db.databaseName);
    } catch (err) {
        console.log(err)
    }
}

module.exports = connectToMongoDb;