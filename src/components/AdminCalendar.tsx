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
  /** לינק לפרטי אירוע — ברירת מחדל אדמין */
  eventsHrefPrefix = "/admin/events",
}: {
  events: EventItem[];
  currentMonth: Date;
  onMonthChange: (d: Date) => void;
  eventsHrefPrefix?: string;
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
    <div className="rounded-2xl border border-[#d4af37]/30 bg-zinc-950/55 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-white/[0.04] backdrop-blur-xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-gradient-gold">לוח שנה שנתי</h2>
        <div className="flex items-center gap-2">
          <select
            value={year}
            onChange={(e) => onMonthChange(new Date(parseInt(e.target.value), month))}
            className="rounded-lg border border-[#d4af37]/35 bg-black/50 px-3 py-2 text-sm text-white backdrop-blur-sm focus:border-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/20"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={prevMonth}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d4af37]/35 bg-zinc-950/60 text-white transition hover:border-[#d4af37]"
          >
            ←
          </button>
          <span className="min-w-[120px] text-center font-medium text-zinc-200">
            {currentMonth.toLocaleDateString("he-IL", { month: "long" })}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d4af37]/35 bg-zinc-950/60 text-white transition hover:border-[#d4af37]"
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
                hasEvents ? "bg-[#d4af37]/20 border border-[#d4af37]/50" : "bg-[#111111]/80"
              } ${today ? "ring-2 ring-[#d4af37] ring-offset-1 ring-offset-zinc-950" : ""}`}
            >
              <span className="text-sm font-medium text-white">{day}</span>
              {hasEvents && (
                <div className="mt-1 flex w-full flex-col gap-0.5 overflow-hidden">
                  {dayEvents.slice(0, 2).map((e) => (
                    <Link
                      key={e.id}
                      href={`${eventsHrefPrefix}/${e.id}`}
                      className="truncate px-1 text-center text-[10px] text-[#f0a8a8] hover:text-[#fecaca]"
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

      <div className="mt-4 pt-4 border-t border-[#d4af37]/20">
        <p className="text-zinc-500 text-sm">
          לחיצה על תאריך עם אירועים — מעבר לפרטי האירוע וההזמנות
        </p>
      </div>
    </div>
  );
}
