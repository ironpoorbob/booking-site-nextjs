"use client";

import { useMemo, useState } from "react";

type ShowTimeFieldsProps = {
  initialShowTime: string;
  initialUse24HourClock: boolean;
};

function parseInitialShowTime(showTime: string, use24HourClock: boolean) {
  const match = showTime.match(/^(\d{1,2}):(\d{2})$/);

  if (!match) {
    return {
      hour24: "20",
      minute: "00",
      meridiem: "PM",
    };
  }

  const hourNum = Number(match[1]);
  const minute = match[2];
  const clampedHour = Number.isFinite(hourNum) ? Math.min(23, Math.max(0, hourNum)) : 20;

  if (use24HourClock) {
    return {
      hour24: String(clampedHour).padStart(2, "0"),
      minute,
      meridiem: clampedHour >= 12 ? "PM" : "AM",
    };
  }

  const meridiem = clampedHour >= 12 ? "PM" : "AM";
  const hour12 = clampedHour % 12 === 0 ? 12 : clampedHour % 12;

  return {
    hour24: String(clampedHour).padStart(2, "0"),
    minute,
    meridiem,
    hour12: String(hour12),
  };
}

function toHour24(hour: string, meridiem: string): string {
  const hourNum = Number(hour);

  if (meridiem === "AM") {
    return String(hourNum === 12 ? 0 : hourNum).padStart(2, "0");
  }

  return String(hourNum === 12 ? 12 : hourNum + 12).padStart(2, "0");
}

export default function ShowTimeFields({
  initialShowTime,
  initialUse24HourClock,
}: ShowTimeFieldsProps) {
  const parsed = parseInitialShowTime(initialShowTime, initialUse24HourClock);

  const [use24HourClock, setUse24HourClock] = useState(initialUse24HourClock);
  const [hour24, setHour24] = useState(parsed.hour24);
  const [hour12, setHour12] = useState(parsed.hour12 ?? "8");
  const [minute, setMinute] = useState(["00", "15", "30", "45"].includes(parsed.minute) ? parsed.minute : "00");
  const [meridiem, setMeridiem] = useState(parsed.meridiem);

  const showTimeValue = useMemo(() => {
    const hour = use24HourClock ? hour24 : toHour24(hour12, meridiem);
    return `${hour}:${minute}`;
  }, [use24HourClock, hour24, hour12, meridiem, minute]);

  return (
    <>
      <input type="hidden" name="showTime" value={showTimeValue} />

      <label className="form-group w-full sm:w-auto">
        <span>Show Time</span>
        <div className="flex flex-nowrap items-center gap-2 whitespace-nowrap overflow-x-auto">
          {use24HourClock ? (
            <select
              className="form-input w-[5rem] min-w-[5rem]"
              style={{ width: "5rem", minWidth: "5rem" }}
              value={hour24}
              onChange={(event) => setHour24(event.target.value)}
            >
              {Array.from({ length: 24 }).map((_, index) => {
                const value = String(index).padStart(2, "0");
                return (
                  <option key={value} value={value}>
                    {value}
                  </option>
                );
              })}
            </select>
          ) : (
            <>
              <select
                className="form-input w-[4.5rem] min-w-[4.5rem]"
                style={{ width: "4.5rem", minWidth: "4.5rem" }}
                value={hour12}
                onChange={(event) => setHour12(event.target.value)}
              >
                {Array.from({ length: 12 }).map((_, index) => {
                  const value = String(index + 1);
                  return (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  );
                })}
              </select>
              <select
                className="form-input w-[5rem] min-w-[5rem]"
                style={{ width: "5rem", minWidth: "5rem" }}
                value={meridiem}
                onChange={(event) => setMeridiem(event.target.value)}
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </>
          )}

          <span className="text-zinc-300">:</span>
          <select
            className="form-input w-[5rem] min-w-[5rem]"
            style={{ width: "5rem", minWidth: "5rem" }}
            value={minute}
            onChange={(event) => setMinute(event.target.value)}
          >
            <option value="00">00</option>
            <option value="15">15</option>
            <option value="30">30</option>
            <option value="45">45</option>
          </select>

          <label className="ml-2 inline-flex items-center gap-2 text-sm text-zinc-200">
            <input
              type="checkbox"
              name="showClock24"
              value="1"
              checked={use24HourClock}
              onChange={(event) => setUse24HourClock(event.target.checked)}
            />
            24 hour clock
          </label>
        </div>
      </label>
    </>
  );
}
