export const JORDAN_OFFSET_MS = 3 * 60 * 60 * 1000;
export function jordanDateOnly(d) {
    const shifted = new Date(new Date(d).getTime() + JORDAN_OFFSET_MS);
    return new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) -
        JORDAN_OFFSET_MS);
}
export function jordanStartOfToday() {
    return jordanDateOnly(new Date());
}
export function jordanMinutesOfDay(d) {
    const shifted = new Date(new Date(d).getTime() + JORDAN_OFFSET_MS);
    return shifted.getUTCHours() * 60 + shifted.getUTCMinutes();
}
export function jordanWeekday(d) {
    return new Date(new Date(d).getTime() + JORDAN_OFFSET_MS).getUTCDay();
}
//# sourceMappingURL=jordan-time.js.map