import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiTrash2, FiX, FiClock, FiMaximize2 } from 'react-icons/fi';
import { apiService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export const Notes = ({ showNotification }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [expandedNote, setExpandedNote] = useState(null);
  
  // Track note currently undergoing delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiService.getAllNotes();
      setNotes(response.notes || []);
    } catch (err) {
      showNotification(err.message || 'Failed to fetch notes.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!noteContent.trim()) {
      showNotification('Note content cannot be empty.', 'error');
      return;
    }

    setLoading(true);
    try {
      await apiService.createNote(noteContent.trim());
      showNotification('Note created and auto-tagged by AI.', 'success');
      setNoteContent('');
      setShowForm(false);
      fetchNotes();
    } catch (err) {
      showNotification(err.message || 'Failed to create note.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiService.deleteNote(id);
      showNotification('Note deleted successfully.', 'success');
      setConfirmDeleteId(null);
      if (expandedNote?.id === id) {
        setExpandedNote(null);
      }
      fetchNotes();
    } catch (err) {
      showNotification(err.message || 'Failed to delete note.', 'error');
    }
  };

  const truncateText = (text, limit = 100) => {
    if (text.length <= limit) return text;
    return text.substring(0, limit) + '...';
  };

  return (
    <div className="space-y-6 animate-fade-in p-6">
      {/* Top Header Actions */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Showing {notes.length} note{notes.length !== 1 && 's'}
        </h2>
        <button
          onClick={() => setShowForm((prev) => !prev)}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-xs font-extrabold text-white rounded-xl shadow-md transition-all flex items-center gap-1.5"
        >
          {showForm ? <FiX className="w-4 h-4" /> : <FiPlus className="w-4 h-4" />}
          <span>{showForm ? 'Cancel' : 'New Note'}</span>
        </button>
      </div>

      {/* Note Creation Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border p-5 rounded-2xl shadow-sm space-y-4 animate-slide-down"
        >
          <div>
            <label className="block text-2xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-550 mb-1.5">
              Write Note Snippet
            </label>
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Start typing your thoughts, links, code ideas... Gemini will automatically categorize and generate hashtag tags."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/80 transition-all leading-relaxed"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-905 hover:bg-slate-850 dark:bg-brand-600 dark:hover:bg-brand-700 text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <FiPlus className="w-4 h-4" />
              <span>Save Note</span>
            </button>
          </div>
        </form>
      )}

      {/* Notes Grid */}
      {loading && notes.length === 0 ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner text="Consulting notes archive..." />
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-dark-card border border-slate-250 dark:border-dark-border rounded-2xl shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-950/20 text-purple-500 dark:text-purple-400 flex items-center justify-center mb-4">
            <FiClock className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
            No notes captured
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
            Record ideas, outlines, lists or quotes and let Gemini auto-tag them.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border p-5 rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group relative"
            >
              {/* Confirm delete overlay (specific to this card) */}
              {confirmDeleteId === note.id && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 bg-white/95 dark:bg-dark-card/95 rounded-2xl">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-250 mb-3 text-center">
                    Delete note?
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="px-3.5 py-1.5 bg-rose-550 text-white rounded-lg text-2xs font-extrabold hover:bg-rose-600"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-2xs font-extrabold hover:bg-slate-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Main Note Card Content */}
              <div>
                <div className="flex justify-between items-start mb-2.5">
                  {/* Created date */}
                  <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-550 uppercase flex items-center">
                    <FiClock className="mr-1 w-3.5 h-3.5" />
                    {new Date(note.created_at).toLocaleDateString()}
                  </span>

                  {/* Top right Actions (Visible on hover) */}
                  <div className="flex space-x-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setExpandedNote(note)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-brand-500"
                      title="Expand Note"
                    >
                      <FiMaximize2 className="w-4.5 h-4.5" />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(note.id)}
                      className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded text-slate-400 hover:text-rose-500"
                      title="Delete Note"
                    >
                      <FiTrash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-slate-655 dark:text-slate-300 leading-relaxed break-words whitespace-pre-wrap">
                  {truncateText(note.content, 120)}
                </p>
              </div>

              {/* Tag row */}
              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  {note.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-3xs font-semibold text-slate-450 dark:text-slate-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Expanded Modal view */}
      {expandedNote && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm transition-all p-4">
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh] animate-scale-up">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center">
                <FiClock className="mr-1.5 w-4 h-4" />
                Captured on {new Date(expandedNote.created_at).toLocaleString()}
              </span>
              <button
                onClick={() => setExpandedNote(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <p className="text-sm sm:text-base leading-relaxed text-slate-755 dark:text-slate-200 break-words whitespace-pre-wrap">
                {expandedNote.content}
              </p>
            </div>

            {/* Modal Footer (Tags + Actions) */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-3">
              <div className="flex flex-wrap gap-1.5">
                {expandedNote.tags && expandedNote.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-3xs font-semibold text-slate-500 dark:text-slate-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              <button
                onClick={() => {
                  setConfirmDeleteId(expandedNote.id);
                }}
                className="px-4 py-2 border border-rose-200 text-xs font-bold text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all flex items-center gap-1.5"
              >
                <FiTrash2 className="w-4 h-4" />
                <span>Delete Note</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;
