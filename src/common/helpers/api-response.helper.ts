export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export class ApiResponseHelper {
  static success<T>(data: T, message = 'Operation successful'): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
    };
  }

  static error(message: string, data: any = null): ApiResponse {
    return {
      success: false,
      message,
      data,
    };
  }

  static created<T>(data: T, message = 'Created successfully'): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
    };
  }

  static updated<T>(data: T, message = 'Updated successfully'): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
    };
  }

  static deleted(message = 'Deleted successfully'): ApiResponse {
    return {
      success: true,
      message,
      data: null,
    };
  }

  static notFound(message = 'Resource not found'): ApiResponse {
    return {
      success: false,
      message,
      data: null,
    };
  }

  static unauthorized(message = 'Unauthorized'): ApiResponse {
    return {
      success: false,
      message,
      data: null,
    };
  }

  static forbidden(message = 'Forbidden'): ApiResponse {
    return {
      success: false,
      message,
      data: null,
    };
  }

  static badRequest(message: string): ApiResponse {
    return {
      success: false,
      message,
      data: null,
    };
  }

  static paginated<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
    message = 'Data retrieved successfully',
  ): ApiResponse<{ items: T[]; total: number; page: number; limit: number; totalPages: number }> {
    return {
      success: true,
      message,
      data: {
        items: data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}