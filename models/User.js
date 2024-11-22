// import mongoose from "mongoose";

// const UserModel = new mongoose.Schema({
//   name: {
//     type: String,
//     required: [true, "Name is required"],
//     max: 50,
//   },
//   email: {
//     type: String,
//     required: true,
//     max: 50,
//     unique: true,
//     required: [true, "Email is required"],
//   },
//   password: {
//     type: String,
//     required: [true, "Password is required"],
//   },
// });

// const User = mongoose.model("User", UserModel);

// export default User;
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  favoriteProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }], // Add this field
});

const User = mongoose.model('User', userSchema);

export default User;