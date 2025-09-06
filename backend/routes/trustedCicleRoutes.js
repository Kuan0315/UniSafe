import express from 'express';
import { getContacts, addContact, removeContact } from '../controllers/trustedCricleController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, getContacts);
router.post('/', auth, addContact);
router.delete('/:id', auth, removeContact);

export default router;
