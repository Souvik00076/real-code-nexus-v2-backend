import { AppRouter } from "./routes.app";
import { BaseRouter } from "./routes.base";


export class MainRouter extends BaseRouter {
  constructor(path: string) {
    super(path);
  }
  protected initializeRoutes(): void {
    this.setChildren({ router: new AppRouter('/app') });
    this.registerChildren();
  }
}
