import { defineConfig } from "cypress";
import tasks from "./cypress/tasks.config";

export default defineConfig({
    component: {
        devServer: {
            framework: "vue",
            bundler: "vite",
        }, //devServer

        viewportWidth: 1000,
        viewportHeight: 1000,

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        setupNodeEvents(on, config) {
            on('task', tasks);
        },//setupNodeEvents
    }//component
});
