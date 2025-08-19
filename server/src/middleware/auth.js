// This middleware checks if the user is authenticated before allowing access to protected routes.
// It expects the session to contain a user object with a username.
// If the user is not authenticated, it responds with a 401 status code and an error message.
// If authenticated, it attaches a compact user object to the request for use in route handlers.

function requireAuth(req, res, next) {
  try {
    if (!req.session || !req.session.user || !req.session.user.username) {
      console.log('Authentication failed: Invalid session', {
        hasSession: !!req.session,
        hasUser: !!(req.session && req.session.user),
        username: req.session?.user?.username
      });
      return res.status(401).json({ error: 'Please log in first' });
    }

    // Attach a compact user object for route handlers
    req.user = {
      id: req.session.user.id || req.session.user.username,
      username: req.session.user.username,
      name: req.session.user.name || '',
      avatar: req.session.user.avatar || ''
    };

    console.log('Authenticated user:', req.user.username);
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Authentication middleware failure' });
  }
}

module.exports = { requireAuth };
