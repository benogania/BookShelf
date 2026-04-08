import React, { useState, useEffect, useRef } from "react";
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
  FiFileText
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

// PDF-Lib uses 0-1 RGB values instead of Hex
const PDF_EXPORT_COLORS = {
  '#eab308': rgb(0.92, 0.70, 0.03), // Yellow
  '#22c55e': rgb(0.13, 0.77, 0.37), // Green
  '#3b82f6': rgb(0.23, 0.51, 0.96), // Blue
  '#ec4899': rgb(0.93, 0.28, 0.60), // Pink
  '#ef4444': rgb(0.94, 0.27, 0.27)  // Red (for underline)
};

export default function PdfReader() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- ANNOTATION STATES ---
  const [notes, setNotes] = useState([]); 
  const [showNotes, setShowNotes] = useState(true);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // --- TAB FILTER STATE ---
  const [activeTab, setActiveTab] = useState('all'); 

  // --- SCREENSHOT STATES ---
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [screenshotBlob, setScreenshotBlob] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPageNum, setCapturedPageNum] = useState(1); 

  // ==========================================
  // 1. HIGHLIGHT PLUGIN SETUP
  // ==========================================
  
  const saveAnnotation = (renderProps, type, colorObj = null) => {
    let comment = "";
    if (type === 'note') {
      comment = window.prompt("Type your comment for this underline:");
      if (comment === null) return; 
    }

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
    setShowNotes(true);
    
    if (type === 'highlight' && activeTab === 'notes') setActiveTab('all');
    if (type === 'note' && activeTab === 'highlights') setActiveTab('all');
  };

  const renderHighlightTarget = (renderProps) => (
    <div
      className="absolute z-10 bg-white border border-slate-200 shadow-xl rounded-lg p-2 flex flex-col gap-2 min-w-[150px]"
      style={{
        left: `${renderProps.selectionRegion.left}%`,
        top: `${renderProps.selectionRegion.top + renderProps.selectionRegion.height}%`,
      }}
    >
      <div className="flex items-center justify-between gap-2 px-1">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Highlight</span>
        <div className="flex gap-1.5">
          {HIGHLIGHT_COLORS.map((c, index) => (
            <button
              key={index}
              onClick={() => saveAnnotation(renderProps, 'highlight', c)}
              className="w-5 h-5 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
              style={{ backgroundColor: c.border }}
              title="Highlight with this color"
            />
          ))}
        </div>
      </div>

      <div className="h-px bg-slate-100 w-full"></div>

      <button
        onClick={() => saveAnnotation(renderProps, 'note', null)}
        className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors flex items-center justify-center gap-1.5"
      >
        <MessageIcon /> Underline & Note
      </button>
    </div>
  );

  const renderHighlights = (props) => (
    <div>
      {notes.map((note) => (
        <React.Fragment key={note.id}>
          {note.highlightAreas
            .filter((area) => area.pageIndex === props.pageIndex)
            .map((area, idx) => {
              const isNote = note.type === 'note';
              const bgColor = isNote ? 'transparent' : (note.color?.bg || HIGHLIGHT_COLORS[0].bg);
              const borderStyle = isNote ? '2px solid #ef4444' : 'none';

              return (
                <div
                  key={idx}
                  style={Object.assign(
                    {},
                    {
                      background: bgColor,
                      borderBottom: borderStyle,
                    },
                    props.getCssProperties(area, props.rotation)
                  )}
                  title={note.comment || 'Highlighted text'} 
                />
              )
            })}
        </React.Fragment>
      ))}
    </div>
  );

  const highlightPluginInstance = highlightPlugin({
    renderHighlightTarget,
    renderHighlights,
  });

  const { jumpToHighlightArea } = highlightPluginInstance;


  // ==========================================
  // 2. CUSTOM LAYOUT PLUGIN (TOOLBAR OVERRIDE)
  // ==========================================
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    renderToolbar: (Toolbar) => (
      <Toolbar>
        {(slots) => {
          // Extract the tools we actually want to keep. 
          const {
            CurrentPageInput, GoToNextPage, GoToPreviousPage, NumberOfPages,
            ShowSearchPopover, Zoom, ZoomIn, ZoomOut, Print
          } = slots;

          // Safe extraction of the 3 Dots menu to prevent undefined crashes!
          const MoreActions = slots.MoreActionsPopover || slots.MoreActions;

          return (
            <div className="flex items-center justify-between w-full px-2">
              
              {/* LEFT SIDE: Navigation and Zoom */}
              <div className="flex items-center gap-1 shrink-0">
                {ShowSearchPopover && <div className="p-1"><ShowSearchPopover /></div>}
                <div className="h-5 w-px bg-slate-300 dark:bg-slate-600 mx-1"></div>
                {GoToPreviousPage && <div className="p-1"><GoToPreviousPage /></div>}
                
                <div className="flex items-center gap-1 text-sm text-slate-700 dark:text-slate-300 px-1 font-medium">
                  {CurrentPageInput && <CurrentPageInput />} <span className="mx-1">/</span> {NumberOfPages && <NumberOfPages />}
                </div>
                
                {GoToNextPage && <div className="p-1"><GoToNextPage /></div>}
                <div className="h-5 w-px bg-slate-300 dark:bg-slate-600 mx-1"></div>
                {ZoomOut && <div className="p-1"><ZoomOut /></div>}
                {Zoom && <div className="p-1"><Zoom /></div>}
                {ZoomIn && <div className="p-1"><ZoomIn /></div>}
              </div>
              
              <div className="flex-1 min-w-[20px]"></div>
              
              {/* RIGHT SIDE: Custom Buttons + Native Print + Native 3 Dots */}
              <div className="flex items-center gap-1 shrink-0 pr-2">
                
                {/* Custom Download PDF Icon */}
                <button
                  onClick={handleDownloadAnnotatedPdf}
                  disabled={isExporting}
                  className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:bg-slate-800 rounded transition-colors"
                  title="Download Annotated PDF"
                >
                  <FiDownload size={16} className={isExporting ? "animate-bounce" : ""} />
                </button>

                {/* Custom Ask Admin Icon */}
                <button
                  onClick={handleCaptureAndAsk}
                  disabled={isCapturing}
                  className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:bg-slate-800 rounded transition-colors"
                  title="Ask Admin a Question"
                >
                  <FiCamera size={16} className={isCapturing ? "animate-pulse" : ""} />
                </button>

                <div className="h-5 w-px bg-slate-300 dark:bg-slate-600 mx-1"></div>
                
                {/* Safe rendering of native icons to prevent crashes */}
                {Print && <div className="p-1"><Print /></div>}
                {MoreActions && <div className="p-1"><MoreActions /></div>}
                
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
        const bookRes = await axios.get(`http://localhost:5000/api/books/${id}`);
        setBook(bookRes.data);

        const notesRes = await axios.get(`http://localhost:5000/api/notes/${id}`, {
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
        `http://localhost:5000/api/notes/${id}`,
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
      const response = await fetch(`http://localhost:5000/api/books/read-pdf?url=${encodeURIComponent(book.download_link)}`);
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
            page.drawRectangle({
              x: rectX, y: rectY, width: rectW, height: 1.5, color: PDF_EXPORT_COLORS['#ef4444'], opacity: 1, 
            });
          } else {
            const pdfColor = PDF_EXPORT_COLORS[note.color?.border] || PDF_EXPORT_COLORS['#eab308'];
            page.drawRectangle({
              x: rectX, y: rectY, width: rectW, height: rectH, color: pdfColor, opacity: 0.4, 
            });
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
  // 5. SMART ASK ADMIN CAPTURE (Composite Engine)
  // ==========================================
  const handleCaptureAndAsk = () => {
    setIsCapturing(true);
    try {
      const pageElements = document.querySelectorAll('.rpv-core__page-layer');
      if (!pageElements || pageElements.length === 0) {
        throw new Error("No pages found on screen.");
      }

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


  // --- FILTER LOGIC FOR TABS ---
  const filteredNotes = notes.filter(note => {
    if (activeTab === 'all') return true;
    if (activeTab === 'highlights') return note.type === 'highlight' || !note.type; 
    if (activeTab === 'notes') return note.type === 'note';
    return true;
  }).sort((a,b) => a.pageIndex - b.pageIndex);


  // ==========================================
  // RENDER UI
  // ==========================================

  if (loading) return <div className="flex justify-center py-32 animate-pulse text-slate-500">Loading Reader...</div>;
  if (!book || !book.download_link) return <div className="text-center py-32 text-xl font-bold">PDF Not Available</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-0px)] p-0 m-0 bg-slate-100 dark:bg-[#0f172a] text-slate-900 dark:text-white relative">
      
      {/* --- TOP HEADER (Buttons moved to toolbar) --- */}
      <header className="h-14 flex items-center  px-4 md:px-6 bg-white dark:bg-[#1e293b] border-b border-slate-200 dark:border-slate-800 shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0">
            <FiArrowLeft className="text-xl" />
          </button>
          <div className="min-w-0">
            <h1 className="font-bold text-sm md:text-base truncate">{book.title}</h1>
            <p className="text-[10px] md:text-xs text-slate-500 truncate">{book.author}</p>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT & SIDEBAR --- */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* PDF VIEWER AREA */}
        <main className="flex-1 overflow-hidden bg-slate-200 dark:bg-slate-900 relative">
           <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
             <Viewer
               fileUrl={`http://localhost:5000/api/books/read-pdf?url=${encodeURIComponent(book.download_link)}`}
               plugins={[defaultLayoutPluginInstance, highlightPluginInstance]}
               theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
             />
           </Worker>
        </main>

        {/* ANNOTATIONS SIDEBAR */}
        <aside className={`relative bg-white dark:bg-[#1e293b] border-l border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 ease-in-out shrink-0 ${showNotes ? "w-80" : "w-0"}`}>
          
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="absolute -left-8 top-1/2 -translate-y-1/2 w-8 h-16 bg-white dark:bg-[#1e293b] border-y border-l border-slate-200 dark:border-slate-800 rounded-l-xl flex items-center justify-center text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.05)] transition-colors z-10"
          >
            {showNotes ? <FiChevronRight className="text-xl" /> : <FiChevronLeft className="text-xl" />}
          </button>

          <div className="flex-1 flex flex-col w-80 overflow-hidden">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0 w-80 bg-slate-50 dark:bg-[#1e293b]">
              <div className="flex items-center gap-3">
                <h2 className="font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                  <FiEdit3 className="text-blue-600 dark:text-blue-400" /> Annotations
                </h2>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${isSavingNotes ? "bg-blue-100 text-blue-700 animate-pulse" : "bg-green-100 text-green-700"}`}>
                  {isSavingNotes ? "Saving..." : "Saved"}
                </span>
              </div>
            </div>

            {/* TABS NAVIGATION */}
            <div className="flex px-4 pt-3 bg-white dark:bg-[#1e293b] border-b border-slate-200 dark:border-slate-800 gap-4 shrink-0 w-80">
              <button
                onClick={() => setActiveTab('all')}
                className={`pb-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'all' ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab('highlights')}
                className={`pb-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'highlights' ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                Highlights
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`pb-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'notes' ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                Notes
              </button>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar  bg-slate-50 dark:bg-[#0f172a] w-80">
              {filteredNotes.length === 0 ? (
                <div className="text-center text-slate-400 dark:text-slate-500 mt-10 text-sm px-4">
                  {activeTab === 'highlights' && "No highlights yet. Select text and pick a color."}
                  {activeTab === 'notes' && "No notes yet. Select text and click 'Underline & Note'."}
                  {activeTab === 'all' && "Select any text in the PDF to add a highlight or note."}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {filteredNotes.map(note => {
                    const cardBorderColor = note.type === 'note' ? '#ef4444' : (note.color?.border || '#eab308');

                    return (
                      <div 
                        key={note.id} 
                        onClick={() => jumpToHighlightArea(note.highlightAreas[0])}
                        className="bg-white dark:bg-[#1e293b] border-y border-r border-l-4 rounded-xl p-3 shadow-sm group hover:border-r-blue-400 dark:hover:border-r-blue-500 cursor-pointer transition-colors"
                        style={{ borderLeftColor: cardBorderColor }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                              Page {note.pageIndex + 1}
                            </span>
                            <span className="text-[9px] text-slate-400 uppercase tracking-wide">
                              {note.type === 'note' ? 'Note' : 'Highlight'}
                            </span>
                          </div>
                          
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNote(note.id);
                            }} 
                            className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete Annotation"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                        <div className="pl-2 border-l-2 border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 italic mb-2 line-clamp-3">
                          "{note.text}"
                        </div>
                        {note.comment && (
                          <div className="text-sm text-slate-800 dark:text-white font-medium bg-blue-50 dark:bg-blue-900/20 p-2 rounded mt-2">
                            {note.comment}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      <MessageAdminModal
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        initialSubject={`Support Request: ${book?.title}`}
        initialText={`Book Title: ${book?.title}\nPage Number: ${capturedPageNum}\n\nMy Question:\n`}
        initialAttachment={screenshotBlob}
      />
    </div>
  );
}