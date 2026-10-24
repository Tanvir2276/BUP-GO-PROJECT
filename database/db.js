/**
 * BUPGO - NoSQL Database Adapter
 * Seamlessly connects to MongoDB (via Mongoose) when available,
 * with automatic sync, schema normalization, and zero-config JSON NoSQL fallback.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');

const os = require('os');

let DATA_DIR = path.join(__dirname, 'nosql_data');
// Support serverless platforms like Vercel where root filesystem is read-only
try {
  if (process.env.VERCEL) {
    const tmpDir = path.join(os.tmpdir(), 'bupgo_data');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const originalDir = path.join(__dirname, 'nosql_data');
    if (fs.existsSync(originalDir)) {
      for (const file of fs.readdirSync(originalDir)) {
        try {
          fs.copyFileSync(path.join(originalDir, file), path.join(tmpDir, file));
        } catch (e) {}
      }
    }
    DATA_DIR = tmpDir;
  } else if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('Using default data directory:', e.message);
  DATA_DIR = path.join(__dirname, 'nosql_data');
}

let dbMode = 'nosql_json_store'; // 'mongodb' or 'nosql_json_store'

/* =========================================================
   1. MONGOOSE SCHEMAS & MODELS (Strict: false for full NoSQL agility)
   ========================================================= */

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  studentId: { type: String, required: true, index: true },
  email: { type: String, required: true, index: true },
  phone: { type: String, default: '' },
  department: { type: String, default: '' },
  batch: { type: String, default: '' },
  session: { type: String, default: '' },
  role: { type: String, default: 'passenger' },
  rating: { type: Number, default: 5.0 },
  totalReviews: { type: Number, default: 0 },
  password: { type: String },
  passwordHash: { type: String },
  vehicleType: { type: String, default: '' },
  vehicleModel: { type: String, default: '' },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '' }
}, { timestamps: true, strict: false });

const RideSchema = new mongoose.Schema({
  driverId: { type: mongoose.Schema.Types.Mixed, index: true },
  driverName: { type: String, default: '' },
  driverStudentId: { type: String, default: '' },
  driverDept: { type: String, default: '' },
  driverPhone: { type: String, default: '' },
  driverAvatar: { type: String, default: '' },
  driverRating: { type: Number, default: 5.0 },
  driverReviews: { type: Number, default: 0 },
  tripType: { type: String, default: 'to_bup' },
  startingLocation: { type: String },
  startLocation: { type: String },
  destination: { type: String },
  travelDate: { type: String },
  departureTime: { type: String },
  totalSeats: { type: Number },
  seatsOffered: { type: Number },
  availableSeats: { type: Number },
  seatsRemaining: { type: Number },
  transportationType: { type: String, default: 'Car' },
  transportType: { type: String },
  vehicleModel: { type: String, default: '' },
  estimatedCost: { type: Number, default: 0 },
  fareSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
  status: { type: String, default: 'active', index: true },
  additionalInfo: { type: String, default: '' },
  notes: { type: String }
}, { timestamps: true, strict: false });

const RequestSchema = new mongoose.Schema({
  rideId: { type: mongoose.Schema.Types.Mixed, required: true, index: true },
  riderId: { type: mongoose.Schema.Types.Mixed, required: true, index: true },
  riderName: { type: String, required: true },
  riderStudentId: { type: String, default: '' },
  riderDept: { type: String, default: '' },
  riderPhone: { type: String, default: '' },
  seatsRequested: { type: Number, default: 1 },
  pickupLocation: { type: String, default: '' },
  notes: { type: String, default: '' },
  status: { type: String, default: 'pending', index: true }
}, { timestamps: true, strict: false });

