import react from "@vitejs/plugin-react";
import { exampleConfig } from "../vite.shared";

export default exampleConfig({
  plugins: [react()],
  server: { port: 5175 },
});
