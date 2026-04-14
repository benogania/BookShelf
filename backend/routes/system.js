const express = require("express");
const router = express.Router();
const { verifyToken, isAdmin } = require("../middleware/auth");
const Book = require("../models/Book");
const User = require("../models/User");
const DownloadLog = require("../models/DownloadLog");
const SystemStat = require("../models/SystemStat");
const SystemLog = require("../models/SystemLog");
const Notification = require("../models/Notification");

router.get("/dashboard-stats", [verifyToken, isAdmin], async (req, res) => {
  try {
    const [
      totalBooks,
      activeUsers,
      totalDownloads,
      statDoc,
      rawSystemLogs,
      rawNotifications,
    ] = await Promise.all([
      Book.countDocuments(),
      User.countDocuments(),
      DownloadLog.countDocuments(),
      SystemStat.findOne(),
      SystemLog.find().sort({ createdAt: -1 }).limit(10),
      Notification.find().sort({ createdAt: -1 }).limit(10),
    ]);

    const formattedNotifications = rawNotifications.map((notif) => {
      let colorType = "info";
      let title = "System Activity";

      if (notif.type === "registration") {
        colorType = "success"; // Green dot
        title = "New User Registration";
      } else if (notif.type === "download") {
        colorType = "warning"; // Yellow dot
        title = "File Downloaded";
      } else if (notif.type === "message") {
        colorType = "info"; // Blue dot
        title = "Support Message";
      }

      return {
        _id: notif._id,
        title: title,
        description: notif.message,
        type: colorType,
        createdAt: notif.createdAt,
      };
    });

    const combinedLogs = [...rawSystemLogs, ...formattedNotifications]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    res.json({
      totalBooks,
      activeUsers,
      totalDownloads,
      apiRequests: statDoc ? statDoc.totalApiRequests : 0,
      systemLogs: combinedLogs,
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
});

router.get("/logs/history", [verifyToken, isAdmin], async (req, res) => {
  try {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const [rawSystemLogs, rawNotifications] = await Promise.all([
      SystemLog.find({ createdAt: { $gte: fiveDaysAgo } }).sort({
        createdAt: -1,
      }),
      Notification.find({ createdAt: { $gte: fiveDaysAgo } }).sort({
        createdAt: -1,
      }),
    ]);

    const formattedNotifications = rawNotifications.map((notif) => {
      let colorType = "info";
      let title = "System Activity";

      if (notif.type === "registration") {
        colorType = "success";
        title = "New User Registration";
      } else if (notif.type === "download") {
        colorType = "warning";
        title = "File Downloaded";
      } else if (notif.type === "message") {
        colorType = "info";
        title = "Support Message";
      }

      return {
        _id: notif._id,
        title: title,
        description: notif.message,
        type: colorType,
        createdAt: notif.createdAt,
      };
    });

    const combinedLogs = [...rawSystemLogs, ...formattedNotifications].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );

    res.json(combinedLogs);
  } catch (error) {
    console.error("Logs History Error:", error);
    res.status(500).json({ message: "Failed to fetch logs history" });
  }
});

module.exports = router;
