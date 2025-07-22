const express = require('express')
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;
const dbUsers = require('./dbUsers.js'); // import users database
const bcrypt = require('bcrypt');
const session = require(`express-session`);

//TODO: add session handling
//TODO: add password requirements
//TODO: move hosting over to raspberry pi


// helper functions
function validPassword(password) {
    if (password === "") {
        return false;
    }

    return true;
}

function validUsername(username) {
    if (username === "") {
        return false;
    }

    return true;
}

// allow json parsing
app.use(express.json());

// Enable CORS for all routes
app.use(cors());

// Set up sessions
app.use(session({
  secret: 'a very secret string',  // change this to something secure!
  resave: false,
  saveUninitialized: false
}));

// post and gets

// this method does logging in and registering
app.post('/api/register', async (req, res) => {

    // encryption stuff
    const saltRounds = 10;

    // destructure request
    const {username, password} = req.body;
    console.log(username);

    // handle registration / login
    dbUsers.get(
        `SELECT * FROM users WHERE username = ?`,
        [username],
        (err, row) => {
            if (err) {
                console.error('DB error:', err.message);
                return;
            } else if (row) {
                // user exists try and login with given password
                console.log('Username exists');
                console.log('DB hashed password:', row.password);
                bcrypt.compare(password, row.password, (err, match) => {
                    // handle error
                    if (err) {
                        console.error('Error comparing passwords: ', err);
                        return res.status(500).json({error: 'Login error'});
                    }

                    // if match
                    if(match) {
                        console.log(`${username} succesfully logged in.`);
                        return res.json({message:"Succesful login", ok: true});
                        req.session.user = { username }; // save user info in session
                    } else {
                        console.log(`${username} unsuccesfully logged in.`);
                        return res.status(401).json({ message: 'Incorrect password', ok: false });
                    }
                });


            } else {
                // check valid password and username for registration
                
                if (!validPassword(password)) {
                    return res.status(401).json({ message: 'Invalid password, must be non-empty', ok: false});
                }
                
                if (!validUsername(username)) {
                    return res.status(401).json({ message: 'Invalid username, must be non-empty', ok: false});
                }



                // store user into table
                console.log('Username does not exist');
                // encrypt password
                bcrypt.hash(password, saltRounds, function(err, hash) {
                    if (err) {
                        console.error('Error hashing password:', err);
                    return;
                    }

                    console.log(hash);

                    // Store things in database now
                    dbUsers.run(`INSERT INTO users (username,password) VALUES (?,?)`,
                    [username,hash], (err) => {
                        if(err) {
                            console.error(err);
                            return;
                        }
                        return res.json({ message: 'User registered and logged in!', ok: true });
                    }

                    )
                });
            }
        }
    );
});

// check if user is logged in with this method
app.get('/api/profile', (req, res) => {
    if(req.session.user) {
        res.json({message: `Hello, ${req.session.username}`});
    } else {
        res.status(401).json({ message: 'Not logged in' });
    }
})


// logging out
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  console.log("Logged out!");
  return res.json({ message: "Logged out successfully" });
});

// verifies backend has started
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
