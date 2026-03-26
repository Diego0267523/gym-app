const notificationsModel = require("../models/notificationsModel");

// Obtener notificaciones del usuario
exports.getNotifications = (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Usuario no autenticado" });
    }

    notificationsModel.getNotifications(userId, (err, notifications) => {
      if (err) {
        console.error("Error getNotifications:", err);
        return res.status(500).json({ success: false, message: "Error obteniendo notificaciones" });
      }

      return res.json({ success: true, notifications });
    });
  } catch (error) {
    console.error("Error getNotifications:", error);
    return res.status(500).json({ success: false, message: "Error obteniendo notificaciones" });
  }
};

// Marcar notificación como leída
exports.markAsRead = (req, res) => {
  try {
    const userId = req.user?.id;
    const notificationId = parseInt(req.params.id, 10);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Usuario no autenticado" });
    }

    if (!notificationId || isNaN(notificationId)) {
      return res.status(400).json({ success: false, message: "ID de notificación inválido" });
    }

    notificationsModel.markAsRead(notificationId, userId, (err, result) => {
      if (err) {
        console.error("Error markAsRead:", err);
        return res.status(500).json({ success: false, message: "Error marcando notificación como leída" });
      }

      return res.json({ success: true, message: "Notificación marcada como leída" });
    });
  } catch (error) {
    console.error("Error markAsRead:", error);
    return res.status(500).json({ success: false, message: "Error marcando notificación como leída" });
  }
};

// Obtener conteo de notificaciones no leídas
exports.getUnreadCount = (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Usuario no autenticado" });
    }

    notificationsModel.getUnreadCount(userId, (err, count) => {
      if (err) {
        console.error("Error getUnreadCount:", err);
        return res.status(500).json({ success: false, message: "Error obteniendo conteo de notificaciones" });
      }

      return res.json({ success: true, unreadCount: count });
    });
  } catch (error) {
    console.error("Error getUnreadCount:", error);
    return res.status(500).json({ success: false, message: "Error obteniendo conteo de notificaciones" });
  }
};

// Marcar todas las notificaciones como leídas
exports.markAllAsRead = (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Usuario no autenticado" });
    }

    notificationsModel.markAllAsRead(userId, (err, result) => {
      if (err) {
        console.error("Error markAllAsRead:", err);
        return res.status(500).json({ success: false, message: "Error marcando notificaciones como leídas" });
      }

      return res.json({ success: true, message: "Todas las notificaciones marcadas como leídas" });
    });
  } catch (error) {
    console.error("Error markAllAsRead:", error);
    return res.status(500).json({ success: false, message: "Error marcando notificaciones como leídas" });
  }
};