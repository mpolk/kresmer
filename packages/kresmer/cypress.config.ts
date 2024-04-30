import { defineConfig } from "cypress";
import tasks from "./cypress/support/tasks.config";

export default defineConfig({
    component: {
        devServer: {
            framework: "vue",
            bundler: "vite",
        }, //devServer

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        setupNodeEvents(on, config) {
            on('task', tasks);
        },//setupNodeEvents
    }//component
});
