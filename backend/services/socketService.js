// services/socketHandlers.js
import LocationUpdate from '../models/LocationUpdate.js';
import Trip from '../models/Trip.js';

export const initSocketHandlers = (io) => {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.userId);

        // Join user's room for private messages
        socket.join(socket.userId);

        // Handle location updates
        socket.on('location-update', async (data) => {
            try {
                const { coordinates, address } = data;

                // Get active trip
                const trip = await Trip.findOne({
                    user: socket.userId,
                    status: 'active'
                });

                if (trip) {
                    // Save location update
                    const locationUpdate = await LocationUpdate.create({
                        trip: trip._id,
                        user: socket.userId,
                        coordinates,
                        address
                    });

                    // Broadcast to trusted contacts
                    const populatedTrip = await Trip.findById(trip._id).populate('trustedContacts');
                    populatedTrip.trustedContacts.forEach(contact => {
                        io.to(contact.user.toString()).emit('location-update', {
                            tripId: trip._id,
                            location: { coordinates, address },
                            timestamp: new Date()
                        });
                    });

                    // Update trip progress (simplified)
                    const progress = Math.min(100, trip.progress + 5);
                    await Trip.findByIdAndUpdate(trip._id, { progress });

                    io.to(socket.userId).emit('progress-update', { progress });
                }
            } catch (error) {
                console.error('Location update error:', error);
            }
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.userId);
        });
    });
};
