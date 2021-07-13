const jwt = require("jsonwebtoken");

function issueJWT(user, secret_key) {
  const _id = user._id;

  const expiresIn = "1d";

  const payload = {
    sub: _id,
    iat: Date.now(),
  };

  const signedToken = jwt.sign(payload, secret_key, {
    expiresIn: expiresIn,
    algorithm: "HS256",
  });

  return {
    token: signedToken,
    expires: expiresIn,
  };
}

module.exports.issueJWT = issueJWT;
