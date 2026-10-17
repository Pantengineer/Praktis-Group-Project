// server/controllers/systemSettingController.js
import {
  getContactInfo as getContactInfoService,
  updateContactInfo as updateContactInfoService,
  getAllSettings as getAllSettingsService
} from '../services/systemSettingService.js';
import logger from '../utils/logger.js';

/**
 * Public / Authenticated: Get Contact Info (Phone, Email, Hours, WhatsApp Link)
 */
async function getContactInfo(req, res) {
  try {
    const contactInfo = await getContactInfoService();
    return res.json({
      success: true,
      data: contactInfo,
    });
  } catch (error) {
    logger.error('Error fetching contact info:', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil informasi kontak.',
    });
  }
}

/**
 * Admin Only: Update Contact Info (Phone, Email, Hours, WhatsApp Initial Message)
 */
async function updateContactInfo(req, res) {
  try {
    const { phone, email, hours, whatsappMessage } = req.body;

    const updated = await updateContactInfoService({
      phone,
      email,
      hours,
      whatsappMessage,
    });

    return res.json({
      success: true,
      message: 'Informasi kontak berhasil diperbarui.',
      data: updated,
    });
  } catch (error) {
    if (error.message === 'INVALID_PHONE_NUMBER') {
      return res.status(400).json({
        success: false,
        message: 'Format nomor telepon tidak valid. Minimal 8 digit angka.',
      });
    }
    if (error.message === 'INVALID_EMAIL') {
      return res.status(400).json({
        success: false,
        message: 'Format alamat email tidak valid.',
      });
    }
    logger.error('Error updating contact info:', { error: error.message });
    return res.status(500).json({
      success: false,
      message: error.message || 'Gagal memperbarui informasi kontak.',
    });
  }
}

/**
 * Admin Only: Get all system settings
 */
async function getAllSettings(req, res) {
  try {
    const settings = await getAllSettingsService();
    return res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    logger.error('Error fetching all settings:', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil pengaturan sistem.',
    });
  }
}

export default {
  getContactInfo,
  updateContactInfo,
  getAllSettings,
};