const NotificationSchema = new mongoose.Schema({
  recipientId: { type: String, default: 'all', index: true },
  targetUserId: { type: String, default: 'all', index: true },
  type: { type: String, default: 'general' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  rideId: { type: mongoose.Schema.Types.Mixed, default: '' },
  read: { type: Boolean, default: false }
}, { timestamps: true, strict: false });

const FareConfigSchema = new mongoose.Schema({
  vehicleType: { type: String, required: true, index: true }, // 'Bike', 'Car', 'CNG'
  vehicleDisplayName: { type: String, default: '' },
  city: { type: String, default: 'nationwide', index: true },
  baseFare: { type: Number, required: true, default: 0 },
  perKmRate: { type: Number, required: true, default: 0 },
  waitingChargePerMin: { type: Number, required: true, default: 0 },
  freeWaitingMinutes: { type: Number, default: 3 },
  isActive: { type: Boolean, default: true },
  updatedBy: { type: String, default: 'admin' }
}, { timestamps: true, strict: false });

const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
const RideModel = mongoose.models.Ride || mongoose.model('Ride', RideSchema);
const RequestModel = mongoose.models.Request || mongoose.model('Request', RequestSchema);
const NotificationModel = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
const FareConfigModel = mongoose.models.FareConfig || mongoose.model('FareConfig', FareConfigSchema);

// Normalize document to ensure consistent string _id and field compatibility
function normalizeDoc(doc) {
  if (!doc) return null;
  const item = { ...doc };
  if (item._id) {
    item._id = String(item._id);
  }

  // User normalization
  if (item.passwordHash && !item.password) {
    item.password = item.passwordHash;
  }

  // Ride normalization
  if (!item.startingLocation && item.startLocation) {
    item.startingLocation = item.startLocation;
  }
  if (item.availableSeats === undefined && item.seatsRemaining !== undefined) {
    item.availableSeats = item.seatsRemaining;
  }
  if (!item.totalSeats && item.seatsOffered) {
    item.totalSeats = item.seatsOffered;
  }
  if (!item.transportationType && item.transportType) {
    item.transportationType = item.transportType;
  }
  if (!item.driverName && item.offeredByStudentId) {
    item.driverStudentId = item.offeredByStudentId;
    item.driverName = 'BUP Student (' + item.offeredByStudentId + ')';
  }
  if (item.status === 'open') {
    item.status = 'active';
  }

  return item;
}

// Convert string / objectId query fields for cross-compatibility
function normalizeFilter(filter = {}) {
  const q = { ...filter };

  // Allow flexible matching for foreign keys (string vs ObjectId)
  for (const field of ['rideId', 'riderId', 'driverId']) {
    if (q[field] && typeof q[field] === 'string' && mongoose.Types.ObjectId.isValid(q[field])) {
      const strVal = String(q[field]);
      const objVal = new mongoose.Types.ObjectId(strVal);
      q[field] = { $in: [strVal, objVal] };
    }
  }

  return q;
}

/* =========================================================
   2. EMBEDDED JSON NOSQL COLLECTION (Zero-config Fallback)
   ========================================================= */

class NoSQLCollection {
  constructor(name) {
    this.name = name;
    this.filePath = path.join(DATA_DIR, `${name}.json`);
    this.memoryData = null;
    try {
      if (!fs.existsSync(this.filePath)) {
        fs.writeFileSync(this.filePath, JSON.stringify([], null, 2), 'utf-8');
      }
    } catch (e) {
      this.memoryData = [];
    }
  }

  _read() {
    if (this.memoryData && this.memoryData.length > 0) return this.memoryData;
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw || '[]');
        if (parsed.length > 0) return parsed;
      }
      const fallbackPath = path.join(__dirname, 'nosql_data', `${this.name}.json`);
      if (fs.existsSync(fallbackPath)) {
        const raw = fs.readFileSync(fallbackPath, 'utf-8');
        return JSON.parse(raw || '[]');
      }
      return this.memoryData || [];
    } catch (err) {
      return this.memoryData || [];
    }
  }

  _write(data) {
    this.memoryData = data;
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      // In serverless read-only filesystem, gracefully retained in memory
    }
  }

  _matches(doc, filter) {
    if (!filter || Object.keys(filter).length === 0) return true;
    for (const key of Object.keys(filter)) {
      const filterVal = filter[key];
      const docVal = doc[key];

      if (key === '$or' && Array.isArray(filterVal)) {
        const matchesAny = filterVal.some(subFilter => this._matches(doc, subFilter));
        if (!matchesAny) return false;
        continue;
      }

      if (filterVal && typeof filterVal === 'object') {
        if ('$exists' in filterVal) {
          const exists = docVal !== undefined && docVal !== null;
          if (exists !== filterVal.$exists) return false;
          continue;
        }
        if ('$regex' in filterVal) {
          const regex = new RegExp(filterVal.$regex, filterVal.$options || 'i');
          if (!regex.test(String(docVal || ''))) return false;
          continue;
        }
        if ('$in' in filterVal && Array.isArray(filterVal.$in)) {
          const inStrs = filterVal.$in.map(v => String(v));
          if (!inStrs.includes(String(docVal))) return false;
          continue;
        }
        if ('$gte' in filterVal && Number(docVal) < Number(filterVal.$gte)) return false;
        if ('$lte' in filterVal && Number(docVal) > Number(filterVal.$lte)) return false;
        if ('$ne' in filterVal && docVal === filterVal.$ne) return false;
      } else {
        if (String(docVal) !== String(filterVal)) return false;
      }
    }
    return true;
  }

  async find(filter = {}) {
    const data = this._read();
    return data.filter(doc => this._matches(doc, filter)).map(normalizeDoc);
  }

  async findOne(filter = {}) {
    const data = this._read();
    const doc = data.find(doc => this._matches(doc, filter));
    return normalizeDoc(doc);
  }

  async findById(id) {
    const data = this._read();
    const doc = data.find(doc => String(doc._id) === String(id));
    return normalizeDoc(doc);
  }

  async create(doc) {
    const data = this._read();
    const newDoc = {
      _id: doc._id || crypto.randomBytes(12).toString('hex'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...doc
    };
    data.unshift(newDoc);
    this._write(data);
    return normalizeDoc(newDoc);
  }

  async insertMany(docs) {
    const data = this._read();
    const inserted = docs.map(doc => ({
      _id: doc._id || crypto.randomBytes(12).toString('hex'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...doc
    }));
    data.push(...inserted);
    this._write(data);
    return inserted.map(normalizeDoc);
  }

  async findByIdAndUpdate(id, update = {}, options = {}) {
    const data = this._read();
    const idx = data.findIndex(doc => String(doc._id) === String(id));
    if (idx === -1) return null;

    let payload = update;
    if (update.$set) {
      payload = update.$set;
    }

    data[idx] = {
      ...data[idx],
      ...payload,
      updatedAt: new Date().toISOString()
    };
    this._write(data);
    return normalizeDoc(data[idx]);
  }

  async findByIdAndDelete(id) {
    const data = this._read();
    const idx = data.findIndex(doc => String(doc._id) === String(id));
    if (idx === -1) return null;
    const [deleted] = data.splice(idx, 1);
    this._write(data);
    return normalizeDoc(deleted);
  }

  async deleteOne(filter) {
    const data = this._read();
    const idx = data.findIndex(doc => this._matches(doc, filter));
    if (idx === -1) return { deletedCount: 0 };
    data.splice(idx, 1);
    this._write(data);
    return { deletedCount: 1 };
  }

  async countDocuments(filter = {}) {
    const items = await this.find(filter);
    return items.length;
  }
}

/* =========================================================
   3. DUAL-MODE COLLECTION PROXY (MongoDB + JSON Fallback)
   ========================================================= */

class DualCollection {
  constructor(name, mongooseModel, jsonCollection) {
    this.name = name;
    this.model = mongooseModel;
    this.jsonCol = jsonCollection;
  }

  get isMongo() {
    return dbMode === 'mongodb' && mongoose.connection.readyState === 1;
  }

  async find(filter = {}) {
    if (this.isMongo) {
      const q = normalizeFilter(filter);
      const docs = await this.model.find(q).lean();
      return docs.map(normalizeDoc);
    }
    return await this.jsonCol.find(filter);
  }

  async findOne(filter = {}) {
    if (this.isMongo) {
      const q = normalizeFilter(filter);
      const doc = await this.model.findOne(q).lean();
      return normalizeDoc(doc);
    }
    return await this.jsonCol.findOne(filter);
  }

  async findById(id) {
    if (this.isMongo) {
      let doc = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        doc = await this.model.findById(id).lean();
      }
      if (!doc) {
        doc = await this.model.findOne({ _id: String(id) }).lean();
      }
      return normalizeDoc(doc);
    }
    return await this.jsonCol.findById(id);
  }

  async create(doc) {
    if (this.isMongo) {
      const payload = { ...doc };
      if (payload._id && mongoose.Types.ObjectId.isValid(payload._id)) {
        payload._id = new mongoose.Types.ObjectId(payload._id);
      }
      const created = await this.model.create(payload);
      const plain = created.toObject ? created.toObject() : created;
      const normalized = normalizeDoc(plain);
      try {
        await this.jsonCol.create({ ...normalized });
      } catch (e) {
        // Safe ignore
      }
      return normalized;
    }
    return await this.jsonCol.create(doc);
  }

  async insertMany(docs) {
    if (this.isMongo) {
      const payloads = docs.map(d => {
        const p = { ...d };
        if (p._id && mongoose.Types.ObjectId.isValid(p._id)) {
          p._id = new mongoose.Types.ObjectId(p._id);
        }
        return p;
      });
      const inserted = await this.model.insertMany(payloads);
      const normalized = inserted.map(d => normalizeDoc(d.toObject ? d.toObject() : d));
      try {
        await this.jsonCol.insertMany(normalized);
      } catch (e) {}
      return normalized;
    }
    return await this.jsonCol.insertMany(docs);
  }

  async findByIdAndUpdate(id, update = {}, options = {}) {
    let result = null;
    if (this.isMongo) {
      const updatePayload = update.$set ? update : { $set: update };
      const opts = { returnDocument: 'after', ...options };
      let updated = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        updated = await this.model.findByIdAndUpdate(id, updatePayload, opts).lean();
      }
      if (!updated) {
        updated = await this.model.findOneAndUpdate({ _id: String(id) }, updatePayload, opts).lean();
      }
      result = normalizeDoc(updated);
    }
    try {
      const jsonRes = await this.jsonCol.findByIdAndUpdate(id, update, options);
      if (!result) result = jsonRes;
    } catch (e) {}
    return result;
  }

  async findByIdAndDelete(id) {
    let result = null;
    if (this.isMongo) {
      let deleted = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        deleted = await this.model.findByIdAndDelete(id).lean();
      }
      if (!deleted) {
        deleted = await this.model.findOneAndDelete({ _id: String(id) }).lean();
      }
      result = normalizeDoc(deleted);
    }
    try {
      const jsonDel = await this.jsonCol.findByIdAndDelete(id);
      if (!result) result = jsonDel;
    } catch (e) {}
    return result;
  }

  async deleteOne(filter) {
    if (this.isMongo) {
      const q = normalizeFilter(filter);
      return await this.model.deleteOne(q);
    }
    return await this.jsonCol.deleteOne(filter);
  }

  async countDocuments(filter = {}) {
    if (this.isMongo) {
      const q = normalizeFilter(filter);
      return await this.model.countDocuments(q);
    }
    return await this.jsonCol.countDocuments(filter);
  }
}

