import mongoose from "mongoose";

const ProductImageModel = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  image: {
    data: Buffer,
    contentType: String
  }
});

const ProductImage = mongoose.model("ProductImage", ProductImageModel);

export default ProductImage;