import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom'; // <--- NEW: Imported React Portal
import axios from 'axios';
import { FiX, FiSend, FiPaperclip, FiImage, FiFile } from 'react-icons/fi';

export default function MessageAdminModal({ isOpen, onClose, initialSubject = '', initialAttachment = null, initialText = '' }) {
  const [messages, setMessages] = useState([]);
  
  const [inputText, setInputText] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [subject, setSubject] = useState(''); 
  
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (initialAttachment) setAttachment(initialAttachment);
      if (initialSubject) setSubject(initialSubject);
      if (initialText) setInputText(initialText);
      
      fetchChatHistory();
    } else {
      setAttachment(null);
      setSubject('');
      setInputText('');
    }
  }, [isOpen, initialAttachment, initialSubject, initialText]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChatHistory = async () => {
    try {
      const token = localStorage.getItem('clientToken') || localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/messages/my-chat', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
    } catch (err) {
      console.error('Failed to load chat history', err);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() && !attachment) return;

    setLoading(true);

    try {
      const token = localStorage.getItem('clientToken') || localStorage.getItem('token');
      
      const formData = new FormData();
      if (inputText.trim()) formData.append('text', inputText);
      if (attachment) formData.append('attachment', attachment);

      const res = await axios.post('http://localhost:5000/api/messages', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessages((prev) => [...prev, res.data]);
      
      setInputText('');
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
    } catch (err) {
      console.error('Failed to send message', err);
      alert('Failed to send message.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // --- NEW: Wrap the entire visual output in createPortal ---
  return createPortal(
    // Added z-[9999] to guarantee it sits above all sidebars and navbars
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-50 dark:bg-[#0f172a] w-full h-[90vh] sm:h-[600px] max-w-lg rounded-t-2xl sm:rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-[#1e293b] shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
              AD
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Admin Support</h2>
              <p className="text-[10px] text-green-500 font-medium">Typically replies in a few hours</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-colors">
            <FiX className="text-xl" />
          </button>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500">
              <div className="w-16 h-16 mb-4 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center">
                <FiSend className="text-2xl" />
              </div>
              <p className="text-sm">Start a conversation with the Admin.</p>
              <p className="text-xs mt-1">You can ask questions or report issues here.</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isUser = msg.sender === 'user';
              return (
                <div key={index} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${isUser ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white dark:bg-[#1e293b] text-slate-800 dark:text-slate-200 rounded-bl-sm border border-slate-200 dark:border-slate-700 shadow-sm'}`}>
                    
                    {/* Render Text */}
                    {msg.text && <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>}
                    
                    {/* Render Attachments */}
                    {msg.fileUrl && (
                      <div className={`mt-2 ${msg.text ? 'pt-2 border-t border-white/20' : ''}`}>
                        {msg.fileUrl.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                          <a href={msg.fileUrl} target="_blank" rel="noreferrer">
                            <img src={msg.fileUrl} alt="attachment" className="rounded-lg max-h-48 object-cover border border-black/10 hover:opacity-90 transition-opacity cursor-pointer" />
                          </a>
                        ) : (
                          <a href={msg.fileUrl} target="_blank" rel="noreferrer" className={`flex items-center gap-2 text-xs font-medium hover:underline ${isUser ? 'text-blue-100' : 'text-blue-600 dark:text-blue-400'}`}>
                            <FiFile className="text-base" /> {msg.fileName}
                          </a>
                        )}
                      </div>
                    )}
                    
                    <div className={`text-[9px] mt-1.5 text-right ${isUser ? 'text-blue-200' : 'text-slate-400 dark:text-slate-500'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 bg-white dark:bg-[#1e293b] border-t border-slate-200 dark:border-slate-800 shrink-0">
          
          {attachment && (
            <div className="mb-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-between border border-blue-100 dark:border-blue-800/50">
              <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-400 font-medium truncate">
                {attachment.type.startsWith('image/') ? <FiImage /> : <FiFile />}
                <span className="truncate max-w-[200px]">{attachment.name}</span>
              </div>
              <button onClick={() => setAttachment(null)} className="text-blue-400 hover:text-blue-600 transition-colors">
                <FiX />
              </button>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex items-end gap-2">
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*,.pdf,.doc,.docx"
            />
            
            <button 
              type="button" 
              onClick={() => fileInputRef.current.click()}
              className="p-3 mb-1 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-full transition-colors shrink-0"
            >
              <FiPaperclip className="text-xl" />
            </button>

            <div className="flex-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-transparent focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all flex items-center px-4 py-1">
              <textarea 
                placeholder="Type a message..."
                value={inputText} 
                onChange={(e) => setInputText(e.target.value)} 
                rows={inputText.includes('\n') ? 5 : 1}
                className="w-full bg-transparent py-2 outline-none text-sm text-slate-900 dark:text-white placeholder-slate-500 resize-none custom-scrollbar"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading || (!inputText.trim() && !attachment)} 
              className="p-3 mb-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              <FiSend className="text-xl ml-0.5" />
            </button>
          </form>
        </div>

      </div>
    </div>,
    document.body // <--- Tells the Portal to mount this directly to the HTML body
  );
}