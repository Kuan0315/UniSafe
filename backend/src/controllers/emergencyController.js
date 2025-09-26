import EmergencyContact from '../models/EmergencyContact.ts';

// Get all contacts
export const getContacts = async (req, res) => {
    try {
        const contacts = await EmergencyContact.find();
        res.json(contacts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Create a new contact
export const createContact = async (req, res) => {
    try {
        const { name, phone, type } = req.body;
        const newContact = new EmergencyContact({ name, phone, type });
        const savedContact = await newContact.save();
        res.status(201).json(savedContact);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Update a contact
export const updateContact = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await EmergencyContact.findByIdAndUpdate(id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Delete a contact
export const deleteContact = async (req, res) => {
    try {
        const { id } = req.params;
        await EmergencyContact.findByIdAndDelete(id);
        res.json({ message: 'Contact deleted' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
