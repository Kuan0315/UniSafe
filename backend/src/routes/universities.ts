<<<<<<< HEAD
import { Router } from 'express';

// Minimal static list to support frontend selector; can be expanded
const UNIVERSITIES = [
  { id: 'um', name: 'University of Malaya', center: { latitude: 3.1203, longitude: 101.6544 }, coverageRadius: 8, campusBoundary: [] },
  { id: 'ukm', name: 'Universiti Kebangsaan Malaysia', center: { latitude: 2.9225, longitude: 101.7872 }, coverageRadius: 8, campusBoundary: [] },
];

const router = Router();

router.get('/', (_req, res) => {
  res.json(UNIVERSITIES);
});

export default router;

=======
import { Router } from 'express';

// Minimal static list to support frontend selector; can be expanded
const UNIVERSITIES = [
  { id: 'um', name: 'University of Malaya', center: { latitude: 3.1203, longitude: 101.6544 }, coverageRadius: 8, campusBoundary: [] },
  { id: 'ukm', name: 'Universiti Kebangsaan Malaysia', center: { latitude: 2.9225, longitude: 101.7872 }, coverageRadius: 8, campusBoundary: [] },
];

const router = Router();

router.get('/', (_req, res) => {
  res.json(UNIVERSITIES);
});

export default router;

>>>>>>> 441d99cd00a666d82e26351ff32ea84d8b1e8ff8
