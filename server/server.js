require('dotenv').config({ path: '../.env' });
const express = require('express')
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { generateRoute } = require('./apiRouterMain.js');
const { getLocationFromIP, getClientIP } = require('./utils/geolocation.js');
const app = express();
const port = 3000;
const dbUsers = require('./dbUsers.js'); // import users database
const bcrypt = require('bcrypt');
const session = require(`express-session`);
const routes = require('./routes/routes');
const SQLiteStore = require('connect-sqlite3')(session);
const profileRoutes = require('./routes/routes');

// fix to work with Mandy's changesv cf cv

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
  origin: true,  // works with docker
  credentials: true
}));

// allow json parsing
app.use(express.json());

// Set up sessions
app.use(session({
  store: new SQLiteStore({
    db: 'sessions.db', 
    dir: './databases'     
  }),
  secret: 'cycloneisagreatapplicationandeveryonelovesitsomuch',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    secure: false,    
    httpOnly: true,   
    sameSite: 'lax'   
  }
}));

// post and gets
app.use('/api', routes);

// this method does logging in
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
                            return res.json({ message: "Succesful login", ok: true, username: username });
                        });
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
    const {username, password, passwordConf, firstName, lastName} = req.body;
    console.log(`{username}`);

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

                if (password != passwordConf) {
                    return res.status(401).json({ message: 'Password and confirmation must match.', ok: false});
                }

                if (!validUsername(firstName)) {
                    return res.status(401).json({ message: 'Invalid first name, must be non-empty', ok: false});
                }

                if (!validUsername(lastName)) {
                    return res.status(401).json({ message: 'Invalid last name, must be non-empty', ok: false});
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
                    dbUsers.run(`INSERT INTO users (username,password, firstname, lastname) VALUES (?,?,?,?)`,
                    [username,hash, firstName, lastName], (err) => {
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
      return res.status(500).json({ok: false, message: 'Logout failed' });
    }
    res.clearCookie('connect.sid'); // Clear the session cookie on client
    console.log("Logged out!");
    return res.json({ ok: true, message: "Logged out successfully" });
  });
});

// useful functions for grabbing data from users database
function getUserById(id, callback) {
  dbUsers.get(
    "SELECT username, firstname, lastname FROM users WHERE id = ?",
    [id],
    (err, row) => {
      if (err) {
        console.error("Database error:", err);
        return callback(err);
      }
      callback(null, row); // row will be undefined if no user found
    }
  );
}

function getUserByUsername(username, callback) {
  dbUsers.get(
    "SELECT username, firstname, lastname FROM users WHERE username = ?",
    [username],
    (err, row) => {
      if (err) {
        console.error("Database error:", err);
        return callback(err);
      }
      callback(null, row);
    }
  );
}

// Get user location based on IP
app.get('/api/location', async (req, res) => {
  try {
    const clientIP = getClientIP(req);
    const locationData = await getLocationFromIP(clientIP);
    
    console.log(`Location request from IP ${clientIP}: ${locationData.city}, ${locationData.region}`);
    
    res.json({
      success: true,
      location: locationData,
      ip: clientIP
    });
  } catch (error) {
    console.error('Error getting user location:', error);
    res.status(500).json({ 
      success: false,
      error: "Failed to get location",
      location: {
        lat: 39.9526,
        lon: -75.1652,
        city: 'Philadelphia',
        region: 'Pennsylvania',
        country: 'US',
        place: 'Philadelphia, Pennsylvania, USA'
      }
    });
  }
});

// Route generation endpoint
app.post('/api/generate-custom-route', async (req, res) => {
  const {
    start_lat,
    start_lon,
    end_lat,
    end_lon,
    destination_name,
    starting_point_name,
    avoid_hills = false,
    use_bike_lanes = true,
    target_distance = 5.0,
    max_elevation_gain = 100.0,
    unit_system = "imperial",
    route_type = "scenic",
    avoid_traffic = false,
    elevation_focus = false
  } = req.body;

  console.log('Route generation request received:', {
    destination_name,
    starting_point_name,
    start_lat,
    start_lon,
    end_lat,
    end_lon,
    route_type,
    target_distance,
    use_bike_lanes,
    avoid_hills,
    avoid_traffic,
    elevation_focus,
    unit_system
  });

  // Validate required parameters
  if (!start_lat || !start_lon) {
    return res.status(422).json({ 
      detail: [
        { type: "missing", loc: ["body", "start_lat"], msg: "Field required" },
        { type: "missing", loc: ["body", "start_lon"], msg: "Field required" }
      ]
    });
  }

  try {
    // Get user's location based on IP for OSM graph selection
    const clientIP = getClientIP(req);
    const locationData = await getLocationFromIP(clientIP);
    
    console.log(`Generating route for user from ${locationData.city}, ${locationData.region} (IP: ${clientIP})`);

    const routeData = await generateRoute({
      start: {
        lat: parseFloat(start_lat),
        lon: parseFloat(start_lon)
      },
      end: end_lat && end_lon ? {
        lat: parseFloat(end_lat),
        lon: parseFloat(end_lon)
      } : null,
      options: {
        target_distance: parseFloat(target_distance),
        route_type,
        use_bike_lanes,
        avoid_hills,
        avoid_traffic,
        elevation_focus,
        unit_system,
        max_elevation_gain,
        destination_name,
        starting_point_name
      },
      userLocation: locationData  // Pass location data to route generation
    });

    console.log('Route data being sent to frontend:', {
      difficulty: routeData.difficulty,
      total_elevation_gain: routeData.total_elevation_gain,
      total_ride_time: routeData.total_ride_time,
      total_length_formatted: routeData.total_length_formatted,
      data_source: routeData.data_source,
      route_coordinates_count: routeData.route ? routeData.route.length : 0
    });

    res.json(routeData);
  } catch (error) {
    console.error('Route generation error:', error);
    res.status(500).json({ 
      detail: "Route generation failed: " + error.message 
    });
  }
});

app.use('/api', profileRoutes);

// verifies backend has started
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
