import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  FiArrowLeft,
  FiBookmark,
  FiDownload,
  FiBookOpen,
  FiLoader,
  FiLock,
} from "react-icons/fi";

export default function BookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [relatedBooks, setRelatedBooks] = useState([]);
  const [savedBookIds, setSavedBookIds] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isDownloading, setIsDownloading] = useState(false);

  const [requestStatus, setRequestStatus] = useState(null);

  useEffect(() => {
    const fetchBookData = async () => {
      setLoading(true);
      window.scrollTo(0, 0);

      try {
        const bookRes = await axios.get(
          `http://192.168.11.160:5000/api/books/${id}`,
        );
        setBook(bookRes.data);

        if (
          bookRes.data?.category &&
          bookRes.data.category !== "Uncategorized"
        ) {
          const relatedRes = await axios.get(
            "http://192.168.11.160:5000/api/books",
            {
              params: {
                status: "available",
                limit: 12,
                category: bookRes.data.category,
              },
            },
          );
          const filtered = relatedRes.data.data
            .filter((b) => b._id !== id)
            .slice(0, 12);
          setRelatedBooks(filtered);
        }
      } catch (error) {
        console.error("Error fetching book details:", error);
      }

      try {
        const libraryRes = await axios.get(
          "http://192.168.11.160:5000/api/users/library",
        );
        if (Array.isArray(libraryRes.data)) {
          setSavedBookIds(libraryRes.data.map((b) => b._id));
        }
      } catch (error) {
        console.log(
          "User library could not be loaded or user is not logged in.",
        );
      }

      setLoading(false);
    };

    if (id) fetchBookData();
  }, [id]);

  const toggleBookmark = async (e, bookId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await axios.post(
        `http://192.168.11.160:5000/api/users/library/${bookId}`,
      );
      if (res.data && Array.isArray(res.data.savedBooks)) {
        setSavedBookIds(res.data.savedBooks);
      }
    } catch (error) {
      console.error("Failed to toggle bookmark", error);
    }
  };

  const handleDownload = async (e) => {
    e.preventDefault();
    if (!book.download_link || isDownloading) return;

    setIsDownloading(true);
    try {
      try {
        const token = localStorage.getItem("clientToken");
        await axios.post(
          `http://192.168.11.160:5000/api/books/${book._id}/log-download`,
          {},
          { headers: { Authorization: `Bearer ${token}` } },
        );
      } catch (logError) {
        alert(
          `Database Log Error: ${logError.response?.data?.message || logError.message}`,
        );
        console.error("Could not log download...", logError);
      }

      const response = await axios.get(book.download_link, {
        responseType: "blob",
      });

      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = blobUrl;

      let filename = book.download_link.split("/").pop();
      if (!filename || filename.includes("#") || filename.includes("?")) {
        filename = `${book.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.${book.format ? book.format.toLowerCase() : "pdf"}`;
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();

      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert(
        "Failed to download the file. It might be missing from the server.",
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRequestAccess = async () => {
    try {
      const token =
        localStorage.getItem("clientToken") || localStorage.getItem("token");
      await axios.post(
        "http://192.168.11.160:5000/api/messages/book-request",
        {
          bookId: book._id,
          bookTitle: book.title,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setRequestStatus("pending");
    } catch (err) {
      alert("Failed to send request.");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-32 animate-pulse text-gray-500 dark:text-slate-500">
        Loading book details...
      </div>
    );
  if (!book)
    return (
      <div className="text-center py-32">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Book not found
        </h2>
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 dark:text-blue-500 hover:underline"
        >
          Go Back
        </button>
      </div>
    );

  const isSaved =
    Array.isArray(savedBookIds) && savedBookIds.includes(book._id);

  let isOldBook = false;
  if (book.createdAt) {
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    isOldBook = new Date(book.createdAt) < fiveYearsAgo;
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-8"
      >
        <FiArrowLeft /> Back to Library
      </button>

      <div className="flex flex-col md:flex-row gap-8 lg:gap-12 mb-16">
        <div className="w-full md:w-1/3 lg:w-1/4 shrink-0">
          <div className="aspect-[2/3] bg-gray-100 dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-slate-700">
            {book.cover_image ? (
              <img
                src={book.cover_image}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-slate-600">
                No Image
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {book.genre && Array.isArray(book.genre) && book.genre.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {book.genre.map((g) => (
                <span
                  key={g}
                  className="px-3 py-1 text-xs uppercase tracking-wider font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-800/50"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight mb-3 transition-colors">
            {book.title}
          </h1>

          <p className="text-xl md:text-2xl text-blue-600 dark:text-blue-400 font-medium mb-8">
            By {book.author || "Unknown Author"}
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-10">
            {isOldBook ? (
              <button
                onClick={handleRequestAccess}
                disabled={requestStatus === "pending"}
                className={`px-6 py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-md flex-1 sm:flex-none ${requestStatus === "pending" ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700" : "bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-900/50 dark:border-orange-800/50"}`}
              >
                <FiLock className="text-lg" />{" "}
                {requestStatus === "pending"
                  ? "Request Sent!"
                  : "Request Access"}
              </button>
            ) : book.download_link ? (
              <>
                <Link
                  to={`/read/${book._id}`}
                  className="px-6 py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-md bg-blue-600 hover:bg-blue-700 text-white hover:shadow-blue-600/20 flex-1 sm:flex-none"
                >
                  <FiBookOpen className="text-lg" /> Read Online
                </Link>

                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="px-6 py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800/50 flex-1 sm:flex-none disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isDownloading ? (
                    <>
                      <FiLoader className="text-lg animate-spin" />{" "}
                      Downloading...
                    </>
                  ) : (
                    <>
                      <FiDownload className="text-lg" /> Download File
                    </>
                  )}
                </button>
              </>
            ) : (
              <div className="px-8 py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 cursor-not-allowed border border-gray-200 dark:border-slate-700 flex-1 sm:flex-none">
                <FiDownload className="text-lg" /> File Not Available
              </div>
            )}

            <button
              onClick={(e) => toggleBookmark(e, book._id)}
              className={`px-6 py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all flex-1 sm:flex-none ${isSaved ? "bg-emerald-50 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-600/30 border border-emerald-200 dark:border-emerald-500/30" : "bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 border border-gray-300 dark:border-slate-700"}`}
            >
              <FiBookmark
                className={
                  isSaved ? "fill-emerald-500 dark:fill-emerald-400" : ""
                }
              />
              {isSaved ? "Saved to Library" : "Save for Later"}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-6 gap-x-4 py-6 border-y border-gray-200 dark:border-slate-800 text-sm transition-colors">
            <div>
              <div className="text-gray-500 dark:text-slate-500 text-xs uppercase tracking-wider mb-1 font-semibold">
                Author
              </div>
              <div className="text-gray-900 dark:text-slate-200">
                {book.author || "-"}
              </div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-slate-500 text-xs uppercase tracking-wider mb-1 font-semibold">
                Publisher
              </div>
              <div className="text-gray-900 dark:text-slate-200">
                {book.publisher || "-"}
              </div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-slate-500 text-xs uppercase tracking-wider mb-1 font-semibold">
                Published
              </div>
              <div className="text-gray-900 dark:text-slate-200">
                {book.publish_date || "-"}
              </div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-slate-500 text-xs uppercase tracking-wider mb-1 font-semibold">
                ISBN
              </div>
              <div className="text-gray-900 dark:text-slate-200">
                {book.isbn || "-"}
              </div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-slate-500 text-xs uppercase tracking-wider mb-1 font-semibold">
                Format
              </div>
              <div className="text-gray-900 dark:text-slate-200">
                {book.format || "-"}
              </div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-slate-500 text-xs uppercase tracking-wider mb-1 font-semibold">
                Language
              </div>
              <div className="text-gray-900 dark:text-slate-200">
                {book.language || "-"}
              </div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-slate-500 text-xs uppercase tracking-wider mb-1 font-semibold">
                Size
              </div>
              <div className="text-gray-900 dark:text-slate-200">
                {book.size || "-"}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wider">
              Description
            </h3>
            <p className="text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-line text-base md:text-lg">
              {book.description || "No description provided for this title."}
            </p>
          </div>
        </div>
      </div>

      {relatedBooks.length > 0 && (
        <div className="pt-12 border-t border-gray-200 dark:border-slate-800 transition-colors">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            More like this
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {relatedBooks.map((relatedBook) => {
              const isRelSaved =
                Array.isArray(savedBookIds) &&
                savedBookIds.includes(relatedBook._id);
              return (
                <Link
                  to={`/book/${relatedBook._id}`}
                  key={relatedBook._id}
                  className="bg-white dark:bg-[#1e293b] rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-600 transition-all group flex flex-col h-full"
                >
                  <div className="relative aspect-[2/3] bg-gray-100 dark:bg-slate-800 overflow-hidden">
                    {relatedBook.cover_image ? (
                      <img
                        src={relatedBook.cover_image}
                        alt={relatedBook.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-slate-600 text-xs p-2 text-center">
                        No Cover
                      </div>
                    )}
                    <button
                      onClick={(e) => toggleBookmark(e, relatedBook._id)}
                      className="absolute top-2 right-2 p-2 rounded-full backdrop-blur-md bg-white/50 dark:bg-black/40 hover:bg-white/80 dark:hover:bg-black/60 transition-colors z-10"
                    >
                      <FiBookmark
                        className={`text-sm ${isRelSaved ? "fill-blue-500 text-blue-500" : "text-gray-700 dark:text-white"}`}
                      />
                    </button>
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-xs md:text-sm line-clamp-2 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                      {relatedBook.title}
                    </h3>
                    <p className="text-[10px] md:text-xs text-gray-500 dark:text-slate-400 line-clamp-1">
                      {relatedBook.author || "Unknown Author"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
