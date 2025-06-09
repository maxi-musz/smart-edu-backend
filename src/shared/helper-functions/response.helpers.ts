export class ResponseHelper {
  static success(message: string, data: any = null, meta: any = null) {
    return {
      success: true,
      message,
      data,
      length: Array.isArray(data) ? data.length : undefined,
      meta: meta || undefined,
    };
  }

  static error(message: string, error: any = null, statusCode = 400) {
    return {
      success: false,
      message,
      error,
      statusCode,
    };
  }
}


