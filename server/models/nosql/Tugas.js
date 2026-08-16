// server/models/nosql/Tugas.js
import { Schema, model } from 'mongoose';

const TugasSchema = new Schema({
  // THE LINK TO SQL:
  pertemuan_id: { 
    type: Number, // SQL IDs are numbers (BigInt), so Number works here
    required: true, 
    index: true 
  },
  
  judul: { type: String, required: true },
  deskripsi: { type: String },
  tenggat_waktu: { type: Date, required: true }, // Deadline
  
  // Attachments can be an array of objects
  attachments: [{
    filename: String,
    path: String,
    mimetype: String,
    size: Number
  }],

  created_by: { type: Number, required: true }, // Store the Asdos User ID
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } 
});

export default model('Tugas', TugasSchema);