export declare class ComplaintIdParam {
    complaint_id: string;
}
export declare class ResolveComplaintDto {
    status: 'reviewing' | 'resolved' | 'dismissed';
    resolution?: string;
}
