export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
} 

export interface PaginatedResponse<T> extends ApiResponse<T> {
    success: boolean; 
    message: string;
    data: T;
    meta?: PaginationMeta;
}


export interface ErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}