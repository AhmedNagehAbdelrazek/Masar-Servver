export function resolveLocaleMode(req) {
    const fromQuery = req.query?.lang ?? req.query?.locale;
    if (fromQuery === 'ar' || fromQuery === 'en' || fromQuery === 'both')
        return fromQuery;
    const header = req.headers?.['accept-language'];
    if (typeof header === 'string') {
        const first = header.split(',')[0]?.trim().toLowerCase() ?? '';
        if (first === 'en' || first === 'ar' || first === 'both')
            return first;
        if (first.startsWith('ar'))
            return 'ar';
        if (first.startsWith('en'))
            return 'en';
    }
    const env = (process.env.APP_LOCALE ?? 'ar').toLowerCase();
    if (env === 'en' || env === 'both')
        return env;
    return 'ar';
}
//# sourceMappingURL=locale.js.map