import React from 'react';
import TaskCard from './TaskCard';

export const TaskList = ({ tasks, onUpdate, onDelete }) => {
  // Empty State View
  if (!tasks || tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-dark-card border border-slate-250 dark:border-dark-border rounded-2xl shadow-sm transition-all duration-300">
        <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/20 text-brand-500 dark:text-brand-400 flex items-center justify-center mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
          No tasks found
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
          Create one manually or type your mind into the Smart Capture bar!
        </p>
      </div>
    );
  }

  // Categorize tasks into status/date sections
  const todayTasks = [];
  const upcomingTasks = [];
  const completedTasks = [];

  tasks.forEach((task) => {
    if (task.status === 'completed') {
      completedTasks.push(task);
    } else {
      const due = (task.due_date || '').toLowerCase().trim();
      if (due === 'today' || due.includes('today')) {
        todayTasks.push(task);
      } else {
        upcomingTasks.push(task);
      }
    }
  });

  const renderSection = (title, list, indicatorColor) => {
    if (list.length === 0) return null;
    return (
      <div className="space-y-3.5">
        <div className="flex items-center space-x-2">
          <span className={`w-2 h-2 rounded-full ${indicatorColor}`} />
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {title} &middot; {list.length}
          </h2>
        </div>
        <div className="space-y-3.5">
          {list.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {renderSection("Today's Priorities", todayTasks, 'bg-amber-500')}
      {renderSection('Upcoming Tasks', upcomingTasks, 'bg-brand-500')}
      {renderSection('Completed', completedTasks, 'bg-emerald-500')}
    </div>
  );
};

export default TaskList;
