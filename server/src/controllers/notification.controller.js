const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { getPagination } = require('../utils/pagination');
const notificationService = require('../services/notification.service');

const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const result = await notificationService.listForUser(req.user.id, { skip, limit });
  sendSuccess(res, {
    message: 'Notifications',
    data: result.items,
    meta: { page, limit, total: result.total, unreadCount: result.unreadCount },
  });
});

const markRead = asyncHandler(async (req, res) => {
  await notificationService.markRead(req.user.id, req.params.id);
  sendSuccess(res, { message: 'Notification marked as read', data: null });
});

const markAllRead = asyncHandler(async (req, res) => {
  await notificationService.markAllRead(req.user.id);
  sendSuccess(res, { message: 'All notifications marked as read', data: null });
});

module.exports = { list, markRead, markAllRead };
