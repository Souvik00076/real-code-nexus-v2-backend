

import express, { Express } from 'express';

export class ExpressLoader {
  private static app: Express;

  public static init(): Express {
    if (!this.app) {
      this.app = express();
      this.app.use(express.json());
      this.app.use(express.urlencoded({ extended: true }));
      this.app.get('/health', (_req, res) => {
        res.status(200).send({ status: 'ok' });
      });
    }
    return this.app;
  }
}

