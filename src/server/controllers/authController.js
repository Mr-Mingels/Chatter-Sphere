const bcrypt = require('bcryptjs');
const User = require('../models/user');
const LocalStrategy = require('passport-local').Strategy;
const passport = require('passport');

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

module.exports = {
    localStrategy: passport.initialize(),
    session: passport.session()
}
