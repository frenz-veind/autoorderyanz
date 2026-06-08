function isAuthenticated(req, res, next) {
  if (req.session && req.session.admin) {
    return next();
  }
  return res.redirect('/admin/login');
}

function isGuest(req, res, next) {
  if (req.session && req.session.admin) {
    return res.redirect('/admin/dashboard');
  }
  return next();
}

module.exports = { isAuthenticated, isGuest };
