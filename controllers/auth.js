import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  const { name, email, password } = req.body;

  // Check all fields
  if (!name || !email || !password)
    return res
      .status(400)
      .json({ error: "Please enter all the required fields." });

  const emailRegEx =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  // Check email
  if (!emailRegEx.test(email))
    return res
      .status(400)
      .json({ error: "Please enter a valid email address." });

  // Check password
  if (password.length <= 6)
    return res
      .status(400)
      .json({ error: "Password must be more than 7 characters." });

  try {
    const alreadyExist = await User.findOne({ email });

    if (alreadyExist)
      return res.status(400).json({
        error: `Email [${email}] already exists in the system.`,
      });

    const encryptedPass = await bcrypt.hash(password, 12);

    const newUser = new User({ name, email, password: encryptedPass });

    // Save user
    const result = await newUser.save();

    result._doc.password = undefined;

    return res.status(201).json({ ...result._doc, message: "User created" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res
      .status(400)
      .json({ error: "Please enter all the required fields." });

  // Check email
  const emailRegEx =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  // Check email
  if (!emailRegEx.test(email))
    return res
      .status(400)
      .json({ error: "Please enter a valid email address." });

  try {
    const isUserExist = await User.findOne({ email });

    if (!isUserExist)
      return res.status(400).json({ error: "Invalid email or password." });

    // If email exists, match password
    const isPasswordMatch = await bcrypt.compare(password, isUserExist.password);

    if (!isPasswordMatch)
      return res.status(400).json({ error: "Invalid email or password." });

    // Generate token
    const payload = { _id: isUserExist._id }; // ID of the user as payload

    const jwtToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "3h",
    });

    const user = { ...isUserExist._doc, password: undefined };
    return res
      .status(200)
      .json({ jwtToken, user, message: "Login successful" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err.message });
  }
};