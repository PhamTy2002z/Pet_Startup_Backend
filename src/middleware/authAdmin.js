// Authorization: Bearer <JWT>
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) return res.status(401).json({ message: 'No token' });

  const token = authorization.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    req.admin = payload;          // { id, role, iat, exp }
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
