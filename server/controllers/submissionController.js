// server/controllers/submissionController.js
import submissionService from "../services/submissionService.js";

const submitWork = async (req, res, next) => {
  try {
    const { tugas_id } = req.body;
    const studentId = req.user.id;
    const file = req.file;

    if (!file) return res.status(400).json({ message: 'No file uploaded' });
    if (!tugas_id) return res.status(400).json({ message: 'Task ID is required' });

    const result = await submissionService.submitWork({ tugas_id, studentId, file });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const gradeWork = async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const { nilai, feedback } = req.body;
    const asdosId = req.user.id;

    const isAdmin = req.user.roles.includes('admin');

    const result = await submissionService.gradeWork({ submissionId, nilai, feedback, asdosId, isAdmin });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

const downloadFile = async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const isView = req.query.view;

    const filePayload = await submissionService.downloadFile({ submissionId, isView })

    if (filePayload.isInline) {
      return res.sendFile(filePayload.filePath, {
        headers: {
          ...(filePayload.mimeType ? { 'Content-Type': filePayload.mimeType } : {}),
          'Content-Disposition': 'inline'
        }
      });
    }

    res.setHeader('Content-Type', filePayload.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filePayload.downloadFileName}"`);
    res.setHeader('Content-Length', filePayload.fileSize);

    // Create Stream with error handling before headers are sent
    filePayload.stream.on('error', (err) => {
      console.error('Stream error:', err);
      // Only send error response if headers haven't been sent yet
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error downloading file' });
      } else {
        res.destroy();
      }
    });
    filePayload.stream.pipe(res);

  } catch (error) {
    next(error);
  }
};

const getSubmissionsByTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const submissions = await submissionService.getSubmissionsByTask(taskId);

    res.json(submissions);
  } catch (error) {
    next(error);
  }
};

const getMySubmission = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id; // From authMiddleware

    const submission = await submissionService.getMySubmission({ taskId, userId });

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

    const statusMap = await submissionService.getMySubmissionsForTasks({ taskIds, studentId });

    res.json(statusMap);
  } catch (error) {
    next(error);
  }
};

const addComment = async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    if (!text) return res.status(400).json({ message: "Comment text is required" });

    const result = await submissionService.addComment({ submissionId, text, userId });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

const deleteSubmission = async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role || (req.user.roles ? req.user.roles[0] : null);

    const result = await submissionService.deleteSubmission({ submissionId, userId, userRole });

    res.json(result);
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