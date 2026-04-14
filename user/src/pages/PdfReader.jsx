import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiArrowLeft,
  FiCamera,
  FiChevronLeft,
  FiChevronRight,
  FiEdit3,
  FiDownload,
  FiTrash2,
  FiFileText,
  FiX,
  FiMessageSquare,
  FiCheck
} from "react-icons/fi";
import MessageAdminModal from "../components/MessageAdminModal";

// --- REACT PDF VIEWER IMPORTS ---
import { Worker, Viewer, Position, Tooltip } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { highlightPlugin, MessageIcon } from '@react-pdf-viewer/highlight';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import '@react-pdf-viewer/highlight/lib/styles/index.css';

// --- PDF-LIB FOR BURNING ANNOTATIONS ---
import { PDFDocument, rgb } from 'pdf-lib';

// --- COLOR CONFIGURATION ---
const HIGHLIGHT_COLORS = [
  { bg: 'rgba(250, 204, 21, 0.4)', border: '#eab308' }, // Yellow
  { bg: 'rgba(122, 222, 128, 0.4)', border: '#22c55e' }, // Green
  { bg: 'rgba(96, 165, 250, 0.4)', border: '#3b82f6' }, // Blue
  { bg: 'rgba(244, 114, 182, 0.4)', border: '#ec4899' } // Pink
];

const PDF_EXPORT_COLORS = {
  '#eab308': rgb(0.92, 0.70, 0.03), // Yellow
  '#22c55e': rgb(0.13, 0.77, 0.37), // Green
  '#3b82f6': rgb(0.23, 0.51, 0.96), // Blue
  '#ec4899': rgb(0.93, 0.28, 0.60), // Pink
  '#ef4444': rgb(0.94, 0.27, 0.27)  // Red
};

