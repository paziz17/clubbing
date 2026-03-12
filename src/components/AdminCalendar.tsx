"use client";

import Link from "next/link";

interface EventItem {
  id: string;
  name: string;
  date: string;
  time: string | null;
  reservationsCount: number;
  totalPeople: number;
}

const WEEKDAYS = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];

export function AdminCalendar({
  events,
  currentMonth,
  onMonthChange,
}: {
  events: EventItem[];
  currentMonth: Date;
  onMonthChange: (d: Date) => void;
}) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7; // Sunday = 0, we want Sunday at end (RTL)
  const daysInMonth = lastDay.getDate();

  const prevMonth = () => {
    onMonthChange(new Date(year, month - 1));
  };
  const nextMonth = () => {
    onMonthChange(new Date(year, month + 1));
  };

  const getEventsForDay = (day: number) => {
    return events.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  const days: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  return (
    <div className="bg-[#16161d] border border-zinc-800 rounded-2xl p-6">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h2 className="text-lg font-semibold text-white">לוח שנה שנתי</h2>
        <div className="flex items-center gap-2">
          <select
            value={year}
            onChange={(e) => onMonthChange(new Date(parseInt(e.target.value), month))}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button
            onClick={prevMonth}
            className="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center"
          >
            ←
          </button>
          <span className="text-white font-medium min-w-[120px] text-center">
            {currentMonth.toLocaleDateString("he-IL", { month: "long" })}
          </span>
          <button
            onClick={nextMonth}
            className="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-zinc-500 text-sm py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="aspect-square" />;
          }
          const dayEvents = getEventsForDay(day);
          const hasEvents = dayEvents.length > 0;
          const today =
            new Date().getDate() === day &&
            new Date().getMonth() === month &&
            new Date().getFullYear() === year;

          return (
            <div
              key={day}
              className={`aspect-square rounded-lg p-1 flex flex-col items-center justify-center min-h-[48px] ${
                hasEvents ? "bg-rose-500/20 border border-rose-500/50" : "bg-zinc-800/50"
              } ${today ? "ring-2 ring-rose-500" : ""}`}
            >
              <span className="text-white text-sm font-medium">{day}</span>
              {hasEvents && (
                <div className="flex flex-col gap-0.5 mt-1 w-full overflow-hidden">
                  {dayEvents.slice(0, 2).map((e) => (
                    <Link
                      key={e.id}
                      href={`/admin/events/${e.id}`}
                      className="text-[10px] text-rose-400 hover:text-rose-300 truncate px-1 text-center"
                      title={`${e.name} - ${e.reservationsCount} הזמנות`}
                    >
                      {e.name.slice(0, 8)}…
                    </Link>
                  ))}
                  {dayEvents.length > 2 && (
                    <span className="text-zinc-500 text-[10px]">+{dayEvents.length - 2}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-zinc-800">
        <p className="text-zinc-500 text-sm">
          לחיצה על תאריך עם אירועים — מעבר לפרטי האירוע וההזמנות
        </p>
      </div>
    </div>
  );
}
