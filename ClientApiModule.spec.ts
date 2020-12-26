import { PlatformTest } from "@tsed/common";
import fs from "fs";
import {
  ClientApiBuildParams,
  ClientApiModule,
  ClientApiSettings,
} from "./index";
import { Messages } from "./ClientApiModule";
import path from "path";

jest.mock("fs");
jest.mock("./services/ClientApiService");

const SETTINGS: ClientApiSettings = {
  outputDir: "output_dir",
  templateFile: "template_file",
};

describe("ClientApiModule", () => {
  beforeEach(() =>
    PlatformTest.create({
      clientApi: SETTINGS,
    })
  );
  afterEach(() => jest.resetAllMocks());

  describe("$beforeRoutesInit", () => {
    it("should not run if disabled", async () => {
      await PlatformTest.create({
        clientApi: {
          disabled: true,
        },
      });
      const mod = await PlatformTest.invoke<ClientApiModule>(ClientApiModule);

      mod.$beforeRoutesInit();

      expect(mod.isLoaded).toEqual(false);
    });
    it("should run if not disabled", async () => {
      const mod = await PlatformTest.invoke<ClientApiModule>(ClientApiModule);

      mod.$beforeRoutesInit();

      expect(mod.isLoaded).toEqual(true);
    });
  });

  describe("$onReady", () => {
    it("should not call the builder if the api is not enabled", async () => {
      const mod = await PlatformTest.invoke<ClientApiModule>(ClientApiModule);

      mod.$onReady();

      expect(mod.clientApiService.build).not.toBeCalled();
    });
    it("should call the builder", async () => {
      const mod = await PlatformTest.invoke<ClientApiModule>(ClientApiModule);

      mod.$beforeRoutesInit();
      mod.$onReady();

      expect(mod.clientApiService.build).toBeCalledWith({
        templateFile: SETTINGS.templateFile,
        outputDir: SETTINGS.outputDir,
      } as ClientApiBuildParams);
    });

    it("should use the default template when the template file is not specified", async () => {
      await PlatformTest.create({
        clientApi: {
          ...SETTINGS,
          templateFile: undefined,
        },
      });
      const mod = await PlatformTest.invoke<ClientApiModule>(ClientApiModule);
      jest.spyOn(mod.injector.logger, "warn");

      mod.$beforeRoutesInit();
      mod.$onReady();

      expect(mod.clientApiService.build).toBeCalledWith({
        templateFile: path.join(__dirname, "templates/api.ejs"),
        outputDir: SETTINGS.outputDir,
      } as ClientApiBuildParams);
    });

    it("should warn when the output dir is not specified", async () => {
      await PlatformTest.create({
        clientApi: {
          ...SETTINGS,
          outputDir: undefined,
        },
      });
      const mod = await PlatformTest.invoke<ClientApiModule>(ClientApiModule);
      jest.spyOn(mod.injector.logger, "warn");

      mod.$beforeRoutesInit();
      mod.$onReady();

      expect(mod.injector.logger.warn).toBeCalledWith(
        Messages.UNDEFINED_OUTPUT_DIR(mod.outputDir)
      );
    });
  });
});