export default function PdfReader() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- ANNOTATION STATES ---
  const [notes, setNotes] = useState([]); 
  const [showNotes, setShowNotes] = useState(window.innerWidth > 768);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // --- STICKY NOTE & INLINE EDITING STATES ---
  const [isCommentMode, setIsCommentMode] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);

  // --- MODAL STATES ---
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [pendingAnnotation, setPendingAnnotation] = useState(null);
  const [commentText, setCommentText] = useState("");

  // --- TAB FILTER STATE ---
  const [activeTab, setActiveTab] = useState('all'); 

  // --- SCREENSHOT STATES ---
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [screenshotBlob, setScreenshotBlob] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPageNum, setCapturedPageNum] = useState(1); 

  // ==========================================
  // MOBILE FIX 1: Prevent Blurry Pinch-to-Zoom
  // ==========================================
  useEffect(() => {
    let metaViewport = document.querySelector('meta[name="viewport"]');
    let originalContent = '';
    if (metaViewport) {
      originalContent = metaViewport.getAttribute('content');
      metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0');
    }

    const preventPinchZoom = (e) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    };
    
    document.addEventListener('touchmove', preventPinchZoom, { passive: false });
    
    return () => {
      if (metaViewport && originalContent) {
        metaViewport.setAttribute('content', originalContent);
      }
      document.removeEventListener('touchmove', preventPinchZoom);
    };
  }, []);

  // ==========================================
  // 1. HIGHLIGHT PLUGIN & MODAL SETUP
  // ==========================================
  const clearNativeSelection = () => {
    if (window.getSelection) {
      if (window.getSelection().empty) {
        window.getSelection().empty();
      } else if (window.getSelection().removeAllRanges) {
        window.getSelection().removeAllRanges();
      }
    }
  };

  const saveAnnotation = (renderProps, type, colorObj = null) => {
    if (type === 'note') {
      setPendingAnnotation({ renderProps, type, colorObj });
      setCommentText("");
      setCommentModalOpen(true);
      return; 
    }
    finalizeAnnotation(renderProps, type, colorObj, "");
  };

  const finalizeAnnotation = (renderProps, type, colorObj, comment) => {
    const newNote = {
      id: new Date().getTime().toString(),
      text: renderProps.selectedText,
      comment: comment,
      type: type, 
      color: colorObj, 
      highlightAreas: renderProps.highlightAreas,
      pageIndex: renderProps.highlightAreas[0].pageIndex,
    };
    
    const updatedNotes = [...notes, newNote];
    setNotes(updatedNotes);
    saveNotesToDB(updatedNotes); 
    
    renderProps.toggle(); 
    clearNativeSelection();
    setShowNotes(true);
    
    if (type === 'highlight' && activeTab === 'notes') setActiveTab('all');
    if (type === 'note' && activeTab === 'highlights') setActiveTab('all');
  };

  const handleSaveModalComment = () => {
    if (pendingAnnotation) {
      finalizeAnnotation(
        pendingAnnotation.renderProps, 
        pendingAnnotation.type, 
        pendingAnnotation.colorObj, 
        commentText
      );
    }
    setCommentModalOpen(false);
    setPendingAnnotation(null);
    clearNativeSelection();
  };

  const handleCancelModalComment = () => {
    if (pendingAnnotation) pendingAnnotation.renderProps.toggle();
    setCommentModalOpen(false);
    setPendingAnnotation(null);
    clearNativeSelection();
  };

  // --- MOBILE FIX 2: Top-Anchored Portal Menu ---
  const renderHighlightTarget = (renderProps) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    const popupContent = (
      <div
        className={`bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 shadow-2xl flex items-center gap-2 transition-all ${
          isMobile
            ? "fixed top-20 left-1/2 -translate-x-1/2 z-[99999] rounded-full px-5 py-3 w-max shadow-[0_10px_40px_-10px_rgba(0,0,0,0.4)]" 
            : "absolute z-10 rounded-lg p-2 flex-col min-w-[150px]" 
        }`}
        style={
          isMobile
            ? {} 
            : {
                left: `${renderProps.selectionRegion.left}%`,
                top: `${renderProps.selectionRegion.top + renderProps.selectionRegion.height}%`,
              }
        }
      >
        <div className="flex items-center gap-2">
          {!isMobile && <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Highlight</span>}
          <div className="flex gap-2">
            {HIGHLIGHT_COLORS.map((c, index) => (
              <button
                key={index}
                onClick={() => saveAnnotation(renderProps, 'highlight', c)}
                className="w-8 h-8 md:w-5 md:h-5 rounded-full border-2 border-white dark:border-slate-800 shadow-sm hover:scale-110 transition-transform"
                style={{ backgroundColor: c.border }}
                title="Highlight with this color"
              />
            ))}
          </div>
        </div>

        {!isMobile && <div className="h-px bg-slate-100 dark:bg-slate-700 w-full"></div>}
        {isMobile && <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>}

        <button
          onClick={() => saveAnnotation(renderProps, 'note', null)}
          className="px-4 py-2 md:py-1.5 md:px-3 text-sm md:text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-full md:rounded transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
        >
          <FiEdit3 size={isMobile ? 16 : 14} /> {isMobile ? 'Note' : 'Underline & Note'}
        </button>
      </div>
    );

    return isMobile ? createPortal(popupContent, document.body) : popupContent;
  };

  const renderHighlights = (props) => (
    <div>
      {notes.map((note) => (
        <React.Fragment key={note.id}>
          {note.highlightAreas
            .filter((area) => area.pageIndex === props.pageIndex)
            .map((area, idx) => {
              
              if (note.type === 'sticky') {
                return (
                  <div
                    key={idx}
                    style={{
                      position: 'absolute',
                      left: `${area.left}%`,
                      top: `${area.top}%`,
                      transform: 'translate(-50%, -100%)', 
                      zIndex: 10,
                      cursor: 'pointer'
                    }}
                    onClick={(e) => {
                       e.stopPropagation();
                       setShowNotes(true);
                       setActiveTab('notes');
                       setEditingNoteId(note.id);
                    }}
                    title={note.comment || 'Empty Comment'}
                  >
                    <div className="relative group">
                      <FiMessageSquare className="text-3xl text-blue-600 fill-blue-100 drop-shadow-md transition-transform group-hover:scale-110" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[150px] bg-slate-900 text-white text-[10px] p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none line-clamp-2">
                        {note.comment || "Click to edit"}
                      </div>
                    </div>
                  </div>
                );
              }

              const isNote = note.type === 'note';
              const bgColor = isNote ? 'transparent' : (note.color?.bg || HIGHLIGHT_COLORS[0].bg);
              const borderStyle = isNote ? '2px solid #ef4444' : 'none';

              return (
                <div
                  key={idx}
                  style={Object.assign({}, { background: bgColor, borderBottom: borderStyle }, props.getCssProperties(area, props.rotation))}
                  title={note.comment || 'Highlighted text'} 
                />
              )
            })}
        </React.Fragment>
      ))}
    </div>
  );

  // Reverted back to the stable constant assignment!
  const highlightPluginInstance = highlightPlugin({
    renderHighlightTarget,
    renderHighlights,
  });

  const { jumpToHighlightArea } = highlightPluginInstance;


  // ==========================================
  // DROP PIN CLICKS ON THE PDF
  // ==========================================
  const handlePdfClick = (e) => {
    if (!isCommentMode) return;

    const pageNode = e.target.closest('.rpv-core__page-layer');
    if (!pageNode) return;

    const rect = pageNode.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

    const testId = pageNode.getAttribute('data-testid');
    const match = testId?.match(/core__page-layer-(\d+)/);
    if (!match) return;
    
    const pageIndex = parseInt(match[1], 10);
    const newNoteId = new Date().getTime().toString();

    const newSticky = {
      id: newNoteId,
      type: 'sticky',
      text: 'Pinned Comment', 
      comment: '',
      color: { bg: '#3b82f6', border: '#2563eb' },
      highlightAreas: [{ pageIndex, left: xPercent, top: yPercent, width: 0, height: 0 }],
      pageIndex: pageIndex,
    };

    const updatedNotes = [...notes, newSticky];
    setNotes(updatedNotes);
    
    setIsCommentMode(false);
    setShowNotes(true);
    setActiveTab('notes');
    setEditingNoteId(newNoteId);
  };


  // ==========================================
  // 2. CUSTOM LAYOUT PLUGIN (TOOLBAR)
  // ==========================================
  // Reverted back to the stable constant assignment!
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    renderToolbar: (Toolbar) => (
      <Toolbar>
        {(slots) => {
          const { CurrentPageInput, NumberOfPages, ShowSearchPopover, Zoom, ZoomIn, ZoomOut, MoreActionsPopover } = slots;

          return (
            <div className="flex items-center justify-between w-full px-1 md:px-2 overflow-x-auto no-scrollbar">
              
              <div className="flex items-center gap-1 shrink-0">
                {ShowSearchPopover && <div className="p-1 hidden sm:block"><ShowSearchPopover /></div>}
                
                <div className="flex items-center text-xs md:text-sm px-1 font-medium shrink-0">
                  <div className="w-10 md:w-12"><CurrentPageInput /></div> 
                  <span className="mx-1">/</span> 
                  {NumberOfPages && <NumberOfPages />}
                </div>
              </div>
              
              <div className="flex-1 min-w-[5px]"></div>
              
              <div className="flex items-center gap-0.5 md:gap-1 shrink-0 pr-1">
                
                <div className="flex items-center gap-0.5">
                  <div className="h-5 w-px bg-slate-300 dark:bg-slate-600 mx-1 hidden sm:block"></div>
                  {ZoomOut && <div className="p-1.5 md:p-1"><ZoomOut /></div>}
                  <div className="hidden md:block">{Zoom && <div className="p-1.5 md:p-1"><Zoom /></div>}</div>
                  {ZoomIn && <div className="p-1.5 md:p-1"><ZoomIn /></div>}
                </div>

                <div className="h-5 w-px bg-slate-300 dark:bg-slate-600 mx-1"></div>
                
                <button
                  onClick={() => setIsCommentMode(!isCommentMode)}
                  disabled={isCapturing || isExporting}
                  className={`p-1 md:p-2 rounded transition-colors ${isCommentMode ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 shadow-inner' : 'text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400'}`}
                  title={isCommentMode ? "Click anywhere on the PDF to drop a pin" : "Add a Sticky Note"}
                >
                  <FiMessageSquare size={18} />
                </button>

                <div className="h-5 w-px bg-slate-300 dark:bg-slate-600 mx-1 hidden sm:block"></div>

                <button
                  onClick={handleDownloadAnnotatedPdf}
                  disabled={isExporting}
                  className="p-1.5 md:p-2 text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 rounded transition-colors"
                  title="Download Annotated PDF"
                >
                  <FiDownload size={18} className={isExporting ? "animate-bounce" : ""} />
                </button>

                <button
                  onClick={handleCaptureAndAsk}
                  disabled={isCapturing}
                  className="p-1.5 md:p-2 text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 rounded transition-colors"
                  title="Ask Admin a Question"
                >
                  <FiCamera size={18} className={isCapturing ? "animate-pulse" : ""} />
                </button>

                <div className="hidden sm:block">
                  <div className="h-5 w-px bg-slate-300 dark:bg-slate-600 mx-1"></div>
                  {MoreActionsPopover && <div className="p-1"><MoreActionsPopover /></div>}
                </div>
              </div>
            </div>
          );
        }}
      </Toolbar>
    )
  });

  // ==========================================
  // 3. DATA FETCHING & SAVING
  // ==========================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("clientToken") || localStorage.getItem("token");
        const bookRes = await axios.get(`http://192.168.11.160:5000/api/books/${id}`);
        setBook(bookRes.data);

        const notesRes = await axios.get(`http://192.168.11.160:5000/api/notes/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (notesRes.data && notesRes.data.content) {
          try {
            const parsedNotes = JSON.parse(notesRes.data.content);
            if (Array.isArray(parsedNotes)) setNotes(parsedNotes);
          } catch (e) { console.log("Legacy note format found."); }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const saveNotesToDB = async (notesArray) => {
    setIsSavingNotes(true);
    try {
      const token = localStorage.getItem("clientToken") || localStorage.getItem("token");
      await axios.post(
        `http://192.168.11.160:5000/api/notes/${id}`,
        { content: JSON.stringify(notesArray) },
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch (err) { console.error("Error saving notes:", err); }
    setTimeout(() => setIsSavingNotes(false), 1000);
  };

  const deleteNote = (noteId) => {
    if(window.confirm("Remove this annotation?")) {
      const updatedNotes = notes.filter(n => n.id !== noteId);
      setNotes(updatedNotes);
      saveNotesToDB(updatedNotes);
    }
  };

  // ==========================================
  // 4. BURN HIGHLIGHTS & UNDERLINES TO PDF
  // ==========================================
  const handleDownloadAnnotatedPdf = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`http://192.168.11.160:5000/api/books/read-pdf?url=${encodeURIComponent(book.download_link)}`);
      const existingPdfBytes = await response.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);

      notes.forEach(note => {
        note.highlightAreas.forEach(area => {
          const page = pdfDoc.getPage(area.pageIndex);
          const { width, height } = page.getSize();
          const rectX = (area.left * width) / 100;
          const rectY = height - ((area.top * height) / 100) - ((area.height * height) / 100);
          const rectW = (area.width * width) / 100;
          const rectH = (area.height * height) / 100;

          if (note.type === 'note') {
            page.drawRectangle({ x: rectX, y: rectY, width: rectW, height: 1.5, color: PDF_EXPORT_COLORS['#ef4444'], opacity: 1 });
          } else if (note.type === 'sticky') {
            page.drawRectangle({ x: rectX - 10, y: rectY, width: 20, height: 20, color: PDF_EXPORT_COLORS['#3b82f6'], opacity: 0.5 });
          } else {
            const pdfColor = PDF_EXPORT_COLORS[note.color?.border] || PDF_EXPORT_COLORS['#eab308'];
            page.drawRectangle({ x: rectX, y: rectY, width: rectW, height: rectH, color: pdfColor, opacity: 0.4 });
          }
        });
      });

      const notesWithComments = notes.filter(n => n.comment);
      if (notesWithComments.length > 0) {
        const page = pdfDoc.addPage();
        const { height } = page.getSize();
        page.drawText("My Study Notes & Comments", { x: 50, y: height - 50, size: 24, color: rgb(0,0,0) });
        
        let yPos = height - 100;
        notesWithComments.sort((a,b) => a.pageIndex - b.pageIndex).forEach(note => {
           if (yPos < 50) return; 
           page.drawText(`Page ${note.pageIndex + 1}:`, { x: 50, y: yPos, size: 12, color: rgb(0,0,0) });
           yPos -= 18;
           const snip = note.text.length > 60 ? note.text.substring(0, 60) + "..." : note.text;
           page.drawText(`"${snip}"`, { x: 70, y: yPos, size: 10, color: rgb(0.4, 0.4, 0.4) });
           yPos -= 18;
           page.drawText(`Note: ${note.comment}`, { x: 70, y: yPos, size: 12, color: rgb(0, 0.3, 0.8) });
           yPos -= 35;
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${book.title.replace(/\s+/g, '_')}_Annotated.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      console.error("Failed to export PDF", err);
      alert("Failed to export annotated PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  // ==========================================
  // 5. SMART ASK ADMIN CAPTURE
  // ==========================================
  const handleCaptureAndAsk = () => {
    setIsCapturing(true);
    try {
      const pageElements = document.querySelectorAll('.rpv-core__page-layer');
      if (!pageElements || pageElements.length === 0) throw new Error("No pages found.");

      let targetPage = null;
      let maxVisibleHeight = 0;
      const viewHeight = window.innerHeight;

      pageElements.forEach(page => {
        const rect = page.getBoundingClientRect();
        const visibleTop = Math.max(0, rect.top);
        const visibleBottom = Math.min(viewHeight, rect.bottom);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);

        if (visibleHeight > maxVisibleHeight) {
          maxVisibleHeight = visibleHeight;
          targetPage = page;
        }
      });

      if (!targetPage) targetPage = pageElements[0];

      let actualPageNum = 1;
      const testId = targetPage.getAttribute('data-testid');
      if (testId) {
        const match = testId.match(/core__page-layer-(\d+)/);
        if (match) actualPageNum = parseInt(match[1], 10) + 1; 
      }
      
      setCapturedPageNum(actualPageNum);

      const canvas = targetPage.querySelector('canvas');
      if (!canvas) throw new Error("Canvas not rendered yet.");

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const ctx = tempCanvas.getContext('2d');
      
      ctx.drawImage(canvas, 0, 0);

      const pageNotes = notes.filter(n => n.pageIndex === actualPageNum - 1);
      
      pageNotes.forEach(note => {
        note.highlightAreas.forEach(area => {
          const rectX = (area.left * canvas.width) / 100;
          const rectY = (area.top * canvas.height) / 100;
          const rectW = (area.width * canvas.width) / 100;
          const rectH = (area.height * canvas.height) / 100;

          if (note.type === 'note') {
            ctx.fillStyle = '#ef4444'; 
            const lineThickness = Math.max(2, canvas.height * 0.002); 
            ctx.fillRect(rectX, rectY + rectH - lineThickness, rectW, lineThickness);
          } else if (note.type === 'sticky') {
            ctx.fillStyle = '#3b82f6';
            ctx.fillRect(rectX - 10, rectY - 10, 20, 20); 
          } else {
            ctx.fillStyle = note.color?.bg || 'rgba(250, 204, 21, 0.4)';
            ctx.fillRect(rectX, rectY, rectW, rectH);
            ctx.fillStyle = note.color?.border || '#eab308';
            const borderThickness = Math.max(1, canvas.height * 0.001);
            ctx.fillRect(rectX, rectY + rectH - borderThickness, rectW, borderThickness);
          }
        });
      });

      tempCanvas.toBlob((blob) => {
        if (!blob) throw new Error("Failed to process composite image.");
        const file = new File([blob], `Captured_Page_${actualPageNum}.png`, { type: "image/png" });
        setScreenshotBlob(file);
        setIsMessageModalOpen(true);
        setIsCapturing(false);
      }, "image/png");

    } catch (err) {
      console.error("Capture Error:", err);
      alert("Please wait a moment for the page to fully load before capturing.");
      setIsCapturing(false);
    }
  };

  const filteredNotes = notes.filter(note => {
    if (activeTab === 'all') return true;
    if (activeTab === 'highlights') return note.type === 'highlight' || !note.type; 
    if (activeTab === 'notes') return note.type === 'note' || note.type === 'sticky';
    return true;
  }).sort((a,b) => a.pageIndex - b.pageIndex);


  // ==========================================
  // RENDER UI
  // ==========================================

  if (loading) return <div className="flex justify-center py-32 animate-pulse text-slate-500">Loading Reader...</div>;
  if (!book || !book.download_link) return <div className="text-center py-32 text-xl font-bold">PDF Not Available</div>;

  return (
    <div className="absolute inset-0 flex flex-col bg-slate-100 dark:bg-[#0f172a] text-slate-900 dark:text-white z-50 overflow-hidden">
      
      {/* --- MOBILE CSS FIXES --- */}
      <style>{`
        @media (max-width: 768px) {
          .custom-pdf-wrapper .rpv-default-layout__sidebar {
            display: none !important;
          }
        }
      `}</style>

      {/* --- TOP HEADER --- */}
      <header className="h-14 flex items-center justify-between px-4 md:px-6 bg-white dark:bg-[#1e293b] border-b border-slate-200 dark:border-slate-800 shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0">
            <FiArrowLeft className="text-xl" />
          </button>
          <div className="min-w-0">
            <h1 className="font-bold text-sm md:text-base truncate">{book.title}</h1>
            <p className="text-[10px] md:text-xs text-slate-500 truncate">{book.author}</p>
          </div>
        </div>

        <button
          onClick={() => setShowNotes(!showNotes)}
          className="md:hidden flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-[11px] font-bold transition-colors ml-2 shrink-0 border border-blue-200 dark:border-blue-800/50"
        >
          <FiEdit3 size={14} />
          {showNotes ? 'Close' : 'Notes'}
        </button>
      </header>

      {/* --- MAIN CONTENT & SIDEBAR --- */}
      <div className="flex flex-1 overflow-hidden relative w-full h-full">
        
        {/* PDF VIEWER AREA WITH CLICK HANDLER FOR PINS */}
        <main 
          className={`flex-1 relative bg-slate-200 dark:bg-slate-900 w-full h-full overflow-hidden custom-pdf-wrapper ${isCommentMode ? 'cursor-crosshair' : ''}`}
          onClick={handlePdfClick}
        >
           <div className="absolute inset-0 pointer-events-auto">
             <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
               <Viewer
                 fileUrl={`http://192.168.11.160:5000/api/books/read-pdf?url=${encodeURIComponent(book.download_link)}`}
                 plugins={[defaultLayoutPluginInstance, highlightPluginInstance]}
                 theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
               />
             </Worker>
           </div>
           
           {/* Visual overlay when comment mode is active */}
           {isCommentMode && (
             <div className="absolute inset-0 z-10 bg-blue-500/5 pointer-events-none border-4 border-blue-500/20 shadow-[inset_0_0_50px_rgba(59,130,246,0.1)] flex items-end justify-center pb-8">
                <div className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg font-bold text-sm flex items-center gap-2 animate-bounce">
                  <FiMessageSquare /> Click anywhere to drop a pin
                </div>
             </div>
           )}
        </main>

        {/* ANNOTATIONS SIDEBAR */}
        <aside className={`absolute md:relative right-0 top-0 bottom-0 z-40 h-full bg-white dark:bg-[#1e293b] border-l border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 ease-in-out shrink-0 shadow-2xl md:shadow-none ${showNotes ? "w-[85vw] sm:w-[350px] md:w-80 translate-x-0" : "w-0 translate-x-full md:translate-x-0"}`}>
          
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="absolute -left-8 top-1/2 -translate-y-1/2 w-8 h-16 bg-white dark:bg-[#1e293b] border-y border-l border-slate-200 dark:border-slate-800 rounded-l-xl flex items-center justify-center text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.05)] transition-colors z-50"
          >
            {showNotes ? <FiChevronRight className="text-xl" /> : <FiChevronLeft className="text-xl" />}
          </button>

          <div className="flex-1 flex flex-col w-[85vw] sm:w-[350px] md:w-80 h-full overflow-hidden">
            
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0 w-full bg-slate-50 dark:bg-[#1e293b]">
              <div className="flex items-center gap-3">
                <h2 className="font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                  <FiEdit3 className="text-blue-600 dark:text-blue-400" /> Annotations
                </h2>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${isSavingNotes ? "bg-blue-100 text-blue-700 animate-pulse" : "bg-green-100 text-green-700"}`}>
                  {isSavingNotes ? "Saving..." : "Saved"}
                </span>
              </div>
            </div>

            <div className="flex px-4 pt-3 bg-white dark:bg-[#1e293b] border-b border-slate-200 dark:border-slate-800 gap-4 shrink-0 w-full">
              <button onClick={() => setActiveTab('all')} className={`pb-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'all' ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>All</button>
              <button onClick={() => setActiveTab('highlights')} className={`pb-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'highlights' ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>Highlights</button>
              <button onClick={() => setActiveTab('notes')} className={`pb-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'notes' ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>Notes</button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-slate-50 dark:bg-[#0f172a] w-full">
              {filteredNotes.length === 0 ? (
                <div className="text-center text-slate-400 dark:text-slate-500 mt-10 text-sm px-4">
                  {activeTab === 'highlights' && "No highlights yet. Select text and pick a color."}
                  {activeTab === 'notes' && "Click the Comment icon in the top toolbar to drop a pin."}
                  {activeTab === 'all' && "Select text or use the Comment tool to take notes."}
                </div>
              ) : (
                <div className="flex flex-col gap-4 pb-20">
                  {filteredNotes.map(note => {
                    const isSticky = note.type === 'sticky';
                    const cardBorderColor = isSticky ? '#3b82f6' : (note.type === 'note' ? '#ef4444' : (note.color?.border || '#eab308'));

                    return (
                      <div 
                        key={note.id} 
                        onClick={() => {
                           jumpToHighlightArea(note.highlightAreas[0]);
                           if (window.innerWidth < 768) setShowNotes(false);
                        }}
                        className={`bg-white dark:bg-[#1e293b] border-y border-r border-l-4 rounded-xl p-3 shadow-sm group hover:border-r-blue-400 dark:hover:border-r-blue-500 cursor-pointer transition-colors ${editingNoteId === note.id ? 'ring-2 ring-blue-500 shadow-md' : ''}`}
                        style={{ borderLeftColor: cardBorderColor }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded flex items-center gap-1">
                              {isSticky && <FiMessageSquare className="text-blue-500" />} Page {note.pageIndex + 1}
                            </span>
                            <span className="text-[9px] text-slate-400 uppercase tracking-wide">
                              {isSticky ? 'Comment' : (note.type === 'note' ? 'Underline' : 'Highlight')}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); setEditingNoteId(note.id); }} className="text-slate-300 hover:text-blue-500 p-1" title="Edit Note">
                              <FiEdit3 size={14} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }} className="text-slate-300 hover:text-red-500 p-1" title="Delete Annotation">
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {!isSticky && (
                          <div className="pl-2 border-l-2 border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 italic mb-2 line-clamp-3">
                            "{note.text}"
                          </div>
                        )}

                        {/* --- INLINE EDITOR IN SIDEBAR --- */}
                        {editingNoteId === note.id ? (
                          <div className="mt-2 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                            <textarea
                              autoFocus
                              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-2 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none resize-none shadow-inner"
                              rows={3}
                              placeholder="Type your comment..."
                              value={note.comment || ""}
                              onChange={(e) => {
                                const updated = notes.map(n => n.id === note.id ? { ...n, comment: e.target.value } : n);
                                setNotes(updated);
                              }}
                            />
                            <div className="flex justify-end gap-2 mt-1">
                              <button
                                onClick={() => setEditingNoteId(null)}
                                className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => {
                                  saveNotesToDB(notes); 
                                  setEditingNoteId(null);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-[10px] font-bold flex items-center gap-1 transition-colors"
                              >
                                <FiCheck /> Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          note.comment && <div className="text-sm text-slate-800 dark:text-white font-medium bg-blue-50 dark:bg-blue-900/20 p-2 rounded mt-2">{note.comment}</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </aside>

        {showNotes && (
          <div 
            className="absolute inset-0 bg-black/40 z-30 md:hidden"
            onClick={() => setShowNotes(false)}
          />
        )}
      </div>

      <MessageAdminModal
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        initialSubject={`Support Request: ${book?.title}`}
        initialText={`Book Title: ${book?.title}\nPage Number: ${capturedPageNum}\n\nMy Question:\n`}
        initialAttachment={screenshotBlob}
      />

      {/* ==========================================
          CUSTOM HIGHLIGHT INPUT MODAL 
          ========================================== */}
      {commentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0f172a] flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FiEdit3 className="text-blue-600 dark:text-blue-400" /> Add a Note to Underline
              </h3>
              <button onClick={handleCancelModalComment} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-5">
              <div className="mb-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Selected Text</span>
                <p className="text-sm text-slate-600 dark:text-slate-300 italic border-l-4 border-red-400 pl-3 py-1 bg-slate-50 dark:bg-slate-800/50 rounded-r line-clamp-3">
                  "{pendingAnnotation?.renderProps?.selectedText}"
                </p>
              </div>

              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Your Thoughts</span>
              <textarea
                autoFocus
                rows={4}
                className="w-full bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none shadow-inner"
                placeholder="Type your comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
            </div>
            
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0f172a] flex justify-end gap-3">
              <button onClick={handleCancelModalComment} className="px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl">Cancel</button>
              <button
                onClick={handleSaveModalComment}
                disabled={!commentText.trim()}
                className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-xl flex items-center gap-2"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}