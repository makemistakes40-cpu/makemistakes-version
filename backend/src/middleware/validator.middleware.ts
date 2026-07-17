import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { BadRequestError } from '../utils/app-error';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      // Assign parsed parts back to the request
      req.body = parsed.body;
      req.query = parsed.query;
      req.params = parsed.params;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((e) => `${e.path.slice(1).join('.')}: ${e.message}`).join(' | ');
        next(new BadRequestError(`Validation Failed: ${details}`));
      } else {
        next(error);
      }
    }
  };
};
