import React, { useState } from 'react';
import { StickyNote, Plus, Lock, Globe, Trash2, Edit3, Save, X } from 'lucide-react';
import { User, NoteItem } from '../types';
import { getTranslation } from '../lib/translations';

interface NotesViewProps {
  currentUser: User;
  notes: NoteItem[];
  onAddNote: (note: NoteItem) => void;
  onUpdateNote: (note: NoteItem) => void;
  onDeleteNote: (id: string) => void;
  darkMode: boolean;
}

export const NotesView: React.FC<NotesViewProps> = ({
  currentUser,
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  darkMode
}) => {
  const t = getTranslation(currentUser.language || 'uz');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Umumiy');
  const [isPrivate, setIsPrivate] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // Edit fields
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editIsPrivate, setEditIsPrivate] = useState(false);

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const newNote: NoteItem = {
      id: `NOTE-${Date.now()}`,
      title: title.trim(),
      content: content.trim(),
      isPrivate,
      category: category.trim() || 'Umumiy',
      authorId: currentUser.id,
      authorName: `${currentUser.firstName} ${currentUser.lastName}`,
      createdAt: new Date().toISOString()
    };

    onAddNote(newNote);
    setTitle('');
    setContent('');
    setIsPrivate(false);
  };

  const startEditing = (note: NoteItem) => {
    setEditingNoteId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditIsPrivate(note.isPrivate);
  };

  const saveEditing = (note: NoteItem) => {
    const updated: NoteItem = {
      ...note,
      title: editTitle,
      content: editContent,
      isPrivate: editIsPrivate
    };
    onUpdateNote(updated);
    setEditingNoteId(null);
  };

  // Filter notes visible to currentUser: public notes OR notes authored by currentUser
  const visibleNotes = notes.filter(n => !n.isPrivate || n.authorId === currentUser.id);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold flex items-center space-x-2">
          <StickyNote className="w-6 h-6 text-amber-500" />
          <span>Note (Qaydlar Dafteri)</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Loyiha bo'yicha ish va ma'lumotlarni qayd etish hamda Private/Public ko'rinishda saqlash
        </p>
      </div>

      {/* Create Note Form */}
      <div className={`p-6 rounded-3xl border ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      } shadow-sm space-y-4`}>
        <h2 className="text-sm font-bold flex items-center space-x-2">
          <Plus className="w-4 h-4 text-amber-500" />
          <span>Yangi Qayd Qo'shish</span>
        </h2>

        <form onSubmit={handleCreateNote} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Qayd Sarlavhasi</label>
              <input 
                id="note-title-input"
                type="text"
                required
                placeholder="Masalan: API Endpoint hujjatlari..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Kategoriya / Teg</label>
              <input 
                id="note-category-input"
                type="text"
                placeholder="Masalan: Arxitektura, Bugfix, Reja"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Qayd Matni</label>
            <textarea
              id="note-content-textarea"
              rows={3}
              required
              placeholder="Guruh uchun yoki shaxsiy eslatma matni..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer">
              <input 
                id="note-private-checkbox"
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
              />
              <span className="flex items-center space-x-1">
                {isPrivate ? <Lock className="w-3.5 h-3.5 text-amber-500" /> : <Globe className="w-3.5 h-3.5 text-blue-500" />}
                <span>{isPrivate ? "Shaxsiy (Maxfiy - Private)" : "Guruh uchun ochiq (Public)"}</span>
              </span>
            </label>

            <button
              id="note-submit-btn"
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition shadow-md active:scale-95"
            >
              Qaydni Saqlash
            </button>
          </div>
        </form>
      </div>

      {/* Grid of Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleNotes.map((note) => {
          const isOwner = note.authorId === currentUser.id;
          const isEditing = editingNoteId === note.id;

          return (
            <div 
              key={note.id}
              className={`p-5 rounded-3xl border flex flex-col justify-between space-y-4 ${
                darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
              } shadow-sm relative overflow-hidden`}
            >
              {isEditing ? (
                <div className="space-y-3">
                  <input 
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                  />
                  <textarea
                    rows={3}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs resize-none"
                  />
                  <div className="flex items-center justify-between text-xs">
                    <label className="flex items-center space-x-1">
                      <input 
                        type="checkbox"
                        checked={editIsPrivate}
                        onChange={(e) => setEditIsPrivate(e.target.checked)}
                      />
                      <span>Private</span>
                    </label>

                    <div className="flex space-x-2">
                      <button 
                        onClick={() => saveEditing(note)}
                        className="p-1.5 rounded-lg bg-green-600 text-white"
                      >
                        <Save className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => setEditingNoteId(null)}
                        className="p-1.5 rounded-lg bg-slate-600 text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                        {note.category || 'Umumiy'}
                      </span>

                      <div className="flex items-center space-x-2">
                        {note.isPrivate ? (
                          <span className="text-[10px] text-amber-400 flex items-center space-x-1 bg-amber-500/10 px-2 py-0.5 rounded-full font-semibold">
                            <Lock className="w-3 h-3" />
                            <span>Private</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-blue-400 flex items-center space-x-1 bg-blue-500/10 px-2 py-0.5 rounded-full font-semibold">
                            <Globe className="w-3 h-3" />
                            <span>Public</span>
                          </span>
                        )}

                        {isOwner && (
                          <div className="flex items-center space-x-1">
                            <button 
                              onClick={() => startEditing(note)}
                              className="text-slate-400 hover:text-blue-500 p-1 transition"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => onDeleteNote(note.id)}
                              className="text-slate-400 hover:text-red-500 p-1 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <h3 className="text-sm font-bold pt-1">{note.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 flex justify-between">
                    <span>Muallif: <strong>{note.authorName}</strong></span>
                    <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
