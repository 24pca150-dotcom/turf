import jwt from "jsonwebtoken";

const verifyUserToken = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header) {
      // No token provided
      return res
        .status(401)
        .json({ message: "Unauthorized: No token provided" });
    }
    const token = header.split(" ")[1];
    if (!token) {
      // No token provided
      return res
        .status(401)
        .json({ message: "Unauthorized: No token provided" });
    }
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (verifyErr) {
      console.error("JWT verification failed:", verifyErr);
      return res.status(401).json({ message: `Invalid token: ${verifyErr.message}` });
    }
    if (!decoded) {
      return res.status(403).json({ message: "Forbidden: Invalid token payload" });
    }
    req.user = decoded;
    return next();
  } catch (err) {
    console.error("Error in verifyUserToken middleware:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default verifyUserToken;
