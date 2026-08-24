const notificationService = require('../Services/notificationService');
const { successResponse } = require('../utils/httpResponse');
const { parsePagination, buildPagination } = require('../utils/pagination');
const { markResource } = require('../Services/auditService');
const catchAsync = require('../utils/catchAsync');

const listNotifications = catchAsync(async (req, res) => {
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
});

const markRead = catchAsync(async (req, res) => {
  const notification = await notificationService.markRead(req.user.id, req.params.notification_id);
  markResource(res, { type: 'notification', id: notification.id });
  successResponse(res, {
    notification: { id: notification.id, is_read: notification.isRead },
  });
});

module.exports = {
  listNotifications,
  markRead,
};
