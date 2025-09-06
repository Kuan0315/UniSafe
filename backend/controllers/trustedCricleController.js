import TrustedContact from '../models/TrustedContact.js';

export const getContacts = async (req, res) => {
    try {
        const contacts = await TrustedContact.findAll({ where: { userId: req.userId } });
        res.json(contacts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const addContact = async (req, res) => {
    try {
        const { name, phone, relationship } = req.body;
        const contact = await TrustedContact.create({ name, phone, relationship, userId: req.userId });
        res.status(201).json(contact);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const removeContact = async (req, res) => {
    try {
        const { id } = req.params;
        await TrustedContact.destroy({ where: { id, userId: req.userId } });
        res.json({ message: 'Contact removed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
