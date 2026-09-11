import React from 'react';

export default function StatCard({ title, value, icon: Icon, color = 'blue', trend = '+12% this week' }) {
  const colorMap = {
    blue: 'border-l-brand-royal text-brand-royal bg-blue-50/50',
    amber: 'border-l-amber-500 text-amber-600 bg-amber-50/50',
    emerald: 'border-l-emerald-500 text-emerald-600 bg-emerald-50/50',
    purple: 'border-l-purple-500 text-purple-600 bg-purple-50/50',
    indigo: 'border-l-indigo-500 text-indigo-600 bg-indigo-50/50'
  };

  const selectedColor = colorMap[color] || colorMap.blue;

  return (
    <div className={`bg-white rounded-2xl p-5 border border-slate-200 border-l-4 ${selectedColor.split(' ')[0]} shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-extrabold text-brand-dark mt-1 tracking-tight">{value}</h3>
          {trend && (
            <p className="text-[11px] font-medium text-slate-500 mt-1 flex items-center">
              <span className="text-emerald-600 font-bold mr-1">↑</span>
              {trend}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedColor.split(' ')[2]}`}>
          <Icon className={`w-6 h-6 ${selectedColor.split(' ')[1]}`} />
        </div>
      </div>
    </div>
  );
}
