import { AppError, BadRequestError, NotFoundError } from './app-error';

describe('AppError Utility Classes', () => {
  it('should construct AppError with correct message and status code', () => {
    const error = new AppError('Custom system warning', 418);
    expect(error.message).toBe('Custom system warning');
    expect(error.statusCode).toBe(418);
    expect(error.status).toBe('fail');
    expect(error.isOperational).toBe(true);
  });

  it('should construct BadRequestError with default message and status 400', () => {
    const error = new BadRequestError();
    expect(error.message).toBe('Bad request');
    expect(error.statusCode).toBe(400);
    expect(error.status).toBe('fail');
  });

  it('should construct NotFoundError with custom message and status 404', () => {
    const error = new NotFoundError('Session record not found');
    expect(error.message).toBe('Session record not found');
    expect(error.statusCode).toBe(404);
    expect(error.status).toBe('fail');
  });
});
