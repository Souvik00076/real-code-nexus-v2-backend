import express, { Express } from 'express';
import { CatchAllError } from 'lib/error/error.catch_all';
import { MainRouter } from 'lib/routes/routes.main';
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
      this.app.use("/api/v1", new MainRouter("/").getRouter());
      this.app.use(new CatchAllError().execute);
    }
    return this.app;
  }
}

