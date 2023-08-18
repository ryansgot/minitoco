

export const minutesToSeconds = (minutes: number) => minutes * 60;
export const hoursToSeconds = (hours: number) => hours * minutesToSeconds(60);
export const daysToSeconds = (days: number) => days * hoursToSeconds(24);
export const weeksToSeconds = (weeks: number) => weeks * daysToSeconds(7);
export const secondsToMilliseconds = (seconds: number) => seconds * 1000; 