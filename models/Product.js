import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  quantity: { type: Number, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true }, // New required field
  images: { type: [String], required: true }, // Array of image filenames
  thumbnail: { type: String, required: true }, // Featured image filename
  isFavorite: { type: Boolean, default: false }, // Favorite flag
});

const Product = mongoose.model('Product', ProductSchema);

export default Product;