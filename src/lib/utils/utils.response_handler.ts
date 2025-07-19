
import type { Response } from "express";
export const sendSuccessResponse = ({
  res,
  statusCode = 200,
  message,
  data,
  metadata,
}: {
  res: Response;
  statusCode?: number;
  message: string;
  data?: any;
  metadata?: any;
}) => {
  res.status(statusCode).json({ success: true, message, data, metadata });
};

export const sendErrorResponse = ({
  res,
  statusCode = 400,
  error,
}: {
  res: Response;
  statusCode?: number;
  error?: Error;
}) => {
  res.status(statusCode).json({
    message: error instanceof Error ? error.message : "Internal server error",
    success: false,
  });
};
