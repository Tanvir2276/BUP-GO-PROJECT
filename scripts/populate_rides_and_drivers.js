/**
 * BUPGO - Seed 200+ Rides and 3 Specific Drivers
 * Drivers: 'jabenNakimama', 'choloBUP', 'AmiBasayJabo'
 * Realistic student photos for all accounts
 * Heavy coverage of ECB, Mirpur 1-14, Uttara, Dhanmondi, Savar
 * Updates both database/nosql_data/*.json AND local MongoDB 'bupgo'
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const PASSWORD_HASH = '$2b$10$D2oSAd8yeBi.T4nyZr8MzeNi6iCE91QjUXJAXONIw79.Goa48XeJS'; // Password123!

const USERS_TO_ADD_OR_UPDATE = [
  {
    name: 'jabenNakimama',
    studentId: '2254901091',
    email: 'jabennakimama@bup.edu.bd',
    phone: '01711998877',
    department: 'ICT (ICE)',
    batch: 'BICE-2024',
    session: '2021-22',
    role: 'driver',
    password: PASSWORD_HASH,
    vehicleType: 'Car',
    vehicleModel: 'Toyota Premio (Dhaka Metro Ga 28-9012)',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
    rating: 4.95,
    totalReviews: 42,
    bio: 'Mama jaben naki? Daily carpool route between ECB / Mirpur and BUP. Super punctual and safe AC ride.'
  },
  {
    name: 'choloBUP',
    studentId: '2254901092',
    email: 'cholobup@bup.edu.bd',
    phone: '01822001122',
    department: 'Computer Science & Engineering',
    batch: 'BCSE-2023',
    session: '2021-22',
    role: 'driver',
    password: PASSWORD_HASH,
    vehicleType: 'Car',
    vehicleModel: 'Honda Grace Hybrid (Dhaka Metro Ga 33-1144)',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    rating: 4.98,
    totalReviews: 55,
    bio: 'Cholo BUP! Commuting from Uttara / Airport / ECB every morning. Clean car, nice acoustic playlist, calm driving.'
  },
  {
    name: 'AmiBasayJabo',
    studentId: '2254901093',
    email: 'amibasayjabo@bup.edu.bd',
    phone: '01933112244',
    department: 'BBA Marketing',
    batch: 'BBA-2024',
    session: '2022-23',
    role: 'driver',
    password: PASSWORD_HASH,
    vehicleType: 'Car',
    vehicleModel: 'Suzuki Swift Dzire (Dhaka Metro Kha 14-5566)',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
    rating: 4.92,
    totalReviews: 36,
    bio: 'Class shesh, Ami Basay Jabo! Returning from BUP to Dhanmondi, Mirpur, and Farmgate daily.'
  }
];

const DRIVERS_FOR_RIDES = [
  {
    driverName: 'jabenNakimama',
    driverStudentId: '2254901091',
    driverDept: 'ICT (ICE)',
    driverPhone: '01711998877',
    driverRating: 4.95,
    driverReviews: 42,
    driverAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
    transportationType: 'Car',
    vehicleModel: 'Toyota Premio (AC)',
    totalSeats: 3
  },
  {
    driverName: 'choloBUP',
    driverStudentId: '2254901092',
    driverDept: 'Computer Science & Engineering',
    driverPhone: '01822001122',
    driverRating: 4.98,
    driverReviews: 55,
    driverAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    transportationType: 'Car',
    vehicleModel: 'Honda Grace Hybrid',
    totalSeats: 3
  },
  {
    driverName: 'AmiBasayJabo',
    driverStudentId: '2254901093',
    driverDept: 'BBA Marketing',
    driverPhone: '01933112244',
    driverRating: 4.92,
    driverReviews: 36,
    driverAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
    transportationType: 'Car',
    vehicleModel: 'Suzuki Swift Dzire',
    totalSeats: 3
  },
  {
    driverName: 'Munshi Tanvir Hossain',
    driverStudentId: '2254901076',
    driverDept: 'ICT (ICE)',
    driverPhone: '01711223344',
    driverRating: 5.0,
    driverReviews: 48,
    driverAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
    transportationType: 'Car',
    vehicleModel: 'Toyota Axio',
    totalSeats: 3
  },
  {
    driverName: 'Sulayman Akhand Rahul',
    driverStudentId: '2354900901014',
    driverDept: 'ICT (ICE)',
    driverPhone: '01822334455',
    driverRating: 4.9,
    driverReviews: 34,
    driverAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=300&q=80',
    transportationType: 'Motorbike',
    vehicleModel: 'Yamaha FZS V3',
    totalSeats: 1
  }
];

const HUBS = [
  // Heavy ECB & Mirpur Hubs
  { name: 'ECB Chattar (Matikata Road)', costCar: 30, costBike: 35, costCng: 25 },
  { name: 'ECB Chattar (Flyover Roundabout)', costCar: 30, costBike: 35, costCng: 25 },
  { name: 'ECB Chattar (Sena Shopping Complex)', costCar: 35, costBike: 40, costCng: 30 },
  { name: 'Mirpur 10 (Metro Station Gate 2)', costCar: 40, costBike: 45, costCng: 35 },
  { name: 'Mirpur 10 Roundabout (Fire Service)', costCar: 40, costBike: 45, costCng: 35 },
  { name: 'Mirpur 12 (Metro Terminal Station)', costCar: 35, costBike: 40, costCng: 30 },
  { name: 'Mirpur 11 (Purobi Cinema / Metro)', costCar: 35, costBike: 40, costCng: 30 },
  { name: 'Mirpur 1 (Mukhtijoddha Market)', costCar: 45, costBike: 50, costCng: 40 },
  { name: 'Mirpur 2 (National Stadium Gate)', costCar: 45, costBike: 50, costCng: 40 },
  { name: 'Mirpur 14 (Brac Bank / Kachukhet Gate)', costCar: 35, costBike: 40, costCng: 30 },
  { name: 'Mirpur 6 (Bazar & Swimming Complex)', costCar: 40, costBike: 45, costCng: 35 },
  { name: 'Mirpur DOHS (Gate 1)', costCar: 25, costBike: 30, costCng: 20 },
  { name: 'Mirpur DOHS (Gate 2 / Lake)', costCar: 25, costBike: 30, costCng: 20 },
  { name: 'Kazipara Metro Station (Footbridge)', costCar: 45, costBike: 50, costCng: 40 },
  { name: 'Shewrapara Metro Station (Rokeya Sarani)', costCar: 45, costBike: 55, costCng: 40 },
  { name: 'Agargaon (Passport Office / Metro)', costCar: 50, costBike: 60, costCng: 45 },

  // Uttara & Airport
  { name: 'Uttara House Building (Sector 7)', costCar: 55, costBike: 65, costCng: 50 },
  { name: 'Uttara Sector 3 (Rajlakshmi Complex)', costCar: 55, costBike: 65, costCng: 50 },
  { name: 'Uttara Sector 10 (Kampara)', costCar: 60, costBike: 70, costCng: 55 },
  { name: 'Airport (Haj Camp / Railway Station)', costCar: 50, costBike: 60, costCng: 45 },
  { name: 'Jasimuddin Road (Uttara Gate)', costCar: 50, costBike: 60, costCng: 45 },
  { name: 'Azampur Bus Stand (Uttara)', costCar: 55, costBike: 65, costCng: 50 },

  // Dhanmondi, Farmgate, Central
  { name: 'Dhanmondi 27 (Rapa Plaza)', costCar: 60, costBike: 75, costCng: 55 },
  { name: 'Dhanmondi 32 (Sukrabad / Metro Link)', costCar: 60, costBike: 75, costCng: 55 },
  { name: 'Dhanmondi (Shimanto Square)', costCar: 65, costBike: 80, costCng: 60 },
  { name: 'Farmgate (Ananda Cinema / Metro)', costCar: 50, costBike: 65, costCng: 45 },
  { name: 'Khamarbari / Parliament Road', costCar: 50, costBike: 65, costCng: 45 },
  { name: 'Mohakhali (Amtoli / Bir Uttam CR Dutta)', costCar: 45, costBike: 55, costCng: 40 },
  { name: 'Banani (Kemal Ataturk Avenue)', costCar: 50, costBike: 60, costCng: 45 },
  { name: 'Kuril Bishwa Road Flyover', costCar: 45, costBike: 50, costCng: 40 },
  { name: 'Jamuna Future Park (Main Gate)', costCar: 50, costBike: 55, costCng: 45 },

  // Savar & Outskirts
  { name: 'Savar Cantonment (Sena Auditorium)', costCar: 85, costBike: 100, costCng: 80 },
  { name: 'Savar Bazar Bus Stand', costCar: 90, costBike: 110, costCng: 85 },
  { name: 'Nabinagar Smrity Soudho', costCar: 100, costBike: 120, costCng: 95 },
  { name: 'Hemayetpur Bus Stand', costCar: 75, costBike: 90, costCng: 70 }
];

const MORNING_TIMES = ['07:10 AM', '07:25 AM', '07:40 AM', '07:55 AM', '08:10 AM', '08:25 AM', '08:45 AM', '09:15 AM'];
const RETURN_TIMES = ['01:30 PM', '02:15 PM', '03:15 PM', '03:45 PM', '04:15 PM', '04:45 PM', '05:15 PM', '05:45 PM'];

function getRelativeDate(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

async function runSeed() {
  console.log('🔄 1. Updating Users with 3 Specific Drivers & Realistic Avatars...');
  const usersPath = path.join(__dirname, '..', 'database', 'nosql_data', 'users.json');
  let users = [];
  try {
    users = JSON.parse(fs.readFileSync(usersPath, 'utf8') || '[]');
  } catch (e) {
    users = [];
  }

  // Update existing users with realistic avatars
  for (const u of users) {
    if (u.name === 'Fatima Zahra') {
      u.avatar = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80';
    } else if (u.name === 'Ayman Sadik') {
      u.avatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80';
    } else if (u.name === 'Sulayman Akhand Rahul') {
      u.avatar = 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=300&q=80';
    } else if (u.name === 'Munshi Tanvir Hossain') {
      u.avatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80';
    } else if (u.name === 'BUP System Administrator') {
      u.avatar = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80';
    }
  }

  // Add the 3 drivers if they do not exist
  for (const driverUser of USERS_TO_ADD_OR_UPDATE) {
    const idx = users.findIndex(u => u.name === driverUser.name || u.studentId === driverUser.studentId);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...driverUser };
    } else {
      users.push({
        _id: new mongoose.Types.ObjectId().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...driverUser
      });
    }
  }

  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2), 'utf8');
  console.log(`✓ Saved ${users.length} users to ${usersPath}`);

  // 2. Generate 200+ New Rides
  console.log('🔄 2. Generating 200+ new rides...');
  const ridesPath = path.join(__dirname, '..', 'database', 'nosql_data', 'rides.json');
  let existingRides = [];
  try {
    existingRides = JSON.parse(fs.readFileSync(ridesPath, 'utf8') || '[]');
  } catch (e) {
    existingRides = [];
  }

  const existingKeys = new Set(existingRides.map(r => `${r.startingLocation}|${r.destination}|${r.travelDate}|${r.departureTime}`));
  const newRides = [];

  // Generate over 7 days (today to +6 days)
  for (let dayOffset = 0; dayOffset <= 6; dayOffset++) {
    const travelDate = getRelativeDate(dayOffset);

    // Morning Rides TO BUP
    for (let h = 0; h < HUBS.length; h++) {
      const hub = HUBS[h];
      const driver = DRIVERS_FOR_RIDES[(h + dayOffset) % DRIVERS_FOR_RIDES.length];
      const depTime = MORNING_TIMES[(h + dayOffset) % MORNING_TIMES.length];

      const key = `${hub.name}|BUP Campus (Main Gate)|${travelDate}|${depTime}`;
      if (!existingKeys.has(key)) {
        existingKeys.add(key);
        const cost = driver.transportationType === 'Car' ? hub.costCar :
                     driver.transportationType === 'Motorbike' ? hub.costBike : hub.costCng;

        newRides.push({
          _id: new mongoose.Types.ObjectId().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          driverId: driver.driverStudentId,
          driverName: driver.driverName,
          driverStudentId: driver.driverStudentId,
          driverDept: driver.driverDept,
          driverPhone: driver.driverPhone,
          driverAvatar: driver.driverAvatar,
          driverRating: driver.driverRating,
          driverReviews: driver.driverReviews + (h % 6),
          tripType: 'to_bup',
          startingLocation: hub.name,
          destination: 'BUP Campus (Main Gate)',
          travelDate: travelDate,
          departureTime: depTime,
          totalSeats: driver.totalSeats,
          availableSeats: driver.totalSeats,
          transportationType: driver.transportationType,
          vehicleModel: driver.vehicleModel,
          estimatedCost: cost,
          status: 'active',
          additionalInfo: `Daily commute to BUP from ${hub.name} with ${driver.driverName}. AC on, safe driving.`
        });
      }
    }

    // Return Rides FROM BUP Campus to Hubs
    for (let h = 0; h < HUBS.length; h++) {
      const hub = HUBS[h];
      const driver = DRIVERS_FOR_RIDES[(h + dayOffset + 2) % DRIVERS_FOR_RIDES.length];
      const depTime = RETURN_TIMES[(h + dayOffset) % RETURN_TIMES.length];

      const key = `BUP Campus (Main Gate)|${hub.name}|${travelDate}|${depTime}`;
      if (!existingKeys.has(key)) {
        existingKeys.add(key);
        const cost = driver.transportationType === 'Car' ? hub.costCar :
                     driver.transportationType === 'Motorbike' ? hub.costBike : hub.costCng;

        newRides.push({
          _id: new mongoose.Types.ObjectId().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          driverId: driver.driverStudentId,
          driverName: driver.driverName,
          driverStudentId: driver.driverStudentId,
          driverDept: driver.driverDept,
          driverPhone: driver.driverPhone,
          driverAvatar: driver.driverAvatar,
          driverRating: driver.driverRating,
          driverReviews: driver.driverReviews + (h % 5),
          tripType: 'return',
          startingLocation: 'BUP Campus (Main Gate)',
          destination: hub.name,
          travelDate: travelDate,
          departureTime: depTime,
          totalSeats: driver.totalSeats,
          availableSeats: driver.totalSeats,
          transportationType: driver.transportationType,
          vehicleModel: driver.vehicleModel,
          estimatedCost: cost,
          status: 'active',
          additionalInfo: `Returning from BUP Campus to ${hub.name} with ${driver.driverName}. Ride sharing for BUPians.`
        });
      }
    }
  }

  const allRides = [...existingRides, ...newRides];
  fs.writeFileSync(ridesPath, JSON.stringify(allRides, null, 2), 'utf8');
  console.log(`✓ Added ${newRides.length} new rides! Total rides in rides.json: ${allRides.length}`);

  // 3. Update MongoDB (bupgo)
  console.log('🔄 3. Updating local MongoDB database (bupgo)...');
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bupgo';
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 4000 });
    console.log('✓ Connected to MongoDB at ' + mongoUri);

    const UserCol = mongoose.connection.collection('users');
    const RideCol = mongoose.connection.collection('rides');

    // Sync users to MongoDB
    for (const u of users) {
      const { _id, ...userFields } = u;
      await UserCol.updateOne(
        { studentId: u.studentId },
        { $set: userFields, $setOnInsert: { _id: mongoose.Types.ObjectId.isValid(_id) ? new mongoose.Types.ObjectId(_id) : new mongoose.Types.ObjectId() } },
        { upsert: true }
      );
    }
    console.log(`✓ Synced ${users.length} users into MongoDB users collection.`);

    // Sync rides to MongoDB
    for (const r of allRides) {
      const { _id, ...rideFields } = r;
      const mongoId = mongoose.Types.ObjectId.isValid(_id) ? new mongoose.Types.ObjectId(_id) : new mongoose.Types.ObjectId();
      await RideCol.updateOne(
        { _id: mongoId },
        { $set: rideFields },
        { upsert: true }
      );
    }
    const mongoRideCount = await RideCol.countDocuments();
    console.log(`✓ Synced rides into MongoDB rides collection (Total in Mongo: ${mongoRideCount}).`);

    await mongoose.disconnect();
  } catch (err) {
    console.log(`ℹ️ MongoDB sync note: ${err.message}. File store has all data preserved.`);
  }

  console.log('🎉 Population complete successfully!');
}

runSeed().catch(err => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
