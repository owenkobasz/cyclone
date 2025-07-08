const express = require('express')
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;
const dbUsers = require('./dbUsers.js'); // import users database
const bcrypt = require('bcrypt');

// allow json parsing
app.use(express.json());

// Enable CORS for all routes
app.use(cors());

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
                    } else {
                        console.log(`${username} unsuccesfully logged in.`);
                        return res.status(401).json({ message: 'Incorrect password', ok: false });
                    }
                });


            } else {
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



// verifies backend has started
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
