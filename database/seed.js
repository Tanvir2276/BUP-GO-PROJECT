const bcrypt = require('bcryptjs');
const { Users, Rides, Requests } = require('./db');

async function seedData() {
  const existingUsers = await Users.find({});
  if (existingUsers.length > 0) {
    console.log('Database already contains data.');
    return;
  }

  console.log('Seeding initial BUPGO data into NoSQL database...');

  const passwordHash = await bcrypt.hash('bup12345', 10);
  const adminHash = await bcrypt.hash('admin123', 10);

  // Users with ratings
  const tanvir = await Users.create({
    name: 'Munshi Tanvir Hossain',
    studentId: '2254901076',
    email: 'tanvir.ice@bup.edu.bd',
    phone: '01711223344',
    department: 'ICT (ICE)',
    batch: 'BICE-2024',
    session: '2021-22',
    role: 'driver',
    rating: 5.0,
    totalReviews: 28,
    password: passwordHash,
    vehicleType: 'Car',
    vehicleModel: 'Toyota Axio (Dhaka Metro Ga 21-4321)',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    bio: 'BICE student. Commuting daily from Mirpur 10. Calm driving, AC on, highly punctual.'
  });

  const rahul = await Users.create({
    name: 'Sulayman Akhand Rahul',
    studentId: '2354900901014',
    email: 'rahul.ice@bup.edu.bd',
    phone: '01822334455',
    department: 'ICT (ICE)',
    batch: 'BICE-2024',
    session: '2022-23',
    role: 'driver',
    rating: 4.9,
    totalReviews: 22,
    password: passwordHash,
    vehicleType: 'Motorbike',
    vehicleModel: 'Yamaha FZS V3 (Dhaka Metro Ha 19-8765)',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
    bio: 'ICT 2nd year. Safe rider with extra certified helmet. Route via Uttara and ECB.'
  });

  const ayman = await Users.create({
    name: 'Ayman Sadik',
    studentId: '2254901010',
    email: 'ayman.bba@bup.edu.bd',
    phone: '01933445566',
    department: 'BBA General',
    batch: 'BBA-2023',
    session: '2020-21',
    role: 'passenger',
    rating: 4.8,
    totalReviews: 14,
    password: passwordHash,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    bio: 'FBS student. Always on time for 8:30 AM class.'
  });

  const fatima = await Users.create({
    name: 'Fatima Zahra',
    studentId: '2254901045',
    email: 'fatima.cse@bup.edu.bd',
    phone: '01655667788',
    department: 'Computer Science & Engineering',
    batch: 'BCSE-2023',
    session: '2021-22',
    role: 'passenger',
    rating: 4.9,
    totalReviews: 19,
    password: passwordHash,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    bio: 'FST CSE student looking for carpool buddy from Dhanmondi.'
  });

  const admin = await Users.create({
    name: 'BUP System Administrator',
    studentId: 'BUP-ADMIN-01',
    email: 'admin@bup.edu.bd',
    phone: '01700000000',
    department: 'ICT Laboratory Admin',
    batch: 'Staff',
    session: 'N/A',
    role: 'admin',
    rating: 5.0,
    totalReviews: 50,
    password: adminHash,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    bio: 'System Administrator for BUPGO Platform.'
  });

  // Calculate dynamic dates
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);

  const formatDate = d => d.toISOString().split('T')[0];

  // Seed Realistic Rides across Dhaka & Suburbs
  const ride1 = await Rides.create({
    driverId: tanvir._id,
    driverName: tanvir.name,
    driverStudentId: tanvir.studentId,
    driverDept: tanvir.department,
    driverPhone: tanvir.phone,
    driverAvatar: tanvir.avatar,
    driverRating: 5.0,
    driverReviews: 28,
    startingLocation: 'Mirpur 10 Circle',
    destination: 'BUP Campus (Main Gate)',
    travelDate: formatDate(tomorrow),
    departureTime: '07:45 AM',
    totalSeats: 3,
    availableSeats: 2,
    transportationType: 'Car',
    vehicleModel: 'Toyota Axio',
    estimatedCost: 40,
    status: 'active',
    additionalInfo: 'Air conditioned car. Leaving sharp at 7:45 AM from Mirpur 10 roundabout. Only BUP students welcome.'
  });

  const ride2 = await Rides.create({
    driverId: rahul._id,
    driverName: rahul.name,
    driverStudentId: rahul.studentId,
    driverDept: rahul.department,
    driverPhone: rahul.phone,
    driverAvatar: rahul.avatar,
    driverRating: 4.9,
    driverReviews: 22,
    startingLocation: 'Uttara Sector 7 (House Building)',
    destination: 'BUP Campus (Main Gate)',
    travelDate: formatDate(tomorrow),
    departureTime: '07:30 AM',
    totalSeats: 1,
    availableSeats: 1,
    transportationType: 'Motorbike',
    vehicleModel: 'Yamaha FZS V3',
    estimatedCost: 70,
    status: 'active',
    additionalInfo: 'Clean spare helmet provided. Route: Uttara -> Airport -> Radisson -> ECB Chattar -> BUP.'
  });

  const ride3 = await Rides.create({
    driverId: tanvir._id,
    driverName: tanvir.name,
    driverStudentId: tanvir.studentId,
    driverDept: tanvir.department,
    driverPhone: tanvir.phone,
    driverAvatar: tanvir.avatar,
    driverRating: 5.0,
    driverReviews: 28,
    startingLocation: 'BUP Campus (Main Gate)',
    destination: 'Mirpur 10 / Kazipara',
    travelDate: formatDate(tomorrow),
    departureTime: '04:30 PM',
    totalSeats: 3,
    availableSeats: 3,
    transportationType: 'Car',
    vehicleModel: 'Toyota Axio',
    estimatedCost: 40,
    status: 'active',
    additionalInfo: 'Return trip after lab class ends at 4:15 PM. Can drop off at Mirpur 11, 10, or Shewrapara.'
  });

  const ride4 = await Rides.create({
    driverId: rahul._id,
    driverName: rahul.name,
    driverStudentId: rahul.studentId,
    driverDept: rahul.department,
    driverPhone: rahul.phone,
    driverAvatar: rahul.avatar,
    driverRating: 4.9,
    driverReviews: 22,
    startingLocation: 'Dhanmondi 27 (Rapa Plaza)',
    destination: 'BUP Campus (Main Gate)',
    travelDate: formatDate(dayAfter),
    departureTime: '07:15 AM',
    totalSeats: 1,
    availableSeats: 1,
    transportationType: 'Motorbike',
    vehicleModel: 'Yamaha FZS V3',
    estimatedCost: 80,
    status: 'active',
    additionalInfo: 'Morning ride via Asad Gate and Technical. Prompt departure.'
  });

  const ride5 = await Rides.create({
    driverId: tanvir._id,
    driverName: tanvir.name,
    driverStudentId: tanvir.studentId,
    driverDept: tanvir.department,
    driverPhone: tanvir.phone,
    driverAvatar: tanvir.avatar,
    driverRating: 5.0,
    driverReviews: 28,
    startingLocation: 'Savar Cantonment (Sena Auditorium)',
    destination: 'BUP Campus (Main Gate)',
    travelDate: formatDate(tomorrow),
    departureTime: '07:00 AM',
    totalSeats: 3,
    availableSeats: 3,
    transportationType: 'Car',
    vehicleModel: 'Toyota Axio',
    estimatedCost: 90,
    status: 'active',
    additionalInfo: 'Direct carpool from Savar via Aminbazar & Mirpur Gabtoli to Mirpur Cantonment.'
  });

  // Seed sample requests
  await Requests.create({
    rideId: ride1._id,
    riderId: ayman._id,
    riderName: ayman.name,
    riderStudentId: ayman.studentId,
    riderDept: ayman.department,
    riderPhone: ayman.phone,
    seatsRequested: 1,
    pickupLocation: 'Mirpur 10 Circle',
    notes: 'Have 8:30 AM mid exam in FBS building. Will be waiting at 7:40 AM.',
    status: 'accepted'
  });

  await Requests.create({
    rideId: ride1._id,
    riderId: fatima._id,
    riderName: fatima.name,
    riderStudentId: fatima.studentId,
    riderDept: fatima.department,
    riderPhone: fatima.phone,
    seatsRequested: 1,
    pickupLocation: 'Mirpur 10 Circle',
    notes: 'Heading to ICE 3206 lab class.',
    status: 'pending'
  });

  console.log('✓ BUPGO NoSQL Database successfully initialized with demo students, rides, and requests!');
}

module.exports = { seedData };