// Low-level JSON collections
const rawUsersJson = new NoSQLCollection('users');
const rawRidesJson = new NoSQLCollection('rides');
const rawRequestsJson = new NoSQLCollection('requests');
const rawNotificationsJson = new NoSQLCollection('notifications');
const rawFareConfigsJson = new NoSQLCollection('fare_configs');

// Dual-mode exported collections
const Users = new DualCollection('users', UserModel, rawUsersJson);
const Rides = new DualCollection('rides', RideModel, rawRidesJson);
const Requests = new DualCollection('requests', RequestModel, rawRequestsJson);
const Notifications = new DualCollection('notifications', NotificationModel, rawNotificationsJson);
const FareConfigs = new DualCollection('fare_configs', FareConfigModel, rawFareConfigsJson);

/* =========================================================
   4. DATA SYNC (JSON Files -> MongoDB Database)
   ========================================================= */

async function syncDataToMongoDB() {
  try {
    // 1. Sync Users
    const jsonUsers = rawUsersJson._read();
    for (const u of jsonUsers) {
      const exists = await UserModel.findOne({
        $or: [
          { studentId: u.studentId },
          { email: u.email }
        ]
      });
      if (!exists) {
        await UserModel.create({
          ...u,
          _id: mongoose.Types.ObjectId.isValid(u._id) ? new mongoose.Types.ObjectId(u._id) : undefined
        });
        console.log(`  + Synced student account to MongoDB: ${u.name} (${u.studentId})`);
      }
    }

    // 2. Sync Rides
    const jsonRides = rawRidesJson._read();
    for (const r of jsonRides) {
      let exists = null;
      if (mongoose.Types.ObjectId.isValid(r._id)) {
        exists = await RideModel.findById(r._id);
      }
      if (!exists) {
        await RideModel.create({
          ...r,
          _id: mongoose.Types.ObjectId.isValid(r._id) ? new mongoose.Types.ObjectId(r._id) : undefined
        });
      }
    }

    // 3. Sync Requests
    const jsonReqs = rawRequestsJson._read();
    for (const req of jsonReqs) {
      let exists = null;
      if (mongoose.Types.ObjectId.isValid(req._id)) {
        exists = await RequestModel.findById(req._id);
      }
      if (!exists) {
        await RequestModel.create({
          ...req,
          _id: mongoose.Types.ObjectId.isValid(req._id) ? new mongoose.Types.ObjectId(req._id) : undefined
        });
      }
    }

    // 4. Sync Notifications
    const jsonNotifs = rawNotificationsJson._read();
    for (const n of jsonNotifs) {
      let exists = null;
      if (mongoose.Types.ObjectId.isValid(n._id)) {
        exists = await NotificationModel.findById(n._id);
      }
      if (!exists) {
        await NotificationModel.create({
          ...n,
          _id: mongoose.Types.ObjectId.isValid(n._id) ? new mongoose.Types.ObjectId(n._id) : undefined
        });
      }
    }

    // 5. Sync Fare Configurations
    const jsonFares = rawFareConfigsJson._read();
    for (const fc of jsonFares) {
      const exists = await FareConfigModel.findOne({
        vehicleType: fc.vehicleType,
        city: fc.city || 'nationwide'
      });
      if (!exists) {
        await FareConfigModel.create({
          ...fc,
          _id: mongoose.Types.ObjectId.isValid(fc._id) ? new mongoose.Types.ObjectId(fc._id) : undefined
        });
      }
    }
  } catch (err) {
    console.warn('⚠️ MongoDB data sync notice:', err.message);
  }
}

