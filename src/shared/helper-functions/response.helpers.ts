export class ResponseHelper {
  static success(message: string, data: any = null, meta: any = null) {
    return {
      success: true,
      message,
      data,
      length: Array.isArray(data) ? data.length : undefined,
      meta: meta || undefined,
      statusCode: 200
    };
  }

  static created(message: string, data: any = null, meta: any = null) {
    return {
      success: true,
      message,
      data,
      length: Array.isArray(data) ? data.length : undefined,
      meta: meta || undefined,
      statusCode: 201
    };
  }

  static error(message: string, error: any = null, statusCode = 400): { success: false; message: string; error: any; statusCode: number } {
    return {
      success: false,
      message,
      error,
      statusCode,
    };
  }
}


