import { AppController } from "lib/controller/controller.app";
import { BaseRouter } from "./routes.base";

export class AppRouter extends BaseRouter {
  constructor(path: string) {
    super(path);
  }
  protected initializeRoutes(): void {
    const router = this.getRouter();
    const controller = new AppController();
    router.post('/', controller.post);
    router.get('/room_id/contents', controller.get);
  }
}
