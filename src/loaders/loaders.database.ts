import mongoose from "mongoose";
import { ENV_CONFIG } from "../lib/constants/constants.config";

export class DatabaseLoader {
  private static client: any;
  public static async init() {
    if (!this.client) {
      this.client = await mongoose.connect(ENV_CONFIG.MONGO_URI)
    }
  }

}
