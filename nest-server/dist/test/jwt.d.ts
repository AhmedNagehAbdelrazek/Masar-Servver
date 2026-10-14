export declare function generateAccessToken(user: {
    id: string;
    role: string;
}): string;
export declare function generateRefreshToken(user: {
    id: string;
    role: string;
}): {
    token: string;
    jti: string;
};
export declare function getAuthHeader(token: string): {
    Authorization: string;
};
