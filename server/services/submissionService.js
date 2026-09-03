// server/services/submissionService.js
import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';

import Pengumpulan from '../models/nosql/Pengumpulan.js';
import Tugas from '../models/nosql/Tugas.js';
import { PraktikumUserRole, Role, Pertemuan, User } from '../models/sql/index.js';

// Helper Function
const safeUnlink = async (relativeFilePath) => {
  if (!relativeFilePath) return;
  const absolutePath = path.join(import.meta.dirname, '..', relativeFilePath);
  try {
    await fs.unlink(absolutePath);
  } catch (err) {
    if (err.code !== 'ENOENT') console.error(`Failed to delete: ${absolutePath}`, err);
  }
};

const submitWork = async ({ tugas_id, studentId, file }) => {
  const task = await Tugas.findById(tugas_id);
  if (!task) throw { status: 404, message: 'Task not found' };

  const now = new Date();
  const deadline = new Date(task.tenggat_waktu);
  const status = now > deadline ? 'terlambat' : 'diserahkan';

  const session = await Pertemuan.findByPk(task.pertemuan_id);
  if (session) {
    const enrollment = await PraktikumUserRole.findOne({
      where: { id_user: studentId, id_praktikum: session.id_praktikum },
      include: [{ model: Role }]
    });

    if (!enrollment || enrollment.Role.deskripsi !== 'mahasiswa') {
      throw { status: 403, message: 'You are not enrolled in this class.' };
    }
  }

  const existingSubmission = await Pengumpulan.findOne({ tugas_id: tugas_id, student_id: studentId });
  await safeUnlink(existingSubmission?.file?.path);

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

  return {
    message: status === 'terlambat' ? 'Tugas dikumpulkan terlambat.' : 'Tugas berhasil dikumpulkan.',
    data: submission
  };
};

const gradeWork = async ({ submissionId, nilai, feedback, asdosId, isAdmin }) => {
  if (nilai === undefined || nilai === null) {
    throw { status: 400, message: 'Nilai (score) is required' };
  }

  if (nilai < 0 || nilai > 100) {
    throw { status: 400, message: 'Nilai must be between 0 and 100' };
  }

  const submission = await Pengumpulan.findById(submissionId);
  if (!submission) {
    throw { status: 404, message: 'Submission not found' };
  }

  const task = await Tugas.findById(submission.tugas_id);
  if (!task) {
    throw { status: 404, message: 'Task not found' };
  }

  const session = await Pertemuan.findByPk(task.pertemuan_id);
  if (!session) {
    throw { status: 404, message: 'Session not found' };
  }

  if (!isAdmin) {
    const enrollment = await PraktikumUserRole.findOne({
      where: {
        id_user: asdosId,
        id_praktikum: session.id_praktikum
      },
      include: [{ model: Role }]
    });

    if (!enrollment || enrollment.Role.deskripsi !== 'asdos') {
      throw {
        status: 403,
        message: 'You are not authorized to grade this submission. Only the instructor of this class can grade.'
      };
    }
  }

  submission.nilai = nilai;
  submission.feedback = feedback || '';
  submission.status = 'dinilai';
  submission.graded_by = asdosId;
  submission.graded_at = new Date();

  await submission.save();

  return {
    message: 'Grading saved successfully',
    data: submission
  };

};

const downloadFile = async ({ submissionId, isView }) => {
  const submission = await Pengumpulan.findById(submissionId);

  if (!submission || !submission.file) {
    throw { status: 404, message: 'File not found' };
  }

  const file = submission.file;
  const normalizedDbPath = file.path.replace(/\\/g, '/');
  const filePath = path.resolve(path.join(import.meta.dirname, '..', normalizedDbPath));
  const uploadsRoot = path.resolve(path.join(import.meta.dirname, '..', 'uploads'));

  if (!filePath.startsWith(uploadsRoot + path.sep) && filePath !== uploadsRoot) {
    throw { status: 403, message: 'Access denied: invalid file path' };
  }

  if (!fs.existsSync(filePath)) {
    throw { status: 404, message: 'File not found on server' };
  }

  const isInline = isView === 'true' || isView === true;
  const mimeType = (file.mimetype && file.mimetype !== 'application/octet-stream')
    ? file.mimetype
    : undefined;

  const cleanDownloadName = file.filename ? file.filename.replace(/^\d+-\d+-(?:\d+-)?/, '') : 'tugas-download';

  return {
    isInline,
    mimeType,
    filePath,
    downloadFileName: cleanDownloadName,
    fileSize: file.size,
    stream: fs.createReadStream(filePath),
  }
};

const getSubmissionsByTask = async (taskId) => {
  const task = await Tugas.findById(taskId);
  if (!task) throw { status: 404, message: 'Task not found' };

  const submissions = await Pengumpulan.find({ tugas_id: taskId });

  const enrichedSubmissions = await Promise.all(submissions.map(async (sub) => {
    const student = await User.findByPk(sub.student_id, {
      attributes: ['nama', 'nim']
    });

    return {
      ...sub.toObject(),
      student_name: student ? student.nama : 'Unknown',
      student_nim: student ? student.nim : 'Unknown'
    };
  }));

  return {
    task_title: task.judul,
    submissions: enrichedSubmissions
  };
};

const getMySubmission = async ({ taskId, userId }) => {
  const submission = await Pengumpulan.findOne({
    tugas_id: taskId,
    student_id: userId
  });
  if (!submission) throw { status: 404, message: 'Not submitted yet' };

  return submission;
};

const getMySubmissionsForTasks = async ({ taskIds, studentId }) => {
  const submissions = await Pengumpulan.find({
    student_id: studentId,
    tugas_id: { $in: taskIds }
  });

  const statusMap = {};
  submissions.forEach(sub => {
    statusMap[sub.tugas_id] = {
      status: sub.status,
      nilai: sub.nilai,
      submitted_at: sub.submitted_at
    };
  });

  return statusMap;
};

const addComment = async ({ submissionId, text, userId }) => {
  const userRecord = await User.findByPk(userId);
  const userName = userRecord ? userRecord.nama : 'User';

  const submission = await Pengumpulan.findById(submissionId);
  if (!submission) throw { status: 404, message: 'Submission not found' };

  submission.comments.push({
    senderId: userId,
    senderName: userName,
    text: text
  });

  await submission.save();

  return { message: "Comment added", data: submission };
};

const deleteSubmission = async ({ submissionId, userId, userRole }) => {
  let submission = null;

  if (mongoose.Types.ObjectId.isValid(submissionId)) {
    submission = await Pengumpulan.findById(submissionId);
  }
  if (!submission) {
    submission = await Pengumpulan.findOne({ tugas_id: submissionId, student_id: userId });
  }

  if (!submission) throw { status: 404, message: 'Pengumpulan tidak ditemukan.' };

  const isOwner = submission.student_id?.toString() === userId.toString();
  const isStaff = ['asdos', 'admin'].includes(userRole);

  if (!isOwner && !isStaff) {
    throw { status: 403, message: 'Anda tidak memiliki hak akses untuk menghapus pengumpulan ini.' };
  }

  await safeUnlink(submission.file?.path);

  await Pengumpulan.findByIdAndDelete(submission._id);

  return { message: 'Pengumpulan berhasil dibatalkan & berkas dihapus dari sistem.' };
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