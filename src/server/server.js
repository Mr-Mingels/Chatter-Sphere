require('dotenv').config();
const express = require('express')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt');
const session = require('express-session')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const User = require('./user')
const cors = require('cors');
const app = express()

const mongoDbUrl = process.env.MONGODB_URL
const PORT = process.env.PORT || 5000;
app.use(cors({ origin: 'http://localhost:3000' }));

const connectToMongoDb = async () => {
    try {
        await mongoose.connect(mongoDbUrl, { useNewUrlParser: true, useUnifiedTopology: true })   
        console.log('connected to MongoDB')
    } catch (err) {
        console.log(err)
    }
}

connectToMongoDb()

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'secret', resave: false, saveUninitialized: false}))
app.use(passport.initialize())
app.use(passport.session())

passport.use(new LocalStrategy(async(username, password, done) => {
    try {
        const user = await User.findOne({ username: username })
        if (!user) {
            return done(null, false, { message: "Incorrect username" })
        }
        bcrypt.compare(password, user.password, (err, res) => {
            if (err) {
                return done(err);
            }

            if (res) {
                // passwords match! log user in
                return done(null, user);
            } else {
                // passwords do not match!
                return done(null, false, { message: "Incorrect password" });
            }
        });
    } catch (err) {
        return done(err)
    }
}))

passport.serializeUser((user, done) => {
    done(null, user.id)
})

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id)
        done(null, user)
    } catch (err) {
        done(err)
    }
})

const ensureAuthentication = ((req, res, next) => {
    if (req.isAuthenticated()) {
        return next()
    }
    res.status(401).send('Unauthorized');
})


app.get('/', ensureAuthentication, (req, res) => {
    console.log('hello')
})

app.get('/sign-up', (req, res) => {
})


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
