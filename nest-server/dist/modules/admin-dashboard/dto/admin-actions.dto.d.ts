export declare class SetDriverStatusDto {
    status: 'active' | 'suspended' | 'pending' | 'blocked';
}
export declare class AccountActionDto {
    action: 'suspend' | 'reactivate' | 'unblock';
    reason?: string | null;
}
export declare class RejectDocumentDto {
    reason?: string | null;
}
