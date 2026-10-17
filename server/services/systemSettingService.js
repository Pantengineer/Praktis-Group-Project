// server/services/systemSettingService.js
import { SystemSetting } from '../models/sql/index.js';

/**
 * Helper to convert standard Indonesian phone number (e.g. 0812..., +62812...)
 * into international WhatsApp format (e.g. 62812...)
 * @param {string} phone 
 * @returns {string}
 */
const formatWhatsAppNumber = (phone) => {
  if (!phone) return '';
  // Remove non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  }
  return cleaned;
};

/**
 * Retrieve public contact information
 */
export const getContactInfo = async () => {
  const keys = ['contact_phone', 'contact_email', 'contact_helpdesk_hours', 'contact_whatsapp_message'];

  const settings = await SystemSetting.findAll({
    where: {
      setting_key: keys,
    },
  });

  const settingsMap = {};
  settings.forEach((s) => {
    settingsMap[s.setting_key] = s.setting_value;
  });

  const phone = settingsMap['contact_phone'] || '081234567890';
  const email = settingsMap['contact_email'] || 'lab@praktis.ac.id';
  const hours = settingsMap['contact_helpdesk_hours'] || 'Senin - Jumat, 08:00 - 16:00 WIB';
  const message = settingsMap['contact_whatsapp_message'] || 'Halo Admin PRAKTIS, saya membutuhkan bantuan terkait praktikum.';

  const waNumber = formatWhatsAppNumber(phone);
  const whatsappUrl = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}` : '';

  return {
    phone,
    email,
    hours,
    whatsappUrl,
    whatsappNumber: waNumber,
  };
};

/**
 * Helper to safely save or update a setting
 */
const saveSetting = async (key, value, deskripsi) => {
  const [record, created] = await SystemSetting.findOrCreate({
    where: { setting_key: key },
    defaults: {
      setting_key: key,
      setting_value: value,
      deskripsi: deskripsi,
      is_public: true,
    },
  });

  if (!created) {
    await record.update({
      setting_value: value,
      deskripsi: deskripsi,
      is_public: true,
    });
  }
  return record;
};

/**
 * Update contact information (Admin only)
 * @param {Object} payload 
 */
export const updateContactInfo = async ({ phone, email, hours, whatsappMessage }) => {
  if (phone !== undefined) {
    const digitsOnly = phone.replace(/\D/g, '');
    if (phone.trim() && (digitsOnly.length < 8 || digitsOnly.length > 15)) {
      throw new Error('INVALID_PHONE_NUMBER');
    }

    await saveSetting(
      'contact_phone',
      phone.trim(),
      'Nomor WhatsApp / Kontak Administrator Laboratorium'
    );
  }

  if (email !== undefined) {
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('INVALID_EMAIL');
    }

    await saveSetting(
      'contact_email',
      email.trim(),
      'Email Dukungan / Layanan Administrator Laboratorium'
    );
  }

  if (hours !== undefined) {
    await saveSetting(
      'contact_helpdesk_hours',
      hours.trim(),
      'Jam Operasional Layanan Helpdesk Laboratorium'
    );
  }

  if (whatsappMessage !== undefined) {
    await saveSetting(
      'contact_whatsapp_message',
      whatsappMessage.trim(),
      'Pesan Awal Otomatis Tautan WhatsApp'
    );
  }

  return await getContactInfo();
};

/**
 * Get all system settings (Admin only)
 */
export const getAllSettings = async () => {
  return await SystemSetting.findAll({
    order: [['setting_key', 'ASC']],
  });
};

export default {
  getContactInfo,
  updateContactInfo,
  getAllSettings,
};
