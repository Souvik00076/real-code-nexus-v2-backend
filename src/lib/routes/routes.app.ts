import { AppController } from "lib/controller/controller.app";
import { BaseRouter } from "./routes.base";

export class AppRouter extends BaseRouter {
  constructor(path: string) {
    super(path);
  }
  protected initializeRoutes(): void {
    const router = this.getRouter();
    router.post('/', new AppController().post);
  }
}
