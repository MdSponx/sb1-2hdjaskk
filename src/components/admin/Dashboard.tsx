import React from 'react';
import { BarChart3, Users, FolderGit2, FileCheck2 } from 'lucide-react';

export function AdminDashboard() {
  const stats = [
    {
      title: 'Total Users',
      value: '2,543',
      change: '+12.5%',
      icon: Users,
    },
    {
      title: 'Active Projects',
      value: '45',
      change: '+23.1%',
      icon: FolderGit2,
    },
    {
      title: 'Submissions',
      value: '1,234',
      change: '+4.3%',
      icon: FileCheck2,
    },
    {
      title: 'Conversion Rate',
      value: '48.8%',
      change: '+8.2%',
      icon: BarChart3,
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <Icon className="h-6 w-6 text-brand-primary" />
                <span className={`text-sm font-medium ${
                  stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-500">{stat.title}</h3>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{stat.value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}