import Product from "../models/Product.js";
import User from "../models/User.js";
import axios from "axios";
import fs, { appendFile } from "fs"; // To delete files from the server
import path from "path";
import multer from "multer";
import ProductImage from "../models/ProductImage.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Add a new product
export const addProduct = async (req, res) => {
  try {
    const { name, sku, quantity, description, price, thumbnailIndex } =
      req.body;

    // Process uploaded images
    const images = req.files ? req.files.map((file) => file.filename) : [];

    // Validate thumbnail index
    if (
      !thumbnailIndex ||
      thumbnailIndex < 0 ||
      thumbnailIndex >= images.length
    ) {
      return res.status(400).json({ message: "Invalid thumbnail index" });
    }

    const thumbnail = images[thumbnailIndex]; // Use the selected image as the thumbnail

    const product = new Product({
      name,
      sku,
      quantity,
      description,
      price, // Include the price field
      images,
      thumbnail,
    });

    await product.save();
    res.status(201).json({ message: "Product added successfully", product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get image by filename
export const getImage = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, "..", "uploads", filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Image not found" });
    }
    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all products
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single product by ID
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Edit a product
export const editProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate the product ID
    if (!id || id.length !== 24) {
      return res.status(400).json({ message: "Invalid product ID format" });
    }

    // Fetch the existing product
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    const { name, sku, quantity, description, price, thumbnailIndex } =
      req.body;

    // Handle uploaded images
    let newImages = [];
    if (req.files && Array.isArray(req.files)) {
      newImages = req.files.map((file) => file.filename);
    } else if (req.files && req.files.images) {
      newImages = req.files.images.map((file) => file.filename);
    }
    const allImages = [...newImages]; // Start with new images

    // Determine which existing images should remain
    const remainingExistingImages = existingProduct.images.filter((image) =>
      allImages.includes(image)
    );

    // Append remaining existing images to the new images
    const updatedImages = [...remainingExistingImages, ...newImages];

    // Determine images to delete
    const imagesToDelete = existingProduct.images.filter(
      (image) => !updatedImages.includes(image)
    );

    // Delete files from the server
    imagesToDelete.forEach((imagePath) => {
      const fullPath = path.join(__dirname, "..", "uploads", imagePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    });

    // Validate thumbnail index
    let thumbnail = existingProduct.thumbnail;
    if (thumbnailIndex !== undefined) {
      if (thumbnailIndex < 0 || thumbnailIndex >= updatedImages.length) {
        return res.status(400).json({ message: "Invalid thumbnail index" });
      }
      thumbnail = updatedImages[thumbnailIndex]; // Use the selected image as the thumbnail
    }

    // Prepare the updated fields
    const updateFields = {
      name: name || existingProduct.name,
      sku: sku || existingProduct.sku,
      quantity: quantity || existingProduct.quantity,
      description: description || existingProduct.description,
      price: price || existingProduct.price, // Include the price field
      images: updatedImages,
      thumbnail: thumbnail, // Use the selected or existing thumbnail
    };

    // Update the product in the database
    const updatedProduct = await Product.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    });

    if (!updatedProduct) {
      return res.status(500).json({ message: "Failed to update the product" });
    }

    res.status(200).json({
      message: "Product updated successfully",
      updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error); // Log the error for debugging
    res.status(500).json({ message: error.message });
  }
};

// Delete a product
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate the product ID format
    if (!id || id.length !== 24) {
      return res.status(400).json({ message: "Invalid product ID format" });
    }

    // Find the product to delete
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Delete associated images from the server
    product.images.forEach((imagePath) => {
      const fullPath = path.resolve(imagePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    });

    // Delete the product from the database
    await Product.findByIdAndDelete(id);

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error); // Log for debugging
    res
      .status(500)
      .json({ message: "An error occurred while deleting the product" });
  }
};

// Toggle favorite status
export const toggleFavorite = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; // Assuming you have user ID in the request

    // Validate the product ID format
    if (!id || id.length !== 24) {
      console.error("Invalid product ID format:", id);
      return res.status(400).json({ message: "Invalid product ID format" });
    }

    // Find the product by ID
    const product = await Product.findById(id);
    if (!product) {
      console.error("Product not found:", id);
      return res.status(404).json({ message: "Product not found" });
    }

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      console.error("User not found:", userId);
      return res.status(404).json({ message: "User not found" });
    }

    // Toggle the favorite status
    const index = user.favoriteProducts.indexOf(id);
    if (index === -1) {
      user.favoriteProducts.push(id);
    } else {
      user.favoriteProducts.splice(index, 1);
    }

    // Save the updated user
    await user.save();

    res.status(200).json({
      message: `Product favorite status updated`,
      favoriteProducts: user.favoriteProducts,
    });
  } catch (error) {
    console.error("Error toggling favorite status:", error); // Debug log
    res
      .status(500)
      .json({ message: "An error occurred while updating favorite status" });
  }
};
// Fetch favorite products
export const getFavoriteProducts = async (req, res) => {
  try {
    const userId = req.user._id; // Assuming you have user ID in the request
    console.log("User ID: ", userId);

    // Find the user by ID and populate favorite products with only their IDs
    const user = await User.findById(userId).populate({
      path: "favoriteProducts",
      select: "_id", // Only include the _id field
    });

    if (!user) {
      console.error("User not found:", userId);
      return res.status(404).json({ message: "User not found" });
    }

    // Extract the IDs of the favorite products
    const favoriteProductIds = user.favoriteProducts.map(
      (product) => product._id
    );

    console.log("Favorite Product IDs:", favoriteProductIds);

    res.status(200).json({
      message: "Favorite products fetched successfully",
      favoriteProducts: favoriteProductIds,
    });
  } catch (error) {
    console.error("Error fetching favorite products:", error); // Debug log
    res
      .status(500)
      .json({ message: "An error occurred while fetching favorite products" });
  }
};

// Search products by name or SKU
export const searchProducts = async (req, res) => {
  try {
    const { query } = req.query; // Get the search query from the request

    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Search query is required" });
    }

    // Perform a case-insensitive search using a regex
    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: "i" } }, // Search in name
        { sku: { $regex: query, $options: "i" } }, // Search in SKU
      ],
    });

    if (products.length === 0) {
      return res.status(404).json({ message: "No matching products found" });
    }

    res.status(200).json({
      message: "Products fetched successfully",
      products,
    });
  } catch (error) {
    console.error("Error searching products:", error); // Debug log
    res
      .status(500)
      .json({ message: "An error occurred while searching products" });
  }
};
