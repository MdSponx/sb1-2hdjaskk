import React from 'react';

const activities = [
  { title: 'Filmmaking', color: 'bg-yellow-400', size: { cols: 3, rows: 2 }, icon: '🎬' },
  { title: 'Acting', color: 'bg-emerald-500', size: { cols: 4, rows: 1 } },
  { emoji: '⚡', color: 'bg-brand-navy', isCircle: true },
  { title: 'Screenwriting', color: 'border-2 border-brand-navy', size: { cols: 4, rows: 1 } },
  { emoji: '🍿', color: 'bg-emerald-500', isCircle: true },
  { title: 'Production', color: 'bg-brand-navy text-white', size: { cols: 4, rows: 1 } },
  { title: 'Sound', color: 'border-2 border-brand-navy', size: { cols: 3, rows: 1 } },
  { emoji: '🎵', color: 'bg-yellow-400', isCircle: true },
  { title: 'Camera', color: 'bg-brand-navy text-white', size: { cols: 3, rows: 3 }, icon: '📹' },
  { title: 'Effects', color: 'bg-yellow-400', size: { cols: 2, rows: 1 } },
  { emoji: 'ℹ️', color: 'bg-brand-navy', isCircle: true },
  { title: 'Storytelling', color: 'border-2 border-brand-navy', size: { cols: 5, rows: 2 } },
  { title: 'Editing', color: 'bg-emerald-500', size: { cols: 3, rows: 1 } },
  { emoji: '📱', color: 'bg-yellow-400', isCircle: true },
  { title: 'Film Festival', color: 'bg-emerald-500', size: { cols: 4, rows: 2 }, icon: '🏆' },
  { emoji: '🎪', color: 'border-2 border-brand-navy', isCircle: true },
  { title: 'Lighting', color: 'bg-brand-navy text-white', size: { cols: 2, rows: 1 } },
  { title: 'Sets', color: 'border-2 border-brand-navy', size: { cols: 3, rows: 1 } },
  { emoji: '🎯', color: 'bg-brand-navy', isCircle: true },
  { title: 'Screening', color: 'bg-yellow-400', size: { cols: 3, rows: 1 } },
  { title: 'Directing', color: 'bg-brand-navy text-white', size: { cols: 2, rows: 1 } },
  { emoji: '🎭', color: 'bg-emerald-500', isCircle: true },
  { title: 'Costume', color: 'border-2 border-brand-navy', size: { cols: 3, rows: 1 } },
  { title: 'Script Reading', color: 'bg-yellow-400', size: { cols: 4, rows: 1 } },
];

export function Activities() {
  return (
    <section className="py-20 bg-brand-cream">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="heading-2 mb-4">CINEKIDS FILM CAMP SCHEDULE</h2>
          <p className="body-light max-w-2xl mx-auto">
            เรียนรู้และฝึกฝนทักษะการทำภาพยนตร์ครบทุกด้าน ผ่านกิจกรรมที่สนุกและท้าทาย
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <div className="grid grid-cols-12 auto-rows-fr gap-4 aspect-[16/9]">
            {activities.map((activity, index) => {
              if (activity.isCircle) {
                return (
                  <div
                    key={index}
                    className={`col-span-1 ${activity.color} rounded-full flex items-center justify-center text-2xl ${
                      activity.color.includes('brand-navy') ? 'text-emerald-500' : ''
                    }`}
                  >
                    {activity.emoji}
                  </div>
                );
              }

              return (
                <div
                  key={index}
                  className={`col-span-${activity.size.cols} row-span-${activity.size.rows} ${
                    activity.color
                  } rounded-[2rem] flex flex-col items-center justify-center gap-3 px-6 transition-transform hover:scale-[1.02] cursor-pointer`}
                >
                  {activity.icon && (
                    <span className="text-3xl">{activity.icon}</span>
                  )}
                  <span className="font-medium text-xl text-center">
                    {activity.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}