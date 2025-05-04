import React from 'react';
import { type Project } from '../../types/project';
import { cn } from '../../lib/utils';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

function formatDate(date: string | undefined) {
  if (!date) return '';
  return format(new Date(date), 'd MMMM yyyy', { locale: th });
}

function getDaysUntilDeadline(deadline: string | undefined) {
  if (!deadline) return null;
  const today = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

interface ProjectsGridProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
}

export function ProjectsGrid({ projects, onProjectClick }: ProjectsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => {
        const daysUntilDeadline = project.applicationDeadline ? getDaysUntilDeadline(project.applicationDeadline) : null;
        const isDeadlineSoon = daysUntilDeadline !== null && daysUntilDeadline <= 7 && daysUntilDeadline > 0;
        const isDeadlinePassed = daysUntilDeadline !== null && daysUntilDeadline <= 0;

        return (
          <div
            key={project.id}
            onClick={() => onProjectClick(project)}
            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden flex flex-col"
          >
            <div className="relative h-48">
              <img
                src={project.imageUrl}
                alt={project.title}
                className="w-full h-full object-cover"
              />
              {/* Status Badge */}
              {project.status && (
                <div className="absolute top-4 right-4">
                  <span
                    className={cn(
                      "px-3 py-1 rounded-full text-sm font-medium shadow-sm",
                      {
                        'bg-yellow-100 text-yellow-800': project.status === 'coming-soon',
                        'bg-green-100 text-green-800': project.status === 'open',
                        'bg-blue-100 text-blue-800': project.status === 'reviewing',
                        'bg-red-100 text-red-800': project.status === 'closed',
                      }
                    )}
                  >
                    {project.status === 'coming-soon' && 'เร็วๆ นี้'}
                    {project.status === 'open' && 'เปิดรับสมัคร'}
                    {project.status === 'reviewing' && 'กำลังพิจารณา'}
                    {project.status === 'closed' && 'ปิดรับสมัคร'}
                  </span>
                </div>
              )}
              {/* Project Tags */}
              <div className="absolute bottom-4 right-4">
                {project.tags.map(tag => (
                  tag === 'CineBridge' ? (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full text-sm font-medium bg-emerald-800 text-white"
                    >
                      {tag}
                    </span>
                  ) : tag === 'NextFrame' ? (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full text-sm font-medium bg-brand-violet text-white"
                    >
                      {tag}
                    </span>
                  ) : null
                ))}
              </div>
              {/* Deadline Overlay */}
              {project.applicationDeadline && (
                <div className={cn(
                  "absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent",
                  isDeadlineSoon && "animate-bounce"
                )}>
                  <div className="flex items-center gap-2 text-white">
                    <Clock className={cn(
                      "w-4 h-4",
                      isDeadlineSoon && "animate-pulse"
                    )} />
                    <span className={cn(
                      "text-sm font-medium",
                      isDeadlineSoon && "animate-pulse"
                    )}>
                      {isDeadlinePassed ? 'ปิดรับสมัครแล้ว' :
                       isDeadlineSoon ? `เหลือเวลาอีก ${daysUntilDeadline} วัน` :
                       `ปิดรับสมัคร ${formatDate(project.applicationDeadline)}`}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 flex-1 flex flex-col">
              <h3 className="text-lg font-semibold text-brand-navy mb-3 line-clamp-2">
                {project.title}
              </h3>

              {(project.startDate || project.endDate || project.venueName || project.province) && (
                <div className="space-y-2 mt-auto text-sm">
                  {(project.startDate || project.endDate) && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>
                        {project.startDate && formatDate(project.startDate)}
                        {project.endDate && ` - ${formatDate(project.endDate)}`}
                      </span>
                    </div>
                  )}
                  
                  {(project.venueName || project.province) && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span>
                        {project.venueName}
                        {project.province && ` ${project.province}`}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}