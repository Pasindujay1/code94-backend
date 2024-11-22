// // FILE: middleware/auth.js
// import jwt from "jsonwebtoken";
// import User from "../models/User.js";

// const authenticateToken = (req, res, next) => {
//   const authHeader = req.headers.authorization;

//   if (authHeader) {
//     const token = authHeader.split(" ")[1]; // Remove "Bearer" word

//     // Verify the token
//     jwt.verify(token, process.env.JWT_SECRET, async (err, payload) => {
//       if (err) {
//         return res.status(401).json({ error: "Unauthorized!" });
//       }

//       try {
//         // Find user
//         const user = await User.findOne({ _id: payload._id }).select("-password"); // Remove password
//         // Attach the user to the req.user
//         req.user = user;
//         next();
//       } catch (error) {
//         console.log(error);
//         return res.status(500).json({ error: error.message });
//       }
//     });
//   } else {
//     return res.status(403).json({ error: "Forbidden" });
//   }
// };

// export default authenticateToken;
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1]; // Remove "Bearer" word

    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, async (err, payload) => {
      if (err) {
        return res.status(401).json({ error: "Unauthorized!" });
      }

      try {
        // Find user
        const user = await User.findOne({ _id: payload._id }).select("-password"); // Remove password
        // Attach the user to the req.user
        req.user = user;
        next();
      } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
      }
    });
  } else {
    return res.status(403).json({ error: "Forbidden" });
  }
};

export default authenticateToken;