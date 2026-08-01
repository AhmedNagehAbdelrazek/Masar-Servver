const notificationService = require('../Services/notificationService');
const { successResponse } = require('../utils/httpResponse');
const { parsePagination, buildPagination } = require('../utils/pagination');

const listNotifications = async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query);
    let unread = null;
    if (req.query.unread === 'true') unread = true;
    else if (req.query.unread === 'false') unread = false;
    const { rows, count } = await notificationService.listForUser(req.user.id, {
      unread,
      page,
      limit,
    });

    const data = rows.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      data: n.data,
      is_read: n.isRead,
      created_at: n.createdat || n.createdAt,
    }));

    successResponse(res, {
      data,
      pagination: buildPagination(count, page, limit),
    });
  } catch (err) {
    next(err);
  }
};

const markRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markRead(req.user.id, req.params.notification_id);
    successResponse(res, {
      notification: { id: notification.id, is_read: notification.isRead },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listNotifications,
  markRead,
};
