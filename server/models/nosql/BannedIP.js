// server/models/nosql/BannedIP.js
import { Schema, model } from 'mongoose';

const BannedIPSchema = new Schema({
  ip_address: { type: String, required: true, unique: true, index: true },
  reason: { type: String, default: 'Dilarang oleh Administrator' },
  banned_by: { type: Number }, // Admin User ID
  banned_by_name: { type: String, default: 'Administrator' },
  banned_at: { type: Date, default: Date.now },
  expires_at: { type: Date, default: null }, // null means permanent ban
  is_permanent: { type: Boolean, default: false }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const BannedIP = model('BannedIP', BannedIPSchema);

export default BannedIP;