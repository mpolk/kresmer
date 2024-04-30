import { defineConfig } from "cypress";
import * as fs from "node:fs";
import * as path from "node:path";

export default defineConfig({
  component: {
    devServer: {
      framework: "vue",
      bundler: "vite",
    }, //devServer

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setupNodeEvents(on, config) {
      on('task', {
        loadLibraries() {
          const libDir = "./lib";
          const libs = {};
          const libFilePaths = fs.readdirSync(libDir);
          libFilePaths.forEach(filePath => {
            const matches = filePath.match(/(.*)\.krel$/);
            if (matches) {
              const libName = matches[1];
              const libData = fs.readFileSync(path.join(libDir, filePath), "utf8");
              libs[libName] = libData;
            }//if
          });
          return libs;
        },//loadLibraries
      })//on task
    },//setupNodeEvents
  }//component
});
