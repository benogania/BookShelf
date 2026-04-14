import React, { useState } from "react";
import axios from "axios";
import {
  FiRadio,
  FiSend,
  FiUsers,
  FiCheckCircle,
  FiBell,
  FiMessageSquare,
} from "react-icons/fi";

export default function NotifyUsers() {
  // Chat States
  const [chatTitle, setChatTitle] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [chatStatus, setChatStatus] = useState("idle");
  const [chatDelivered, setChatDelivered] = useState(0);

  // Notification States
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifStatus, setNotifStatus] = useState("idle");
  const [notifDelivered, setNotifDelivered] = useState(0);

  // 1. Send Chat Broadcast
  const handleChatBroadcast = async (e) => {
    e.preventDefault();
    setChatStatus("loading");
    try {
      const token =
        localStorage.getItem("adminToken") || localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/messages/admin/broadcast",
        { title: chatTitle, message: chatMessage },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setChatDelivered(res.data.deliveredCount);
      setChatStatus("success");
      setChatTitle("");
      setChatMessage("");
      setTimeout(() => setChatStatus("idle"), 5000);
    } catch (err) {
      setChatStatus("error");
    }
  };

  // 2. Send System Notification
  const handleSystemNotification = async (e) => {
    e.preventDefault();
    setNotifStatus("loading");
    try {
      const token =
        localStorage.getItem("adminToken") || localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/user-notifications/broadcast",
        { title: notifTitle, message: notifMessage, type: "info" },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setNotifDelivered(res.data.deliveredCount);
      setNotifStatus("success");
      setNotifTitle("");
      setNotifMessage("");
      setTimeout(() => setNotifStatus("idle"), 5000);
    } catch (err) {
      setNotifStatus("error");
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-slate-100 dark:bg-[#0f172a]">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FiRadio className="text-blue-500" /> Global Communications
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Send direct chat messages to user inboxes, or push system-wide alerts
          to their notification bell.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* --- LEFT: Compose Chat Broadcast --- */}
        <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-full">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
              <FiMessageSquare className="text-xl" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">
                Broadcast Chat Message
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Drops a message into every user's chat inbox.
              </p>
            </div>
          </div>
          <form
            onSubmit={handleChatBroadcast}
            className="p-6 flex flex-col gap-5 flex-1"
          >
            {chatStatus === "success" && (
              <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg flex gap-2">
                <FiCheckCircle className="text-lg" /> Broadcast sent to{" "}
                {chatDelivered} users!
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Chat Subject
              </label>
              <input
                required
                type="text"
                value={chatTitle}
                onChange={(e) => setChatTitle(e.target.value)}
                placeholder="e.g., Welcome to BookShelf!"
                className="w-full  dark:placeholder-slate-300 dark:text-slate-300 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1 flex flex-col">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Message Content
              </label>
              <textarea
                required
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type chat message..."
                className="w-full flex-1 bg-slate-50 dark:text-slate-300 dark:bg-[#0f172a] border dark:placeholder-slate-300 border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 resize-none min-h-[150px]"
              ></textarea>
            </div>
            <button
              type="submit"
              disabled={chatStatus === "loading" || !chatMessage.trim()}
              className="mt-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {chatStatus === "loading" ? (
                "Sending..."
              ) : (
                <>
                  <FiSend /> Send to Inbox
                </>
              )}
            </button>
          </form>
        </div>

        {/* --- RIGHT: Push System Notification --- */}
        <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-full">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-3">
            <div className="p-2.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">
              <FiBell className="text-xl" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">
                Push System Alert
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Triggers the Notification Bell for all users.
              </p>
            </div>
          </div>
          <form
            onSubmit={handleSystemNotification}
            className="p-6 flex flex-col gap-5 flex-1"
          >
            {notifStatus === "success" && (
              <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg flex gap-2">
                <FiCheckCircle className="text-lg" /> Alert sent to{" "}
                {notifDelivered} users!
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Alert Headline
              </label>
              <input
                required
                type="text"
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                placeholder="e.g., Scheduled Maintenance"
                className="w-full dark:text-slate-300  dark:placeholder-slate-300 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="flex-1 flex flex-col">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Alert Details
              </label>
              <textarea
                required
                value={notifMessage}
                onChange={(e) => setNotifMessage(e.target.value)}
                placeholder="Type alert details..."
                className="w-full flex-1 dark:text-slate-300  dark:placeholder-slate-300 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 resize-none min-h-[150px]"
              ></textarea>
            </div>
            <button
              type="submit"
              disabled={notifStatus === "loading" || !notifMessage.trim()}
              className="mt-auto bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {notifStatus === "loading" ? (
                "Sending..."
              ) : (
                <>
                  <FiBell /> Notify Users
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