/* =========================================================
   5. DATABASE INITIALIZER & STATUS
   ========================================================= */

async function initDatabase() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bupgo';

  try {
    console.log(`Connecting to MongoDB at: ${mongoUri}...`);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000
    });
    dbMode = 'mongodb';
    console.log('✓ Successfully connected to live MongoDB server!');

    // Synchronize latest accounts & rides into MongoDB
    await syncDataToMongoDB();

    const currentUsers = await UserModel.countDocuments();
    const currentRides = await RideModel.countDocuments();
    console.log(`✓ Live MongoDB database 'bupgo' ready (${currentUsers} Users, ${currentRides} Rides).`);
    return { mode: 'mongodb', uri: mongoUri };
  } catch (err) {
    console.log(`MongoDB connection not established (${err.message}).`);
    console.log('✓ Seamlessly running on Embedded NoSQL Document Store (JSON storage in /database/nosql_data/).');
    dbMode = 'nosql_json_store';
    return { mode: 'nosql_json_store' };
  }
}

function getDbStatus() {
  const isMongoLive = dbMode === 'mongodb' && mongoose.connection.readyState === 1;
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bupgo';

  return {
    mode: isMongoLive ? 'mongodb' : 'nosql_json_store',
    engine: isMongoLive ? 'MongoDB NoSQL Database Server' : 'Embedded NoSQL Document Store',
    uri: isMongoLive ? mongoUri : 'Internal JSON Store',
    location: isMongoLive ? 'Localhost MongoDB (Port 27017)' : DATA_DIR,
    connected: true,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  initDatabase,
  getDbStatus,
  Users,
  Rides,
  Requests,
  Notifications,
  FareConfigs,
  UserModel,
  RideModel,
  RequestModel,
  NotificationModel,
  FareConfigModel
};
