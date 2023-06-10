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
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

const connectToMongoDb = async () => {
    try {
        await mongoose.connect(mongoDbUrl, { useNewUrlParser: true, useUnifiedTopology: true })   
        console.log('connected to MongoDB')
        console.log('Current database:', mongoose.connection.db.databaseName);
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

passport.use(new LocalStrategy({ usernameField: 'username', passReqToCallback: true }, async(req, username, password, done) => {
    try {
        const email = req.body.email; // Get the email from the request
        const userByUsername = await User.findOne({ username: username }); // Look for a user with the username
        const userByEmail = await User.findOne({ email: email }); // Look for a user with the email
        
        if (!userByEmail && !userByUsername) {
            return done(null, false, { message: "Incorrect email and username" });
        }

        if (!userByEmail) {
            return done(null, false, { message: "Incorrect email" });
        }

        if (!userByUsername) {
            return done(null, false, { message: "Incorrect username" });
        }

        if (userByEmail.id !== userByUsername.id) {
            return done(null, false, { message: "Email and username do not match the same user" });
        }

        bcrypt.compare(password, userByEmail.password, (err, res) => {
            if (err) {
                return done(err);
            }

            if (res) {
                // passwords match! log user in
                return done(null, userByEmail);
            } else {
                // passwords do not match!
                return done(null, false, { message: "Incorrect password" });
            }
        });
    } catch (err) {
        return done(err);
    }
}));



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

app.post('/sign-up', async (req, res) => {
    try {
        console.log('triggered sign up')
        const password = req.body.password
        const username = req.body.username.toUpperCase();
        const email = req.body.email.toUpperCase();
        console.log(username)
        console.log(email)
        const userByEmail = await User.findOne({ email: email });
        const userByUsername = await User.findOne({ username: username });
        console.log(userByEmail)
        console.log(userByUsername)

        if (userByEmail && userByUsername) {
            return res.status(400).send({ message: "Email and Username have already been taken" });
        }
        
        if (!req.body.email || !req.body.username || !password) {
            return res.status(400).send({ message: "All fields are required" });
        } else if (userByEmail) {
            return res.status(400).send({ message: 'Email has already been taken'})
        } else if (userByUsername) {
            return res.status(400).send({ message: 'Username has already been taken'})
        }
        
        bcrypt.hash(password, 10, async (err, hashedPassword) => {
            if (err) console.log(err)
            const user = new User({
                email: email,
                username: username,
                password: hashedPassword,
            })
            await user.save()
            return res.status(200).send({ message: 'Created new User' })
        })
    } catch (err) {
        console.log(err)
    }
})

app.post('/log-in', (req, res, next) => {
    console.log('triggered log in');
    passport.authenticate("local", (err, user, info) => {
        if (err) { 
            console.error(`Error: ${err}`);
            return res.status(500).send({ message: `Error: ${err}` });
        }
        if (!user) { 
            console.log(info)
            return res.status(401).send({ message: `${info.message}` });
        }
        req.logIn(user, function(err) {
            if (err) { 
                console.error(`Error: ${err}`);
                return res.status(500).send({ message: `Error: ${err}` });
            }
            return res.status(200).send({ message: "Authentication succeeded", user });
        });
    })(req, res, next);
});



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
