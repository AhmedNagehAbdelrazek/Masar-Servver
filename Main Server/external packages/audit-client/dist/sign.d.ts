export interface SignedHeaders {
    'X-Audit-Service-Id': string;
    'X-Audit-Client-Key': string;
    'X-Audit-Timestamp': string;
    'X-Audit-Signature': string;
}
export declare function signAuditRequest(params: {
    serviceId: string;
    clientKey: string;
    clientSecret: string;
    body: string;
}): SignedHeaders;
//# sourceMappingURL=sign.d.ts.map