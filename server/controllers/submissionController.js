// server/controllers/submissionController.js
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

import Pengumpulan from '../models/nosql/Pengumpulan.js';
import Tugas from '../models/nosql/Tugas.js';
import { PraktikumUserRole, Role, Pertemuan, User } from '../models/sql/index.js';

const submitWork = async (req, res) => {
  try {
    const { tugas_id } = req.body;
    const studentId = req.user.id;
    const file = req.file;

    // A. Basic Validation
    if (!file) return res.status(400).json({ message: 'No file uploaded' });
    if (!tugas_id) return res.status(400).json({ message: 'Task ID is required' });

    // B. Check Task & Deadline
    const task = await Tugas.findById(tugas_id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const now = new Date();
    const deadline = new Date(task.tenggat_waktu);
    const status = now > deadline ? 'terlambat' : 'diserahkan';

    // C. Enrollment Check
    const session = await Pertemuan.findByPk(task.pertemuan_id);
    if (session) {
      const enrollment = await PraktikumUserRole.findOne({
        where: { id_user: studentId, id_praktikum: session.id_praktikum },
        include: [{ model: Role }]
      });

      if (!enrollment || enrollment.Role.deskripsi !== 'mahasiswa') {
        return res.status(403).json({ message: 'You are not enrolled in this class.' });
      }
    }

    // D. Clean up previous physical file from disk if re-submitting
    const existingSubmission = await Pengumpulan.findOne({ tugas_id: tugas_id, student_id: studentId });
    if (existingSubmission && existingSubmission.file && existingSubmission.file.path) {
      const oldPath = path.join(import.meta.dirname, '..', existingSubmission.file.path);
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch (e) { console.error('Failed to remove old file:', e); }
      }
    }

    // E. The "Smart Save" (Update if exists, Create if new)
    const fileData = {
      filename: file.filename,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size
    };

    const submission = await Pengumpulan.findOneAndUpdate(
      { tugas_id: tugas_id, student_id: studentId },
      {
        $set: {
          file: fileData,
          status: status,
          submitted_at: now,
        }
      },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      message: status === 'terlambat' ? 'Tugas dikumpulkan terlambat.' : 'Tugas berhasil dikumpulkan.',
      data: submission
    });

  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({ message: error.message });
  }
};

const gradeWork = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { nilai, feedback } = req.body;
    const asdosId = req.user.id;

    // 1. Validate input
    if (nilai === undefined || nilai === null) {
      return res.status(400).json({ message: 'Nilai (score) is required' });
    }

    // Validate score range (adjust based on your grading system)
    if (nilai < 0 || nilai > 100) {
      return res.status(400).json({ message: 'Nilai must be between 0 and 100' });
    }

    // 2. Find submission
    const submission = await Pengumpulan.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // 3. Get task details
    const task = await Tugas.findById(submission.tugas_id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // 4. Get session to find praktikum_id
    const session = await Pertemuan.findByPk(task.pertemuan_id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // 5. Verify authorization: User must be asdos of this class OR admin
    const isAdmin = req.user.roles.includes('admin');

    if (!isAdmin) {
      const enrollment = await PraktikumUserRole.findOne({
        where: {
          id_user: asdosId,
          id_praktikum: session.id_praktikum
        },
        include: [{ model: Role }]
      });

      if (!enrollment || enrollment.Role.deskripsi !== 'asdos') {
        return res.status(403).json({
          message: 'You are not authorized to grade this submission. Only the instructor of this class can grade.'
        });
      }
    }

    // 6. Update the grade
    submission.nilai = nilai;
    submission.feedback = feedback || '';
    submission.status = 'dinilai';
    submission.graded_by = asdosId;
    submission.graded_at = new Date();

    await submission.save();

    res.json({
      message: 'Grading saved successfully',
      data: submission
    });

  } catch (error) {
    console.error('Grading error:', error);
    res.status(500).json({ message: error.message });
  }
};

