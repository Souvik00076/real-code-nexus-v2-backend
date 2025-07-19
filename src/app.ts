import { baseLoader } from "loaders/loaders.base";
import { DatabaseLoader } from "loaders/loaders.database";

(async () => {
  await DatabaseLoader.init();
  await baseLoader();
})();
