import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext"; 
import {
  FiUser,
  FiLock,
  FiSave,
  FiLogOut,
  FiSun,
  FiMoon,
} from "react-icons/fi";

export default function Settings() {
  const { user, login, logout } = useContext(AuthContext);
  const { isDarkMode, toggleTheme } = useContext(ThemeContext); 
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && user.username)
      setFormData((prev) => ({ ...prev, username: user.username }));
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setStatus({ type: "", message: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      return setStatus({
        type: "error",
        message: "New passwords do not match!",
      });
    }
    setIsLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const res = await axios.put("http://localhost:5000/api/users/profile", {
        username: formData.username,
        password: formData.password,
      });
      setStatus({ type: "success", message: "Profile updated successfully!" });
      if (res.data.username !== user.username)
        login(user.token, res.data.username);
      setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));
    } catch (error) {
      setStatus({
        type: "error",
        message: error.response?.data?.message || "Failed to update.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pt-8 pb-16">
      <div className="mb-8 border-b border-gray-200 dark:border-slate-800 pb-4 transition-colors">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
          Account Settings
        </h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm">
          Manage your profile, preferences, and security
        </p>
      </div>

      <div className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden mb-8 transition-colors">
        <div className="p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Profile Details
          </h2>

          {status.message && (
            <div
              className={`mb-6 p-4 rounded-lg border ${status.type === "error" ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400" : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400"}`}
            >
              {status.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Username
              </label>
              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-50 dark:bg-[#0f172a] border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg pl-11 pr-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-slate-800">
              <h3 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-4">
                Change Password (Optional)
              </h3>
              <div className="space-y-4">
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="New Password (leave blank to keep current)"
                    className="w-full bg-gray-50 dark:bg-[#0f172a] border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg pl-11 pr-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm New Password"
                    className="w-full bg-gray-50 dark:bg-[#0f172a] border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg pl-11 pr-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-70"
              >
                <FiSave /> {isLoading ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Preferences Card */}
      <div className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden mb-8 transition-colors">
        <div className="p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Preferences
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4">
            <div className="mb-4 sm:mb-0">
              <h3 className="text-gray-900 dark:text-white font-medium">
                Appearance
              </h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                Toggle between light and dark viewing modes
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className="px-5 py-2.5 rounded-lg bg-gray-100 dark:bg-[#0f172a] border border-gray-300 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-500 text-gray-700 dark:text-slate-300 transition-all flex items-center gap-2 font-medium"
            >
              {isDarkMode ? (
                <>
                  <FiSun className="text-yellow-400" /> Switch to Light
                </>
              ) : (
                <>
                  <FiMoon className="text-blue-600" /> Switch to Dark
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white dark:bg-[#1e293b] border border-red-200 dark:border-red-900/30 rounded-2xl shadow-xl overflow-hidden transition-colors">
        <div className="p-6 md:p-8">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">
            Account Actions
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4">
            <div className="mb-4 sm:mb-0">
              <h3 className="text-gray-900 dark:text-white font-medium">
                Log Out
              </h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                Securely sign out of your account
              </p>
            </div>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="px-6 py-2.5 bg-red-50 dark:bg-red-600/10 hover:bg-red-100 dark:hover:bg-red-600/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <FiLogOut /> Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
