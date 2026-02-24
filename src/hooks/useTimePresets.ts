import { useState, useEffect } from "react";

export interface TimePreset {
  label: string;
  start: string;
  end: string;
}

const DEFAULT_TIME_PRESETS: TimePreset[] = [
  { label: "9am - 10am", start: "09:00", end: "10:00" },
  { label: "10am - 11am", start: "10:00", end: "11:00" },
  { label: "1pm - 2pm", start: "13:00", end: "14:00" },
  { label: "3pm - 4pm", start: "15:00", end: "16:00" },
];

const PRESETS_STORAGE_KEY = "faculty_consultation_time_presets";

export function useTimePresets() {
  const [presets, setPresets] = useState<TimePreset[]>(DEFAULT_TIME_PRESETS);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PRESETS_STORAGE_KEY);
      if (stored) {
        setPresets(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load time presets", error);
    }
  }, []);

  const addPreset = (start: string, end: string) => {
    if (!start || !end) return;

    // Check if preset already exists
    if (presets.some((p) => p.start === start && p.end === end)) {
      return;
    }

    // Generate a simple label like "9am - 12pm"
    const formatTime = (time: string) => {
      let [hours, minutes] = time.split(":").map(Number);
      const ampm = hours >= 12 ? "pm" : "am";
      hours = hours % 12 || 12;
      return `${hours}${minutes > 0 ? ":" + minutes : ""}${ampm}`;
    };

    const newLabel = `${formatTime(start)} - ${formatTime(end)}`;
    const newPreset = { label: newLabel, start, end };
    
    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updatedPresets));
  };

  const removePreset = (labelToRemove: string) => {
    const updatedPresets = presets.filter((p) => p.label !== labelToRemove);
    setPresets(updatedPresets);
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updatedPresets));
  };

  return { presets, addPreset, removePreset };
}
