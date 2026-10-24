/**
 * BUPGO - 200+ Rides Population Script
 * Adds rich, realistic BUP rides for ECB, Mirpur, Uttara, Dhanmondi, Savar, etc.
 * Updates both database/nosql_data/rides.json AND local MongoDB database.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Seed driver profiles
const DRIVERS = [
  {
    driverName: 'Munshi Tanvir Hossain',
    driverStudentId: '2254901076',
    driverDept: 'ICT (ICE)',
    driverPhone: '01711223344',
    driverRating: 5.0,
    driverReviews: 38,
    driverAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
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
    driverReviews: 29,
    driverAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
    transportationType: 'Motorbike',
    vehicleModel: 'Yamaha FZS V3',
    totalSeats: 1
  },
  {
    driverName: 'Adnan Ahmed',
    driverStudentId: '2254901088',
    driverDept: 'BBA General',
    driverPhone: '01911445566',
    driverRating: 4.9,
    driverReviews: 24,
    driverAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    transportationType: 'Car',
    vehicleModel: 'Honda Grace Hybrid',
    totalSeats: 3
  },
  {
    driverName: 'Zarin Tasnim',
    driverStudentId: '2254901052',
    driverDept: 'Computer Science & Engineering',
    driverPhone: '01755667788',
    driverRating: 5.0,
    driverReviews: 31,
    driverAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    transportationType: 'Car',
    vehicleModel: 'Toyota Premio',
    totalSeats: 3
  },
  {
    driverName: 'Kazi Farhan',
    driverStudentId: '2354901021',
    driverDept: 'Economics (FASS)',
    driverPhone: '01688990011',
    driverRating: 4.8,
    driverReviews: 19,
    driverAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    transportationType: 'Motorbike',
    vehicleModel: 'Honda CB Hornet',
    totalSeats: 1
  },
  {
    driverName: 'Nabil Rahman',
    driverStudentId: '2154901009',
    driverDept: 'International Relations (FASS)',
    driverPhone: '01722334499',
    driverRating: 4.9,
    driverReviews: 22,
    driverAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    transportationType: 'Car',
    vehicleModel: 'Toyota Allion',
    totalSeats: 3
  },
  {
    driverName: 'Mahir Faysal',
    driverStudentId: '2354901044',
    driverDept: 'Public Administration',
    driverPhone: '01833445577',
    driverRating: 4.8,
    driverReviews: 16,
    driverAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80',
    transportationType: 'CNG',
    vehicleModel: 'Bajaj 4-Stroke CNG',
    totalSeats: 3
  }
];

// Key Hub Locations across Dhaka
const HUBS = [
  // ECB & Nearby (BUP Gateway)
  { name: 'ECB Chattar (Matikata Mor)', costCar: 30, costBike: 35, costCng: 25 },
  { name: 'ECB Chattar Bus Stand', costCar: 30, costBike: 35, costCng: 25 },
  { name: 'Matikata Bazar (Near ECB)', costCar: 30, costBike: 35, costCng: 25 },
  { name: 'Mirpur DOHS (Gate 1)', costCar: 25, costBike: 30, costCng: 20 },
  { name: 'Mirpur DOHS (Gate 2)', costCar: 25, costBike: 30, costCng: 20 },
  { name: 'Sagufta Mor (Mirpur DOHS bypass)', costCar: 30, costBike: 35, costCng: 25 },

  // Mirpur Areas
  { name: 'Mirpur 10 Circle (Metro Station)', costCar: 40, costBike: 50, costCng: 35 },
  { name: 'Mirpur 14 Bus Stand', costCar: 35, costBike: 40, costCng: 30 },
  { name: 'Mirpur 11 Bus Stand', costCar: 35, costBike: 40, costCng: 30 },
  { name: 'Mirpur 11.5 (Purobi Cinema)', costCar: 35, costBike: 45, costCng: 30 },
  { name: 'Mirpur 12 Bus Stand', costCar: 30, costBike: 40, costCng: 25 },
  { name: 'Mirpur 2 (Stadium Gate 2)', costCar: 45, costBike: 55, costCng: 40 },
  { name: 'Mirpur 1 (Sony Cinema Hall)', costCar: 45, costBike: 60, costCng: 40 },
  { name: 'Mirpur 6 (Kachabazar)', costCar: 45, costBike: 55, costCng: 40 },
  { name: 'Kazipara Metro Station', costCar: 45, costBike: 55, costCng: 40 },
  { name: 'Shewrapara Metro Station', costCar: 50, costBike: 60, costCng: 45 },
  { name: 'Agargaon (Taltola / Metro Station)', costCar: 55, costBike: 65, costCng: 50 },

  // Uttara & Airport
  { name: 'Uttara Sector 7 (House Building)', costCar: 70, costBike: 75, costCng: 60 },
  { name: 'Uttara Sector 3 (Rajlakshmi)', costCar: 65, costBike: 75, costCng: 60 },
  { name: 'Uttara Jasimuddin Mor', costCar: 65, costBike: 70, costCng: 55 },
  { name: 'Uttara Azampur Bus Stand', costCar: 70, costBike: 80, costCng: 65 },
  { name: 'Uttara Sector 10 (Chowrasta)', costCar: 75, costBike: 85, costCng: 70 },
  { name: 'Uttara Sector 11 (Kachabazar)', costCar: 70, costBike: 80, costCng: 65 },
  { name: 'Airport (Haj Camp / Station)', costCar: 60, costBike: 65, costCng: 55 },
  { name: 'Khilkhet (Footbridge)', costCar: 50, costBike: 55, costCng: 45 },

  // Dhanmondi & Surrounds
  { name: 'Dhanmondi 27 (Rapa Plaza)', costCar: 75, costBike: 85, costCng: 70 },
  { name: 'Dhanmondi 32 (Lake bridge)', costCar: 80, costBike: 90, costCng: 70 },
  { name: 'Dhanmondi (Jigatola Bus Stand)', costCar: 85, costBike: 95, costCng: 75 },
  { name: 'Science Lab Mor', costCar: 80, costBike: 90, costCng: 70 },
  { name: 'Kalabagan (Bus Stand)', costCar: 75, costBike: 85, costCng: 70 },
  { name: 'Shankar Bus Stand', costCar: 80, costBike: 90, costCng: 70 },
  { name: 'Asad Gate (Mohammadpur)', costCar: 65, costBike: 75, costCng: 60 },
  { name: 'Mohammadpur Bus Stand (Town Hall)', costCar: 65, costBike: 75, costCng: 60 },

  // Mohakhali & Central
  { name: 'Mohakhali (Amtoli / DOHS Gate)', costCar: 55, costBike: 65, costCng: 50 },
  { name: 'Mohakhali (Wireless Gate)', costCar: 60, costBike: 70, costCng: 55 },
  { name: 'Farmgate (Ananda Cinema)', costCar: 65, costBike: 75, costCng: 60 },
  { name: 'Bijoy Sarani (Rangs Bhaban)', costCar: 60, costBike: 70, costCng: 55 },

  // Banani, Gulshan & Bashundhara
  { name: 'Banani (Kemal Ataturk / Star Kabab)', costCar: 55, costBike: 65, costCng: 50 },
  { name: 'Banani (Chairman Bari)', costCar: 50, costBike: 60, costCng: 45 },
  { name: 'Gulshan 1 (Circle)', costCar: 65, costBike: 75, costCng: 60 },
  { name: 'Gulshan 2 (Circle)', costCar: 65, costBike: 75, costCng: 60 },
  { name: 'Bashundhara R/A (Main Gate)', costCar: 55, costBike: 65, costCng: 50 },
  { name: 'Kuril Flyover (Bishwa Road)', costCar: 45, costBike: 50, costCng: 40 },
  { name: 'Jamuna Future Park (Main Gate)', costCar: 50, costBike: 55, costCng: 45 },

  // Savar, Gazipur & Outskirts
  { name: 'Savar Cantonment (Sena Auditorium)', costCar: 90, costBike: 110, costCng: 85 },
  { name: 'Savar Bazar Bus Stand', costCar: 95, costBike: 115, costCng: 90 },
  { name: 'Jahangirnagar University (Main Gate)', costCar: 100, costBike: 120, costCng: 95 },
  { name: 'Nabinagar Smrity Soudho', costCar: 110, costBike: 130, costCng: 100 },
  { name: 'Hemayetpur Bus Stand', costCar: 85, costBike: 95, costCng: 75 },
  { name: 'Gabtoli Inter-District Bus Terminal', costCar: 55, costBike: 65, costCng: 50 },
  { name: 'Gazipur Chowrasta', costCar: 100, costBike: 120, costCng: 90 },
  { name: 'Gazipur Boardbazar', costCar: 90, costBike: 110, costCng: 80 },
  { name: 'Tongi Station Road', costCar: 80, costBike: 90, costCng: 75 }
];

const MORNING_TIMES = ['07:15 AM', '07:30 AM', '07:45 AM', '08:00 AM', '08:15 AM', '08:30 AM', '09:00 AM', '09:45 AM'];
const AFTERNOON_TIMES = ['01:30 PM', '02:15 PM', '03:15 PM', '03:45 PM', '04:15 PM', '04:30 PM', '05:00 PM', '05:30 PM'];

// Helper to get formatted date YYYY-MM-DD
function getRelativeDate(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

async function populateRides() {
  console.log('🚀 Generating 200+ rich BUP rides...');

  const ridesPath = path.join(__dirname, '..', 'database', 'nosql_data', 'rides.json');
  let existingRides = [];
  try {
    existingRides = JSON.parse(fs.readFileSync(ridesPath, 'utf8') || '[]');
  } catch (e) {
    existingRides = [];
  }

  const generatedRides = [...existingRides];
  const existingKeys = new Set(existingRides.map(r => `${r.startingLocation}|${r.destination}|${r.travelDate}|${r.departureTime}`));

  // Generate to_bup rides and return rides across 6 dates (today to +5 days)
  let rideCounter = existingRides.length;

  for (let dayOffset = 0; dayOffset <= 5; dayOffset++) {
    const travelDate = getRelativeDate(dayOffset);

    // 1. Rides TO BUP Campus
    for (let i = 0; i < HUBS.length; i++) {
      const hub = HUBS[i];
      const driver = DRIVERS[(i + dayOffset) % DRIVERS.length];
      const depTime = MORNING_TIMES[(i + dayOffset) % MORNING_TIMES.length];

      const key = `${hub.name}|BUP Campus (Main Gate)|${travelDate}|${depTime}`;
      if (!existingKeys.has(key)) {
        existingKeys.add(key);
        const cost = driver.transportationType === 'Car' ? hub.costCar :
                     driver.transportationType === 'Motorbike' ? hub.costBike : hub.costCng;

        const totalSeats = driver.totalSeats;
        const availableSeats = Math.max(1, totalSeats - ((i + dayOffset) % 2));

        generatedRides.push({
          _id: new mongoose.Types.ObjectId().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          driverId: 'driver_' + ((i % DRIVERS.length) + 1),
          driverName: driver.driverName,
          driverStudentId: driver.driverStudentId,
          driverDept: driver.driverDept,
          driverPhone: driver.driverPhone,
          driverAvatar: driver.driverAvatar,
          driverRating: driver.driverRating,
          driverReviews: driver.driverReviews + (i % 5),
          tripType: 'to_bup',
          startingLocation: hub.name,
          destination: 'BUP Campus (Main Gate)',
          travelDate: travelDate,
          departureTime: depTime,
          totalSeats: totalSeats,
          availableSeats: availableSeats,
          transportationType: driver.transportationType,
          vehicleModel: driver.vehicleModel,
          estimatedCost: cost,
          status: 'active',
          additionalInfo: `Morning commute to BUP from ${hub.name}. Punctual departure. BUP students only.`
        });
      }
    }

    // 2. Return Rides FROM BUP Campus
    for (let i = 0; i < HUBS.length; i++) {
      const hub = HUBS[i];
      const driver = DRIVERS[(i + dayOffset + 2) % DRIVERS.length];
      const depTime = AFTERNOON_TIMES[(i + dayOffset) % AFTERNOON_TIMES.length];

      const key = `BUP Campus (Main Gate)|${hub.name}|${travelDate}|${depTime}`;
      if (!existingKeys.has(key)) {
        existingKeys.add(key);
        const cost = driver.transportationType === 'Car' ? hub.costCar :
                     driver.transportationType === 'Motorbike' ? hub.costBike : hub.costCng;

        const totalSeats = driver.totalSeats;
        const availableSeats = Math.max(1, totalSeats - ((i % 2)));

        generatedRides.push({
          _id: new mongoose.Types.ObjectId().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          driverId: 'driver_' + (((i + 2) % DRIVERS.length) + 1),
          driverName: driver.driverName,
          driverStudentId: driver.driverStudentId,
          driverDept: driver.driverDept,
          driverPhone: driver.driverPhone,
          driverAvatar: driver.driverAvatar,
          driverRating: driver.driverRating,
          driverReviews: driver.driverReviews + (i % 3),
          tripType: 'return',
          startingLocation: 'BUP Campus (Main Gate)',
          destination: hub.name,
          travelDate: travelDate,
          departureTime: depTime,
          totalSeats: totalSeats,
          availableSeats: availableSeats,
          transportationType: driver.transportationType,
          vehicleModel: driver.vehicleModel,
          estimatedCost: cost,
          status: 'active',
          additionalInfo: `Afternoon return trip from BUP Campus dropping off at ${hub.name}.`
        });
      }
    }

    if (generatedRides.length >= 225) break;
  }

  console.log(`✓ Total Rides Generated: ${generatedRides.length}`);

  // 1. Save to database/nosql_data/rides.json
  fs.writeFileSync(ridesPath, JSON.stringify(generatedRides, null, 2), 'utf-8');
  console.log(`✓ Saved ${generatedRides.length} rides to database/nosql_data/rides.json`);

  // 2. Update live MongoDB database
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bupgo';
  try {
    console.log(`Connecting to MongoDB at: ${mongoUri}...`);
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    const ridesCol = mongoose.connection.db.collection('rides');

    // Upsert rides into MongoDB by startingLocation + destination + travelDate + departureTime
    let mongoInserted = 0;
    for (const r of generatedRides) {
      const exists = await ridesCol.findOne({
        startingLocation: r.startingLocation,
        destination: r.destination,
        travelDate: r.travelDate,
        departureTime: r.departureTime
      });

      if (!exists) {
        await ridesCol.insertOne({
          ...r,
          _id: mongoose.Types.ObjectId.isValid(r._id) ? new mongoose.Types.ObjectId(r._id) : new mongoose.Types.ObjectId()
        });
        mongoInserted++;
      }
    }

    const totalMongoRides = await ridesCol.countDocuments();
    console.log(`✓ Live MongoDB 'bupgo' updated! Total rides in MongoDB: ${totalMongoRides} (+${mongoInserted} newly inserted).`);
    await mongoose.disconnect();
  } catch (err) {
    console.warn(`⚠️ MongoDB sync notice: ${err.message}`);
  }

  console.log('🎉 200+ Rides successfully populated into JSON and MongoDB!');
}

populateRides().catch(console.error);