const downloadFile = async (req, res, next) => {
  try {
    const { submissionId } = req.params;

    // 1. Find the Submission (Pengumpulan), NOT Materi
    const submission = await Pengumpulan.findById(submissionId);

    if (!submission || !submission.file) {
      return res.status(404).json({ message: 'File not found' });
    }

    const file = submission.file; // In Pengumpulan.js, 'file' is a single object, not an array

    // =========================================================
    // FIX FOR PATH RESOLUTION
    // =========================================================

    // A. Normalize path separators (Fixes Windows backslashes from DB)
    const normalizedDbPath = file.path.replace(/\\/g, '/');

    // B. Resolve absolute path
    const filePath = path.resolve(path.join(import.meta.dirname, '..', normalizedDbPath));

    // Security fix (SV-9): Path traversal guard.
    // Ensure the resolved path is within the expected uploads directory.
    const uploadsRoot = path.resolve(path.join(import.meta.dirname, '..', 'uploads'));
    if (!filePath.startsWith(uploadsRoot + path.sep) && filePath !== uploadsRoot) {
      return res.status(403).json({ message: 'Access denied: invalid file path' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    // Send File Inline or Attachment
    if (req.query.view === 'true') {
      const mimeType = (file.mimetype && file.mimetype !== 'application/octet-stream') 
        ? file.mimetype 
        : undefined;

      return res.sendFile(filePath, {
        headers: {
          ...(mimeType ? { 'Content-Type': mimeType } : {}),
          'Content-Disposition': 'inline'
        }
      });
    }

    const cleanDownloadName = file.filename ? file.filename.replace(/^\d+-\d+-(?:\d+-)?/, '') : 'tugas-download';
    res.setHeader('Content-Type', file.mimetype);
    res.setHeader('Content-Disposition', `attachment; filename="${cleanDownloadName}"`);
    res.setHeader('Content-Length', file.size);

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);

    stream.on('error', (err) => {
      console.error('Stream error:', err);
      res.status(500).json({ message: 'Error downloading file' });
    });

  } catch (error) {
    next(error);
  }
};

const getSubmissionsByTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    // 1. Get the Task metadata
    const task = await Tugas.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // 2. Get all submissions from MongoDB
    const submissions = await Pengumpulan.find({ tugas_id: taskId });

    // 3. Enrich with SQL User Data
    const enrichedSubmissions = await Promise.all(submissions.map(async (sub) => {
      // FIX 2: Change 'sub.user_id' to 'sub.student_id'
      // The Mongo model uses 'student_id', not 'user_id'
      const student = await User.findByPk(sub.student_id, {
        attributes: ['nama', 'nim']
      });

      return {
        ...sub.toObject(),
        student_name: student ? student.nama : 'Unknown',
        student_nim: student ? student.nim : 'Unknown'
      };
    }));

    res.json({
      task_title: task.judul,
      submissions: enrichedSubmissions
    });

  } catch (error) {
    next(error);
  }
};

const getMySubmission = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id; // From authMiddleware

    // Find submission matching Task ID + Student ID
    const submission = await Pengumpulan.findOne({
      tugas_id: taskId,
      student_id: userId
    });

    if (!submission) {
      // 404 is actually expected if they haven't submitted yet
      return res.status(404).json({ message: 'Not submitted yet' });
    }

    res.json(submission);
  } catch (error) {
    next(error);
  }
};

const getMySubmissionsForTasks = async (req, res, next) => {
  try {
    const { taskIds } = req.body; // Expects array of IDs: ["id1", "id2"]
    const studentId = req.user.id;

    if (!taskIds || !Array.isArray(taskIds)) {
      return res.status(400).json({ message: "Invalid taskIds" });
    }

    // Find all submissions by this student for these tasks
    const submissions = await Pengumpulan.find({
      student_id: studentId,
      tugas_id: { $in: taskIds }
    });

    // Create a map for easy lookup: { "taskId": { status: "...", nilai: 80 } }
    const statusMap = {};
    submissions.forEach(sub => {
      statusMap[sub.tugas_id] = {
        status: sub.status,
        nilai: sub.nilai,
        submitted_at: sub.submitted_at
      };
    });

    res.json(statusMap);
  } catch (error) {
    next(error);
  }
};

const addComment = async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const { text } = req.body;

    // req.user comes from your authMiddleware (only contains id and roles)
    const userId = req.user.id;

    // Fetch the user from the SQL database to get their real name
    const userRecord = await User.findByPk(userId);
    const userName = userRecord ? userRecord.nama : 'User';

    if (!text) return res.status(400).json({ message: "Comment text is required" });

    const submission = await Pengumpulan.findById(submissionId);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    // Push the new comment into the array
    submission.comments.push({
      senderId: userId,
      senderName: userName,
      text: text
    });

    await submission.save();
    res.json({ message: "Comment added", data: submission });
  } catch (error) {
    next(error);
  }
};

const deleteSubmission = async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role || (req.user.roles ? req.user.roles[0] : null);

    let submission = null;

    if (mongoose.Types.ObjectId.isValid(submissionId)) {
      submission = await Pengumpulan.findById(submissionId);
    }
    if (!submission) {
      submission = await Pengumpulan.findOne({ tugas_id: submissionId, student_id: userId });
    }

    if (!submission) return res.status(404).json({ message: 'Pengumpulan tidak ditemukan.' });

    // Authorization: Must be owner student, asdos, or admin
    const isOwner = submission.student_id?.toString() === userId.toString();
    const isStaff = ['asdos', 'admin'].includes(userRole);

    if (!isOwner && !isStaff) {
      return res.status(403).json({ message: 'Anda tidak memiliki hak akses untuk menghapus pengumpulan ini.' });
    }

    // Delete physical file from server disk
    if (submission.file && submission.file.path) {
      const filePath = path.join(import.meta.dirname, '..', submission.file.path);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) { console.error('Failed to unlink submission file:', e); }
      }
    }

    // Remove record from MongoDB
    await Pengumpulan.findByIdAndDelete(submission._id);

    res.json({ message: 'Pengumpulan berhasil dibatalkan & berkas dihapus dari sistem.' });
  } catch (error) {
    next(error);
  }
};

export default {
  submitWork,
  gradeWork,
  downloadFile,
  getSubmissionsByTask,
  getMySubmission,
  getMySubmissionsForTasks,
  addComment,
  deleteSubmission,
}