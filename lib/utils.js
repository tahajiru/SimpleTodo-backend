const jwt = require("jsonwebtoken");

function issueJWT(user) {
  const _id = user._id;

  const expiresIn = "1d";

  const payload = {
    sub: _id,
    iat: Date.now(),
  };

  const signedToken = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
    expiresIn: expiresIn,
    algorithm: "HS256",
  });

  return {
    token: signedToken,
    expires: expiresIn,
  };
}

module.exports.issueJWT = issueJWT;
