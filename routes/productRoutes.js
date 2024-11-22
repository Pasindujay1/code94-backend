import express from 'express';
import { addProduct, getProducts, getProductById, editProduct, deleteProduct, toggleFavorite, getFavoriteProducts, searchProducts, getImage } from '../controllers/productController.js';
import upload from '../middleware/upload.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/add', auth, upload.array('images'), addProduct);
router.get('/', getProducts);                 // Get all products
router.get('/favorites', auth, getFavoriteProducts);   
router.get('/search', searchProducts);        
router.get('/:id', getProductById);           // Get a single product
router.put('/edit/:id', auth, upload.array('images'), editProduct); // Updated to use upload.array
router.delete('/delete/:id', auth, deleteProduct);  // Delete a product
router.patch('/favorite/:id', auth, toggleFavorite); // Toggle favorite status
router.get('/image/:filename', getImage);     // Get image by filename

export default router;