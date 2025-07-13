import { ExpressLoader } from "./loader.express";
import { WebsocketServer } from "./loaders.ws";

export async function baseLoader() {
  const expressServer = ExpressLoader.init();
  const server = expressServer.listen(3000, () => {
    console.log("Express listening at port 3000");
  });
  WebsocketServer.init(server);
}
