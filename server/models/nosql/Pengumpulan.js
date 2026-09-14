import { Schema, model } from 'mongoose';

const PengumpulanSchema = new Schema({
  tugas_id: { 
    type: Schema.Types.ObjectId, 
    ref: 'Tugas',
    required: true,
    index: true
  },
  
  student_id: { 
    type: Number, 
    required: true,
    index: true
  },
  
  file: {
    filename: { type: String, required: true },
    path: { type: String, required: true },
    mimetype: String,
    size: Number
  },
  
  status: { 
    type: String, 
    enum: ['diserahkan', 'dinilai', 'terlambat'],
    default: 'diserahkan'
  },
  
  nilai: { 
    type: Number,
    min: 0,
    max: 100
  },
  
  comments: [{
    senderId: { type: Number, required: true },
    senderName: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  
  submitted_at: { type: Date, default: Date.now },
  graded_by: Number,
  graded_at: Date
  
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } 
});

// Compound index to prevent duplicate submissions
PengumpulanSchema.index({ tugas_id: 1, student_id: 1 }, { unique: true });

export default model('Pengumpulan', PengumpulanSchema);