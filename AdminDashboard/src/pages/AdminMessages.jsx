import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  FiSend,
  FiPaperclip,
  FiImage,
  FiFile,
  FiUser,
  FiX,
  FiLock,
} from "react-icons/fi";

export default function AdminMessages() {
  const [conversations, setConversations] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);

  const [inputText, setInputText] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const token =
        localStorage.getItem("adminToken") || localStorage.getItem("token");
      const res = await axios.get(
        "http://localhost:5000/api/messages/admin/conversations",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setConversations(res.data);
    } catch (err) {
      console.error("Failed to load conversations", err);
    }
  };

  const loadChat = async (user) => {
    setActiveUser(user);
    try {
      const token =
        localStorage.getItem("adminToken") || localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:5000/api/messages/admin/conversation/${user._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setMessages(res.data);

      setConversations(
        conversations.map((c) =>
          c._id === user._id ? { ...c, unreadCount: 0 } : c,
        ),
      );
    } catch (err) {
      console.error("Failed to load chat", err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!inputText.trim() && !attachment) || !activeUser) return;

    setLoading(true);
    try {
      const token =
        localStorage.getItem("adminToken") || localStorage.getItem("token");
      const formData = new FormData();
      if (inputText.trim()) formData.append("text", inputText);
      if (attachment) formData.append("attachment", attachment);

      const res = await axios.post(
        `http://localhost:5000/api/messages/admin/reply/${activeUser._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setMessages((prev) => [...prev, res.data]);
      setInputText("");
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      fetchConversations();
    } catch (err) {
      alert("Failed to send reply.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (messageId, action) => {
    try {
      const token =
        localStorage.getItem("adminToken") || localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/messages/admin/request-action/${messageId}`,
        { action },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (activeUser) {
        loadChat(activeUser);
      }
    } catch (err) {
      console.error("Failed to process action", err);
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-slate-50 dark:bg-[#0f172a] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 m-4 shadow-sm">
      <div className="w-1/3 min-w-[250px] border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b] flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-bold text-slate-900 dark:text-white text-lg">
            Inbox
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-400">
              No active conversations.
            </div>
          ) : (
            conversations.map((convo) => (
              <div
                key={convo._id}
                onClick={() => loadChat(convo)}
                className={`p-4 border-b border-slate-100 dark:border-slate-800/50 cursor-pointer transition-colors flex items-center gap-3 ${activeUser?._id === convo._id ? "bg-blue-50 dark:bg-slate-800" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
              >
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <FiUser />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <h3
                      className={`text-sm truncate ${convo.unreadCount > 0 ? "font-bold text-slate-900 dark:text-white" : "font-medium text-slate-700 dark:text-slate-300"}`}
                    >
                      {convo.userName}
                    </h3>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(convo.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p
                    className={`text-xs truncate ${convo.unreadCount > 0 ? "text-slate-700 dark:text-slate-300 font-medium" : "text-slate-500"}`}
                  >
                    {convo.lastMessage || "Sent an attachment"}
                  </p>
                </div>
                {convo.unreadCount > 0 && (
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                    {convo.unreadCount}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-slate-50 dark:bg-[#0f172a]">
        {!activeUser ? (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            Select a conversation to start chatting.
          </div>
        ) : (
          <>
            <div className="px-6 py-4 bg-white dark:bg-[#1e293b] border-b border-slate-200 dark:border-slate-800 shadow-sm z-10">
              <h2 className="font-bold text-slate-900 dark:text-white">
                {activeUser.userName}
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 custom-scrollbar">
              {messages.map((msg, index) => {
                const isAdmin = msg.sender === "admin";

                if (msg.isBookRequest) {
                  return (
                    <div key={index} className="flex w-full justify-start">
                      <div className="w-full max-w-sm bg-orange-50 dark:bg-[#1e293b] text-slate-800 dark:text-slate-200 rounded-2xl rounded-bl-sm border border-orange-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="bg-orange-100 dark:bg-slate-800/80 px-4 py-2 border-b border-orange-200 dark:border-slate-700 flex items-center gap-2 font-bold text-orange-700 dark:text-orange-400 text-sm">
                          <FiLock /> Archive Access Request
                        </div>
                        <div className="p-4">
                          <p className="text-sm whitespace-pre-wrap leading-relaxed mb-4">
                            {msg.text}
                          </p>

                          {msg.requestStatus === "pending" ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handleRequestAction(msg._id, "approved")
                                }
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  handleRequestAction(msg._id, "rejected")
                                }
                                className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-2 rounded-lg text-sm font-medium transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <div
                              className={`text-sm font-bold p-2 rounded text-center ${msg.requestStatus === "approved" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-500" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-500"}`}
                            >
                              {msg.requestStatus === "approved"
                                ? "Request Approved"
                                : "Request Rejected"}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={index}
                    className={`flex w-full ${isAdmin ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${isAdmin ? "bg-blue-600 text-white rounded-br-sm shadow-md" : "bg-white dark:bg-[#1e293b] text-slate-800 dark:text-slate-200 rounded-bl-sm border border-slate-200 dark:border-slate-700 shadow-sm"}`}
                    >
                      {msg.text && (
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {msg.text}
                        </p>
                      )}
                      {msg.fileUrl && (
                        <div
                          className={`mt-2 ${msg.text ? "pt-2 border-t border-white/20" : ""}`}
                        >
                          {msg.fileUrl.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                            <a
                              href={msg.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <img
                                src={msg.fileUrl}
                                alt="attachment"
                                className="rounded-lg max-h-48 object-cover border border-black/10 hover:opacity-90 transition-opacity"
                              />
                            </a>
                          ) : (
                            <a
                              href={msg.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 text-xs font-medium hover:underline"
                            >
                              <FiFile /> {msg.fileName}
                            </a>
                          )}
                        </div>
                      )}
                      <div
                        className={`text-[9px] mt-1.5 text-right ${isAdmin ? "text-blue-200" : "text-slate-400"}`}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white dark:bg-[#1e293b] border-t border-slate-200 dark:border-slate-800 shrink-0">
              {attachment && (
                <div className="mb-2 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-medium border border-blue-100 dark:border-blue-800/50">
                  <FiPaperclip />{" "}
                  <span className="truncate max-w-[200px]">
                    {attachment.name}
                  </span>
                  <button
                    onClick={() => setAttachment(null)}
                    className="ml-2 hover:text-red-500"
                  >
                    <FiX />
                  </button>
                </div>
              )}
              <form
                onSubmit={handleSendMessage}
                className="flex items-end gap-2"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => setAttachment(e.target.files[0])}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="p-3 text-slate-400 hover:text-blue-600 bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors shrink-0"
                >
                  <FiPaperclip className="text-lg" />
                </button>
                <textarea
                  rows="1"
                  placeholder="Type your reply..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 bg-slate-100 dark:bg-slate-900 rounded-xl px-4 py-3 outline-none text-sm text-slate-900 dark:text-white resize-none custom-scrollbar"
                />
                <button
                  type="submit"
                  disabled={loading || (!inputText.trim() && !attachment)}
                  className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md disabled:opacity-50 shrink-0 transition-colors"
                >
                  <FiSend className="text-lg" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
