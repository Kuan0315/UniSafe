import EmergencyContact from "../models/EmergencyContact.js";

// GET all contacts
export const getContacts = async (req, res) => {
    try {
        const contacts = await EmergencyContact.findAll();
        res.json(contacts);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch contacts" });
    }
};

// Add new contact (admin/teacher only)
export const addContact = async (req, res) => {
    try {
        const { name, phone, type } = req.body;
        const contact = await EmergencyContact.create({ name, phone, type });
        res.status(201).json(contact);
    } catch (err) {
        res.status(400).json({ error: "Failed to add contact" });
    }
};

// Update contact (admin/teacher only)
export const updateContact = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, type } = req.body;
        const contact = await EmergencyContact.findByPk(id);

        if (!contact) return res.status(404).json({ error: "Not found" });

        contact.name = name || contact.name;
        contact.phone = phone || contact.phone;
        contact.type = type || contact.type;
        await contact.save();

        res.json(contact);
    } catch (err) {
        res.status(400).json({ error: "Failed to update contact" });
    }
};

// Delete contact
export const deleteContact = async (req, res) => {
    try {
        const { id } = req.params;
        const contact = await EmergencyContact.findByPk(id);
        if (!contact) return res.status(404).json({ error: "Not found" });

        await contact.destroy();
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete contact" });
    }
};
