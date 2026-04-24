export interface ApiSuccessResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: boolean;
  message: string;
  errors?: any;
}

export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedData<T> {
  items: T[];
  meta: PaginatedMeta;
}

export class ApiResponseHelper {
  static success<T>(data: T, message = 'Operation successful'): ApiSuccessResponse<T> {
    return {
      success: true,
      message,
      data,
    };
  }

  static error(message: string, errors?: any): ApiErrorResponse {
    return {
      success: false,
      message,
      errors,
    };
  }

  static created<T>(data: T, message = 'Created successfully'): ApiSuccessResponse<T> {
    return {
      success: true,
      message,
      data,
    };
  }

  static updated<T>(data: T, message = 'Updated successfully'): ApiSuccessResponse<T> {
    return {
      success: true,
      message,
      data,
    };
  }

  static deleted(message = 'Deleted successfully'): ApiSuccessResponse<null> {
    return {
      success: true,
      message,
      data: null,
    };
  }

  static paginated<T>(
    items: T[],
    total: number,
    page: number,
    limit: number,
    message = 'Data retrieved successfully',
  ): ApiSuccessResponse<PaginatedData<T>> {
    return {
      success: true,
      message,
      data: {
        items,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  static notFound(message = 'Resource not found'): ApiErrorResponse {
    return {
      success: false,
      message,
    };
  }

  static unauthorized(message = 'Unauthorized'): ApiErrorResponse {
    return {
      success: false,
      message,
    };
  }

  static forbidden(message = 'Forbidden'): ApiErrorResponse {
    return {
      success: false,
      message,
    };
  }

  static badRequest(message: string, errors?: any): ApiErrorResponse {
    return {
      success: false,
      message,
      errors,
    };
  }
}