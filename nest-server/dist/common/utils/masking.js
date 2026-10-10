export function maskPhone(phone) {
    if (!phone && phone !== 0)
        return null;
    const str = String(phone).trim();
    if (str.length <= 7)
        return '***';
    return `${str.slice(0, str.length - 7)}***${str.slice(-4)}`;
}
export function maskNationalId(id) {
    if (!id && id !== 0)
        return null;
    const str = String(id).trim();
    if (str.length <= 6)
        return '***';
    return `${str.slice(0, 3)}***${str.slice(-3)}`;
}
//# sourceMappingURL=masking.js.map