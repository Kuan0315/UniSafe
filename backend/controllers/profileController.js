import User from '../models/User.js';

export const getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.userId, { attributes: { exclude: ['password'] } });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { name, avatar, anonymousMode, notificationsEnabled, locationSharing, autoCaptureSOS, ttsEnabled } = req.body;
        const user = await User.findByPk(req.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        await user.update({ name, avatar, anonymousMode, notificationsEnabled, locationSharing, autoCaptureSOS, ttsEnabled });
        res.json({ message: 'Profile updated', user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
