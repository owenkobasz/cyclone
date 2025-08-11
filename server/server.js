const express = require('express')
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;
const dbUsers = require('./dbUsers.js'); // import users database
const bcrypt = require('bcrypt');
const session = require(`express-session`);
const SQLiteStore = require('connect-sqlite3')(session);


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

// Enable CORS for all routes
app.use(cors({
    origin: 'http://localhost:5173',  // frontend origin
    credentials: true                // allow cookies to be sent
}));

// allow json parsing
app.use(express.json());

// Set up sessions
app.use(session({
  store: new SQLiteStore({
    db: 'sessions.db', // default, you can customize the name
    dir: './databases'      // optional: where to store the session DB file
  }),
  secret: 'cycloneisagreatapplicationandeveryonelovesitsomuch',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    secure: false,    // true if using HTTPS
    httpOnly: true,   // prevents JS access
    sameSite: 'lax'   // CSRF protection
  }
}));

// post and gets

// this method does logging in and registering
app.post('/api/login', async (req, res) => {

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
                return res.status(500).json({message: 'Error with logging in to account', ok: false});;
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
                        req.session.user = { username }; // save user info in session
    
                        req.session.save(err => {
                            if (err) {
                                console.error('Session save error:', err);
                                return res.status(500).json({ error: 'Could not save session' });
                            }
                            return res.json({ message: "Succesful login", ok: true });
                        });
                        return res.json({message:"Succesful login", ok: true});
                        
                    } else {
                        console.log(`${username} unsuccesfully logged in.`);
                        return res.status(401).json({ message: 'Incorrect password', ok: false });
                    }
                });


            } else if (!row){
                // tell user to register
                console.log("Go register punk");
                return res.status(404).json({ message: "User not found, please register", ok: false });
            }
        }
    );
});

// registration function
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
                return res.status(500).json({ message: 'Error in creating account', ok: false });;
            } else if (row) {
                // user exists try and login with given password
                return res.status(401).json({ message: 'Username already exists!', ok: false});;

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
                        return res.status(500).json({ message: 'Error in creating account', ok: false });
                    }

                    console.log(hash);

                    // Store things in database now
                    dbUsers.run(`INSERT INTO users (username,password) VALUES (?,?)`,
                    [username,hash], (err) => {
                        if(err) {
                            console.error(err);
                            return res.status(500).json({ message: 'Database issue preventing registration', ok: false });
                        }

                        // let user know they have succesfully registered
                        return res.json({
                            message: 'User registered successfully! Please log in.',
                            ok: true
                        });
                    }

                    )
                });
            }
        }
    );
});


// check if user is logged in with this method
app.get('/api/status', (req, res) => {
  console.log('Session user:', req.session.user);
  if (req.session.user) {
    res.json({ loggedIn: true, username: req.session.user.username });
  } else {
    res.json({ loggedIn: false });
  }
});

// logging out
app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).json({ message: 'Logout failed' });
    }

    res.clearCookie('connect.sid'); // Clear the session cookie on client

    console.log("Logged out!");
    return res.json({ message: "Logged out successfully" });
  });
});

// verifies backend has started
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
