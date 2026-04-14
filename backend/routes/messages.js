const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const User = require("../models/User");
const Notification = require("../models/Notification");
const Book = require("../models/Book");

const { verifyToken, isAdmin } = require("../middleware/auth");

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const chatUploadPath = "./uploads/chat_files/";
if (!fs.existsSync(chatUploadPath)) {
  fs.mkdirSync(chatUploadPath, { recursive: true });
  console.log("Created missing directory: uploads/chat_files/");
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, chatUploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, "chat-" + Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

router.get("/unread-count", verifyToken, async (req, res) => {
  try {
    const extractedId = req.userId || req.user?.id || req.user?._id || req.user;

    const count = await Message.countDocuments({
      userId: extractedId,
      sender: "admin",
      isRead: false,
    });

    res.json({ unreadCount: count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/my-chat", verifyToken, async (req, res) => {
  try {
    const extractedId = req.userId || req.user?.id || req.user?._id || req.user;

    await Message.updateMany(
      { userId: extractedId, sender: "admin", isRead: false },
      { $set: { isRead: true } },
    );

    const messages = await Message.find({ userId: extractedId }).sort({
      createdAt: 1,
    });

    res.json(messages);
  } catch (error) {
    console.error("Error fetching chat:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post(
  "/",
  [verifyToken, upload.single("attachment")],
  async (req, res) => {
    try {
      const extractedId =
        req.userId || req.user?.id || req.user?._id || req.user;
      const { text } = req.body;

      let fileUrl = "";
      let fileName = "";

      if (req.file) {
        fileUrl = `http://localhost:5000/uploads/chat_files/${req.file.filename}`;
        fileName = req.file.originalname;
      }

      if (!text && !fileUrl) {
        return res
          .status(400)
          .json({ message: "Cannot send an empty message" });
      }

      const user = await User.findById(extractedId);
      const resolvedName = user ? user.name || user.username || "User" : "User";

      const newMessage = new Message({
        userId: extractedId,
        userName: resolvedName,
        sender: "user",
        text: text || "",
        fileUrl,
        fileName,
      });

      await newMessage.save();

      await Notification.create({
        message: `New support message received from ${resolvedName}.`,
        type: "message",
      });

      res.status(201).json(newMessage);
    } catch (error) {
      console.error("Error saving message:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

router.post("/book-request", verifyToken, async (req, res) => {
  try {
    const extractedId = req.userId || req.user?.id || req.user?._id || req.user;
    const { bookId, bookTitle } = req.body;

    const user = await User.findById(extractedId);
    const resolvedName = user ? user.name || user.username || "User" : "User";

    const newMessage = new Message({
      userId: extractedId,
      userName: resolvedName,
      sender: "user",
      text: `System: ${resolvedName} has requested access to the archived book "${bookTitle}".`,
      isBookRequest: true,
      requestedBookId: bookId,
      requestStatus: "pending",
    });

    await newMessage.save();

    await Notification.create({
      message: `New book request from ${resolvedName} for "${bookTitle}"`,
      type: "message",
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error saving request message:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/admin/unread-count", [verifyToken, isAdmin], async (req, res) => {
  try {
    const count = await Message.countDocuments({
      sender: "user",
      isRead: false,
    });
    res.json({ unreadCount: count });
  } catch (error) {
    console.error("Error fetching admin unread count:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/admin/conversations", [verifyToken, isAdmin], async (req, res) => {
  try {
    const recentMessages = await Message.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$userId",
          lastMessage: { $first: "$text" },
          lastFile: { $first: "$fileName" },
          createdAt: { $first: "$createdAt" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$sender", "user"] },
                    { $eq: ["$isRead", false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    const populatedConversations = await Promise.all(
      recentMessages.map(async (convo) => {
        const user = await User.findById(convo._id).select("name username");
        return {
          ...convo,
          userName: user
            ? user.name || user.username || "Unknown User"
            : "Deleted User",
        };
      }),
    );

    res.json(populatedConversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get(
  "/admin/conversation/:userId",
  [verifyToken, isAdmin],
  async (req, res) => {
    try {
      const messages = await Message.find({ userId: req.params.userId }).sort({
        createdAt: 1,
      });

      await Message.updateMany(
        { userId: req.params.userId, sender: "user", isRead: false },
        { $set: { isRead: true } },
      );

      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  },
);

router.post(
  "/admin/reply/:userId",
  [verifyToken, isAdmin, upload.single("attachment")],
  async (req, res) => {
    try {
      const { text } = req.body;
      let fileUrl = "";
      let fileName = "";

      if (req.file) {
        fileUrl = `http://localhost:5000/uploads/chat_files/${req.file.filename}`;
        fileName = req.file.originalname;
      }

      if (!text && !fileUrl)
        return res
          .status(400)
          .json({ message: "Cannot send an empty message" });

      const newMessage = new Message({
        userId: req.params.userId,
        userName: "Admin",
        sender: "admin",
        text: text || "",
        fileUrl,
        fileName,
      });

      await newMessage.save();
      res.status(201).json(newMessage);
    } catch (error) {
      console.error("Error sending admin reply:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

router.put(
  "/admin/request-action/:messageId",
  [verifyToken, isAdmin],
  async (req, res) => {
    try {
      const { action } = req.body;

      const updatedMessage = await Message.findByIdAndUpdate(
        req.params.messageId,
        { requestStatus: action },
        { new: true },
      );

      let bookDetailsText = "";
      if (updatedMessage.requestedBookId) {
        const book = await Book.findById(updatedMessage.requestedBookId);
        if (book) {
          const isbnText = book.isbn || "Not Available";
          bookDetailsText = `\n\nTitle: ${book.title}\nISBN: ${isbnText}`;
        }
      }

      if (action === "approved" && updatedMessage.requestedBookId) {
        console.log(`✅ Approving book ID: ${updatedMessage.requestedBookId}`);

        await Book.updateOne(
          { _id: updatedMessage.requestedBookId },
          { $set: { createdAt: new Date(), unrestricted: true } },
          { timestamps: false, strict: false },
        );

        await Message.create({
          userId: updatedMessage.userId,
          userName: "Admin",
          sender: "admin",
          text: `Your request has been approved! The book is now available in the main library for you to read and download.${bookDetailsText}`,
        });
      } else if (action === "rejected") {
        console.log(`❌ Rejecting book request`);

        await Message.create({
          userId: updatedMessage.userId,
          userName: "Admin",
          sender: "admin",
          text: `We're sorry, but your request for this archived book has been declined at this time.${bookDetailsText}`,
        });
      }

      res.json(updatedMessage);
    } catch (error) {
      console.error("Error processing request action:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

router.post("/admin/broadcast", [verifyToken, isAdmin], async (req, res) => {
  try {
    const { title, message } = req.body;
    if (!message)
      return res.status(400).json({ message: "Message is required" });

    const users = await User.find({});

    const broadcastMessages = users.map((user) => ({
      userId: user._id,
      userName: "Admin",
      sender: "admin",
      text: `📢 ANNOUNCEMENT: ${title ? title.toUpperCase() : "SYSTEM UPDATE"}\n\n${message}`,
      isRead: false,
    }));

    if (broadcastMessages.length > 0) {
      await Message.insertMany(broadcastMessages);
    }

    res.status(200).json({
      message: "Success",
      deliveredCount: broadcastMessages.length,
    });
  } catch (error) {
    console.error("Broadcast error:", error);
    res.status(500).json({ message: "Server error during broadcast" });
  }
});

module.exports = router;
