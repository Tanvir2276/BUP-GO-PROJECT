require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { initDatabase, Users, Rides, Requests, FareConfigs, getDbStatus } = require('./database/db');
const { calculateAuthoritativeFare, DEFAULT_RATES } = require('./services/fareService');

async function runTests() {
  console.log('🧪 Starting BUPGO Automated Test Suite...');
  await initDatabase();

  const status = getDbStatus();
  console.log(`✓ Database Status: [${status.engine}] Mode: ${status.mode}`);

  // Test 1: Query Users
  const users = await Users.find({});
  console.log(`✓ Users in NoSQL Database: ${users.length}`);
  if (users.length === 0) throw new Error('No users found in database');

  const tanvir = await Users.findOne({ studentId: '2254901076' });
  if (!tanvir) throw new Error('Munshi Tanvir Hossain not found');
  console.log(`✓ Found Student: ${tanvir.name} (${tanvir.studentId}) - ${tanvir.department}`);

  // Test 2: Auth Password Check
  const valid = await bcrypt.compare('bup12345', tanvir.password);
  if (!valid) throw new Error('Password hash comparison failed');
  console.log('✓ Password verification succeeded for student account');

  // Test 3: Query Rides
  const rides = await Rides.find({ status: 'active' });
  console.log(`✓ Active rides available: ${rides.length}`);
  if (rides.length === 0) throw new Error('No active rides found');

  // Test 4: Dynamic Fare Calculation & Central Rates
  console.log('--- Testing Dynamic Ride Fare Calculation System ---');
  const configs = await FareConfigs.find({ isActive: true });
  console.log(`✓ Central Fare Configurations in MongoDB: ${configs.length}`);
  if (configs.length < 3) throw new Error('Expected at least 3 vehicle fare configs (Bike, Car, CNG)');

  // Verify Bike: Base ৳20, ৳12/km, ৳0.50/min, 3 min free
  const bikeFare = await calculateAuthoritativeFare({
    vehicleType: 'Bike',
    distanceKm: 10,
    waitingMinutes: 7 // 7 mins total -> 4 mins chargeable (3 free)
  });
  // Expected: 20 + (10 * 12) + (4 * 0.5) = 20 + 120 + 2 = 142
  console.log(`✓ Bike Fare (10km, 7m wait): ৳${bikeFare.totalFare} [Formula: ${bikeFare.breakdown.formula}]`);
  if (bikeFare.totalFare !== 142) {
    throw new Error(`Bike fare expected 142 but got ${bikeFare.totalFare}`);
  }

  // Verify Car: Base ৳50, ৳20/km, ৳1.50/min, 3 min free
  const carFare = await calculateAuthoritativeFare({
    vehicleType: 'Car',
    distanceKm: 5,
    waitingMinutes: 3 // exactly 3 mins -> 0 chargeable
  });
  // Expected: 50 + (5 * 20) + (0 * 1.5) = 150
  console.log(`✓ Car Fare (5km, 3m free wait): ৳${carFare.totalFare} [Formula: ${carFare.breakdown.formula}]`);
  if (carFare.totalFare !== 150) {
    throw new Error(`Car fare expected 150 but got ${carFare.totalFare}`);
  }

  // Verify CNG: Base ৳40, ৳14/km, ৳1.00/min, 3 min free
  const cngFare = await calculateAuthoritativeFare({
    vehicleType: 'CNG',
    distanceKm: 8,
    waitingMinutes: 5 // 2 mins chargeable
  });
  // Expected: 40 + (8 * 14) + (2 * 1) = 40 + 112 + 2 = 154
  console.log(`✓ CNG Fare (8km, 5m wait): ৳${cngFare.totalFare} [Formula: ${cngFare.breakdown.formula}]`);
  if (cngFare.totalFare !== 154) {
    throw new Error(`CNG fare expected 154 but got ${cngFare.totalFare}`);
  }

  // Test 5: Admin Update Fare Rate & Verification
  const carConfig = await FareConfigs.findOne({ vehicleType: 'Car', city: 'nationwide' });
  const originalCarBase = carConfig.baseFare;
  await FareConfigs.findByIdAndUpdate(carConfig._id, { baseFare: 55 });
  const updatedCarFare = await calculateAuthoritativeFare({
    vehicleType: 'Car',
    distanceKm: 5,
    waitingMinutes: 3
  });
  // Now should be 55 + (5 * 20) = 155
  console.log(`✓ Admin Update Verified: Car Fare updated to ৳${updatedCarFare.totalFare} (Base was ৳${originalCarBase}, now ৳55)`);
  if (updatedCarFare.totalFare !== 155) {
    throw new Error(`Admin update verification failed, got ${updatedCarFare.totalFare}`);
  }
  // Restore original rate
  await FareConfigs.findByIdAndUpdate(carConfig._id, { baseFare: originalCarBase });
  console.log(`✓ Restored Car Base Fare to specification default ৳${originalCarBase}`);

  // Test 6: Simulate Ride Booking & Seat Management with Fare Snapshot
  const targetRide = rides[0];
  const initialSeats = targetRide.availableSeats;
  console.log(`✓ Testing Ride [${targetRide.startingLocation} ➔ ${targetRide.destination}] with ${initialSeats} available seats`);

  // Create request
  const testReq = await Requests.create({
    rideId: targetRide._id,
    riderId: 'test_rider_id',
    riderName: 'Test Student',
    riderStudentId: '2254909999',
    seatsRequested: 1,
    fareSnapshot: carFare,
    totalEstimatedPrice: carFare.totalFare,
    status: 'pending'
  });
  console.log(`✓ Created test ride request with fare snapshot: ID ${testReq._id} (Status: ${testReq.status})`);

  // Driver accepts request
  await Requests.findByIdAndUpdate(testReq._id, { status: 'accepted' });
  await Rides.findByIdAndUpdate(targetRide._id, { availableSeats: initialSeats - 1 });

  const updatedRide = await Rides.findById(targetRide._id);
  console.log(`✓ Seat booked successfully. New available seats: ${updatedRide.availableSeats} (was ${initialSeats})`);

  // Cleanup test request & restore seats
  await Requests.findByIdAndDelete(testReq._id);
  await Rides.findByIdAndUpdate(targetRide._id, { availableSeats: initialSeats });
  console.log('✓ Test cleanup complete.');

  console.log('🎉 ALL BUPGO TEST SUITES PASSED CLEANLY (100%)!');
  if (mongoose.connection.readyState === 1) await mongoose.disconnect();
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
