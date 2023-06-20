const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const Chat = require('../models/chat');
const { ensureAuthentication } = require('../controllers/authController');

router.get('/', ensureAuthentication, (req, res) => {
    res.json(req.user)
})

router.post('/sign-up', async (req, res) => {
    try {
        const password = req.body.password
        const username = req.body.username.toUpperCase();
        const email = req.body.email.toUpperCase();
        const userByEmail = await User.findOne({ email: email });
        const userByUsername = await User.findOne({ username: username });

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
            await Chat.updateOne({ _id: '648eeb75f2371f976c3448cc' }, { $push: { members: user._id } });
            return res.status(200).send({ message: 'Created new User' })
        })
    } catch (err) {
        console.log(err);
        res.status(500).send({ message: 'Server error' });
    }
})

router.post('/log-in', async (req, res, next) => {
    const password = req.body.password
    const username = req.body.username.toUpperCase();
    const email = req.body.email.toUpperCase();
    const userByEmail = await User.findOne({ email: email });
    const userByUsername = await User.findOne({ username: username });

    if (!req.body.email || !req.body.username || !password) {
        return res.status(400).send({ message: "All fields are required" });
      } else if (!userByEmail && !userByUsername) {
        return res.status(400).send({ message: "Email and Username are incorrect" });
      } else if (!userByEmail) {
        return res.status(400).send({ message: 'Email is incorrect' });
      } else if (!userByUsername) {
        return res.status(400).send({ message: 'Username is incorrect' });
      }
    
    passport.authenticate("local", (err, user, info) => {
        if (err) { 
            console.error(`Error: ${err}`);
            return res.status(500).send({ message: `Error: ${err}` });
        }
        if (!user) { 
            console.log('Log in Error:', info)
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

router.get('/log-out', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err)
        }
        return res.status(200).send({ message: 'Successfully logged out!' })
    })
})

module.exports = router;