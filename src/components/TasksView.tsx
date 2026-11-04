import React, { useState } from 'react';
import { CheckSquare, Plus, Check, UserCheck, ShieldAlert, Trash2, Edit2, Save, X } from 'lucide-react';
import { User, Task } from '../types';
import { getTranslation } from '../lib/translations';

interface TasksViewProps {
  currentUser: User;
  allUsers: User[];
  tasks: Task[];
  onAddTask: (newTask: Task) => void;
  onUpdateTask?: (updatedTask: Task) => void;
  onToggleTask: (taskId: string, currentUserId: string) => void;
  onDeleteTask: (taskId: string) => void;
  darkMode: boolean;
}

export const TasksView: React.FC<TasksViewProps> = ({
  currentUser,
  allUsers,
  tasks,
  onAddTask,
  onUpdateTask,
  onToggleTask,
  onDeleteTask,
  darkMode
}) => {
  const t = getTranslation(currentUser.language || 'uz');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedToId, setAssignedToId] = useState(allUsers[0]?.id || currentUser.id);
  const [warningMsg, setWarningMsg] = useState('');

  // Editing state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const assignedUser = allUsers.find(u => u.id === assignedToId) || currentUser;

    const newTask: Task = {
      id: `TASK-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      completed: false,
      createdById: currentUser.id,
      createdByName: `${currentUser.firstName} ${currentUser.lastName}`.trim() || currentUser.username,
      assignedToId: assignedUser.id,
      assignedToName: `${assignedUser.firstName} ${assignedUser.lastName}`.trim() || assignedUser.username,
      date: new Date().toISOString().split('T')[0]
    };

    onAddTask(newTask);
    setTitle('');
    setDescription('');
  };

  const startEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditDesc(task.description || '');
  };

  const saveEdit = (task: Task) => {
    if (!editTitle.trim()) return;
    if (onUpdateTask) {
      onUpdateTask({
        ...task,
        title: editTitle.trim(),
        description: editDesc.trim()
      });
    }
    setEditingTaskId(null);
  };

  const handleToggleClick = (task: Task) => {
    setWarningMsg('');
    // Rule: Only the assigned person can mark the task completed!
    if (task.assignedToId !== currentUser.id) {
      setWarningMsg(`Ushbu vazifa "${task.assignedToName}" uchun biriktirilgan! Faqatgina biriktirilgan a'zo belgilay oladi.`);
      return;
    }
    onToggleTask(task.id, currentUser.id);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center space-x-2">
            <CheckSquare className="w-6 h-6 text-blue-500" />
            <span>Vazifalar Boshqaruvi</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Guruh a'zolari uchun vazifalar yaratish va ijrosini nazorat qilish
          </p>
        </div>
      </div>

      {warningMsg && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          <span>{warningMsg}</span>
        </div>
      )}

      {/* Create Task Form */}
      <div className={`p-6 rounded-3xl border ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      } shadow-sm space-y-4`}>
        <h2 className="text-sm font-bold flex items-center space-x-2">
          <Plus className="w-4 h-4 text-blue-500" />
          <span>Yangi Vazifa Yaratish</span>
        </h2>

        <form onSubmit={handleCreateTask} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Vazifa Sarlavhasi</label>
              <input 
                id="task-title-input"
                type="text"
                required
                placeholder="Masalan: Frontend re-designini tugatish..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Kim uchun biriktirilsin?</label>
              <select
                id="task-assigned-select"
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-blue-500"
              >
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.role.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Vazifa Tavsifi</label>
            <textarea
              id="task-desc-textarea"
              rows={2}
              placeholder="Vazifa bo'yicha batafsil ko'rsatma..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <button
            id="task-submit-btn"
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md active:scale-95"
          >
            Vazifa Yaratish
          </button>
        </form>
      </div>

      {/* Task Cards List */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-1">
          Barcha Vazifalar Ro'yxati
        </h2>

        {tasks.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Hozircha vazifalar mavjud emas.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.map((task) => {
              const isAssignedToMe = task.assignedToId === currentUser.id;
              const canEditOrDelete = task.createdById === currentUser.id || currentUser.role === 'engineer';
              const isEditing = editingTaskId === task.id;

              return (
                <div 
                  key={task.id}
                  className={`p-5 rounded-3xl border transition flex flex-col justify-between space-y-4 ${
                    task.completed
                      ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-80'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  } shadow-sm`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      
                      {/* Checkbox */}
                      <button
                        id={`task-toggle-btn-${task.id}`}
                        onClick={() => handleToggleClick(task)}
                        className={`w-6 h-6 rounded-xl border flex items-center justify-center flex-shrink-0 transition mt-0.5 ${
                          task.completed
                            ? 'bg-green-600 border-green-600 text-white'
                            : isAssignedToMe
                              ? 'border-blue-500 hover:bg-blue-500/10'
                              : 'border-slate-300 dark:border-slate-700 cursor-not-allowed opacity-60'
                        }`}
                        title={isAssignedToMe ? "Bajarildi deb belgilash" : t.onlyAssignedCanComplete}
                      >
                        {task.completed && <Check className="w-4 h-4 stroke-[3]" />}
                      </button>

                      <div className="flex-grow">
                        {isEditing ? (
                          <div className="space-y-2">
                            <input 
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full p-2 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 border focus:outline-none"
                            />
                            <textarea
                              rows={2}
                              value={editDesc}
                              onChange={(e) => setEditDesc(e.target.value)}
                              className="w-full p-2 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 border focus:outline-none resize-none"
                            />
                            <div className="flex items-center space-x-2 pt-1">
                              <button
                                onClick={() => saveEdit(task)}
                                className="px-3 py-1 rounded-lg bg-green-600 hover:bg-green-500 text-white text-[10px] font-bold flex items-center space-x-1"
                              >
                                <Save className="w-3 h-3" />
                                <span>Saqlash</span>
                              </button>
                              <button
                                onClick={() => setEditingTaskId(null)}
                                className="px-3 py-1 rounded-lg bg-slate-600 hover:bg-slate-500 text-white text-[10px] font-bold flex items-center space-x-1"
                              >
                                <X className="w-3 h-3" />
                                <span>Bekor qilish</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <h3 className={`text-sm font-bold ${task.completed ? 'line-through text-slate-400' : ''}`}>
                              {task.title}
                            </h3>
                            {task.description && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {task.description}
                              </p>
                            )}
                          </>
                        )}
                      </div>

                      {/* Edit and Delete buttons if allowed */}
                      {canEditOrDelete && !isEditing && (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => startEdit(task)}
                            className="text-slate-400 hover:text-blue-500 transition p-1"
                            title="Tahrirlash"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            id={`task-delete-btn-${task.id}`}
                            onClick={() => onDeleteTask(task.id)}
                            className="text-slate-400 hover:text-red-500 transition p-1"
                            title="O'chirish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Task Metadata */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[10px]">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400">{t.createdBy}:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{task.createdByName}</span>
                    </div>

                    <div className="flex items-center space-x-1.5 px-2 py-1 rounded-lg bg-blue-500/10 text-blue-500 font-bold">
                      <UserCheck className="w-3 h-3" />
                      <span>{t.assignedTo}: {task.assignedToName}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
