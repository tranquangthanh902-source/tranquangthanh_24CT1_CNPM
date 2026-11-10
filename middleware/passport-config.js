const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('../database/init');
const bcrypt = require('bcrypt');

// Only configure Google OAuth if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.APP_URL || 'http://localhost:3000'}/auth/google/callback`
  }, (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user exists
    let user = db.prepare('SELECT * FROM users WHERE email=?').get(profile.emails[0].value);

    if (!user) {
      // Create new user with Google OAuth info
      const username = profile.emails[0].value.split('@')[0] + '_' + Date.now();
      db.prepare(`
        INSERT INTO users(username, password_hash, full_name, email, role)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        username,
        bcrypt.hashSync('google_oauth_' + profile.id, 10),
        profile.displayName || profile.name.givenName + ' ' + profile.name.familyName,
        profile.emails[0].value,
        'user'
      );
      user = db.prepare('SELECT * FROM users WHERE email=?').get(profile.emails[0].value);
    }

    return done(null, user);
  } catch (err) {
    return done(err);
  }
  }));
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
