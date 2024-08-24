const db = require('../config/db');

// Function to validate input data
const validateSchoolData = (data) => {
  const errors = [];
  const { name, address, latitude, longitude } = data;

  if (typeof name !== 'string' || !name.trim()) {
    errors.push({ field: 'name', message: 'Name is required and must be a non-empty string' });
  }

  if (typeof address !== 'string' || !address.trim()) {
    errors.push({ field: 'address', message: 'Address is required and must be a non-empty string' });
  }

  if (isNaN(parseFloat(latitude)) || latitude === '') {
    errors.push({ field: 'latitude', message: 'Latitude is required and must be a number' });
  }

  if (isNaN(parseFloat(longitude)) || longitude === '') {
    errors.push({ field: 'longitude', message: 'Longitude is required and must be a number' });
  }

  return errors;
};

// Add School API
exports.addSchool = async (req, res) => {
  const errors = validateSchoolData(req.body);

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const { name, address, latitude, longitude } = req.body;

  try {
    // Fetch all schools from the database
    const [schools] = await db.query('SELECT * FROM schools');

    // Manual check for existing school
    const existingSchool = schools.find(school =>
      school.name === name &&
      parseFloat(school.latitude) === parseFloat(latitude) &&
      parseFloat(school.longitude) === parseFloat(longitude)
    );

    if (existingSchool) {
      return res.status(409).json({ message: 'A school with the same name, address, latitude, and longitude already exists' });
    }

    // Insert the new school into the database
    const [result] = await db.query(
      'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)',
      [name, address, parseFloat(latitude), parseFloat(longitude)]
    );

    res.status(201).json({ id: result.insertId, name, address, latitude, longitude, message: 'School added successfully' });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ message: 'Database error', error: err.message });
  }
};

// Haversine formula to calculate distance between two points on the Earth
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of Earth in kilometers
  const rad = (deg) => (deg * Math.PI) / 180;

  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in kilometers
};

// List Schools API
exports.listSchools = async (req, res) => {
  const { latitude, longitude } = req.query;

  if (!latitude || !longitude || isNaN(parseFloat(latitude)) || isNaN(parseFloat(longitude))) {
    return res.status(400).json({ message: 'Valid latitude and longitude are required' });
  }

  try {
    // Fetch all schools from the database
    const [schools] = await db.query('SELECT * FROM schools');

    // Calculate distance and sort schools by distance
    const sortedSchools = schools.map(school => {
      const distance = haversineDistance(
        parseFloat(latitude),
        parseFloat(longitude),
        parseFloat(school.latitude),
        parseFloat(school.longitude)
      );
      return { ...school, distance };
    }).sort((a, b) => a.distance - b.distance);

    // Send the sorted list as response
    res.status(200).json(sortedSchools);
  } catch (err) {
    console.error('Database error:', err.message); // Log error for debugging
    res.status(500).json({ message: 'Database error', error: err.message });
  }
};
