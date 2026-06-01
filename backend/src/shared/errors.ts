export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class BadRequestError extends AppError {
  constructor(code = 'BAD_REQUEST', message = 'Bad request') {
    super(400, code, message)
  }
}

export class UnauthorizedError extends AppError {
  constructor(code = 'UNAUTHORIZED', message = 'Unauthorized') {
    super(401, code, message)
  }
}

export class ForbiddenError extends AppError {
  constructor(code = 'FORBIDDEN', message = 'Forbidden') {
    super(403, code, message)
  }
}

export class NotFoundError extends AppError {
  constructor(code = 'NOT_FOUND', message = 'Not found') {
    super(404, code, message)
  }
}

export class ConflictError extends AppError {
  constructor(code = 'CONFLICT', message = 'Conflict') {
    super(409, code, message)
  }
}
