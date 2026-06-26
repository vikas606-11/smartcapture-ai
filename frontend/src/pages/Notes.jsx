import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, X, Clock, Maximize2, AlertCircle, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../services/api';
import { NoteCardSkeleton } from '../components/SkeletonLoaders';
import toast from 'react-hot-toast';

export const Notes = ({ showNotification }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [expandedNote, setExpandedNote] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getAllNotes();
      setNotes(response.notes || []);
    } catch (err) {
      setError(err.message || 'Unable to connect to the backend server. Please verify it is running on http://localhost:5000.');
      toast.error(err.message || 'Failed to fetch notes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!noteContent.trim()) {
      toast.error('Note content cannot be empty.');
      return;
    }

    setLoading(true);
    try {
      await apiService.createNote(noteContent.trim());
      toast.success('Note saved and auto-tagged by AI.');
      setNoteContent('');
      setShowForm(false);
      fetchNotes();
    } catch (err) {
      toast.error(err.message || 'Failed to create note.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiService.deleteNote(id);
      toast.success('Note deleted successfully.');
      setConfirmDeleteId(null);
      if (expandedNote?.id === id) {
        setExpandedNote(null);
      }
      fetchNotes();
    } catch (err) {
      toast.error(err.message || 'Failed to delete note.');
    }
  };

  const truncateText = (text, limit = 100) => {
    if (text.length <= limit) return text;
    return text.substring(0, limit) + '...';
  };

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.05 } }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.96 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } }
  };

  return (
    <div className="space-y-6 p-8 max-w-7xl mx-auto">
      
      {/* Top Header Actions */}
      <div className="flex justify-between items-center pb-4 border-b border-[#262626]">
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#737373]">
          Showing {notes.length} note{notes.length !== 1 && 's'}
        </h2>
        <button
          onClick={() => setShowForm((prev) => !prev)}
          className="px-4 py-2 border border-[#DC2626] bg-[#050505] text-xs font-bold text-white rounded-xl hover:bg-[#DC2626] transition-all flex items-center gap-1.5 shadow-md shadow-red-950/20 active:scale-95"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{showForm ? 'Cancel' : 'New Note'}</span>
        </button>
      </div>

      {/* Note Creation Form Drawer */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="bg-[#171717] border border-[#262626] p-5 rounded-2xl shadow-xl space-y-4 overflow-hidden"
          >
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#737373] mb-1.5">
                Write Note Snippet
              </label>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Start typing your thoughts, links, code ideas... Gemini will automatically categorize and generate hashtag tags."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-[#262626] bg-[#0F0F0F] text-white placeholder-[#737373] text-xs focus:outline-none focus:border-[#DC2626] transition-all leading-relaxed resize-none"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 border border-[#DC2626] bg-[#050505] text-white rounded-xl text-xs font-bold hover:bg-[#DC2626] transition-all flex items-center space-x-1.5 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Save Note</span>
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Notes Grid Display */}
      {error ? (
        <div className="flex items-center justify-center p-8 bg-[#171717]/40 border border-[#DC2626]/20 rounded-2xl text-center">
          <div className="max-w-md mx-auto py-6">
            <div className="w-12 h-12 rounded-full bg-red-950/20 text-[#DC2626] border border-red-900/30 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Network Connection Failure</h3>
            <p className="text-xs text-[#737373] leading-relaxed mb-5">
              {error}
            </p>
            <button
              onClick={() => fetchNotes()}
              className="px-6 py-2.5 bg-[#DC2626] hover:bg-[#EF4444] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 duration-150"
            >
              Retry Notes Load
            </button>
          </div>
        </div>
      ) : loading && notes.length === 0 ? (
        <div className="py-2">
          <NoteCardSkeleton count={6} />
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-[#171717] border border-[#262626] rounded-2xl shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-red-950/20 text-[#DC2626] border border-red-900/20 flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">No notes captured</h3>
          <p className="text-xs text-[#737373] max-w-xs leading-relaxed">
            Record ideas, outlines, snippets or code chunks and let Gemini auto-generate tags.
          </p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {notes.map((note) => (
            <motion.div
              key={note.id}
              variants={cardVariants}
              whileHover={{ y: -3, borderColor: '#DC2626' }}
              className="bg-[#171717] border border-[#262626] p-5 rounded-2xl shadow-lg hover:shadow-[#DC2626]/5 transition-all duration-300 flex flex-col justify-between group relative min-h-[160px]"
            >
              {/* Delete confirmation layer */}
              <AnimatePresence>
                {confirmDeleteId === note.id && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 bg-[#171717]/95 rounded-2xl border border-[#262626]"
                  >
                    <p className="text-xs font-semibold text-white mb-3 text-center">
                      Delete note snippet?
                    </p>
                    <div className="flex space-x-2.5">
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="px-3.5 py-1.5 bg-[#DC2626] text-white rounded-xl text-3xs font-bold hover:bg-[#EF4444] transition-all"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-3.5 py-1.5 bg-[#0F0F0F] border border-[#262626] text-[#A3A3A3] hover:text-white rounded-xl text-3xs font-bold transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Card Contents */}
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-extrabold text-[#737373] uppercase flex items-center tracking-wider">
                    <Clock className="mr-1.5 w-3.5 h-3.5" />
                    {new Date(note.created_at).toLocaleDateString()}
                  </span>

                  {/* Actions on hover */}
                  <div className="flex space-x-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setExpandedNote(note)}
                      className="p-1.5 hover:bg-[#262626] rounded-lg text-[#737373] hover:text-white transition-colors"
                      title="Expand Note"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(note.id)}
                      className="p-1.5 hover:bg-red-950/20 rounded-lg text-[#737373] hover:text-[#DC2626] transition-colors"
                      title="Delete Note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-[#A3A3A3] leading-relaxed break-words whitespace-pre-wrap font-medium">
                  {truncateText(note.content, 120)}
                </p>
              </div>

              {/* Tags row */}
              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-[#262626]/40">
                  {note.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-lg bg-[#0F0F0F] border border-[#262626] text-[10px] font-semibold text-[#737373]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Expanded Dialog Modal view */}
      <AnimatePresence>
        {expandedNote && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpandedNote(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative bg-[#171717] border border-[#262626] rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh] z-10 overflow-hidden"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4.5 border-b border-[#262626]">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#737373] flex items-center">
                  <Clock className="mr-1.5 w-4 h-4" />
                  Captured on {new Date(expandedNote.created_at).toLocaleString()}
                </span>
                <button
                  onClick={() => setExpandedNote(null)}
                  className="p-1.5 rounded-lg hover:bg-[#262626] text-[#737373] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <p className="text-xs sm:text-sm leading-relaxed text-white break-words whitespace-pre-wrap select-text">
                  {expandedNote.content}
                </p>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-[#262626] bg-[#0D0D0D] flex flex-wrap justify-between items-center gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {expandedNote.tags && expandedNote.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-lg bg-[#171717] border border-[#262626] text-[10px] font-semibold text-[#737373]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setConfirmDeleteId(expandedNote.id);
                  }}
                  className="px-3.5 py-1.8 border border-[#DC2626] bg-[#050505] text-xs font-bold text-[#DC2626] hover:bg-[#DC2626] hover:text-white rounded-xl transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Note</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Notes;
