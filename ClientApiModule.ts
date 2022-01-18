import {
  BeforeRoutesInit,
  Configuration,
  Inject,
  InjectorService,
  Module,
  OnReady,
  PlatformApplication,
} from "@tsed/common";
import { ClientApiSettings } from "./interfaces/ClientApiSettings";
import { ClientApiService } from "./services/ClientApiService";
import path from "path";
import chalk from "chalk";

export const Messages = {
  REMINDER_DISABLE_IN_PRODUCTION: chalk.yellow(
    "Client API Generation is enabled. Don't forget to disable it in production!"
  ),
  UNDEFINED_OUTPUT_DIR: (dir: string) =>
    `No output dir specified, generating the client api in '${dir}'`,
};

@Module()
export class ClientApiModule implements BeforeRoutesInit, OnReady {
  @Inject()
  injector: InjectorService;

  @Inject()
  app: PlatformApplication;

  @Configuration()
  configuration: Configuration;

  @Inject()
  clientApiService: ClientApiService;

  private loaded = false;

  get settings() {
    return this.configuration.get<ClientApiSettings>("clientApi");
  }

  $beforeRoutesInit(): void | Promise<any> {
    if (this.loaded) {
      return;
    }

    const settings = this.settings;

    if (!settings || settings.disabled === true) {
      return;
    }

    this.loaded = true;
  }

  $onReady(): void | Promise<any> {
    const { injector } = this;

    if (!this.loaded) {
      return;
    }

    const settings = this.settings;

    injector.logger.warn(Messages.REMINDER_DISABLE_IN_PRODUCTION);
    injector.logger.debug("Generating client SDK...");

    if (!settings.outputDir) {
      injector.logger.warn(Messages.UNDEFINED_OUTPUT_DIR(this.outputDir));
    }

    return this.clientApiService.build({
      templateFile: this.templateFile,
      outputDir: this.outputDir,
      controllerNameProvider: settings.controllerNameProvider,
    });
  }

  get outputDir(): string {
    if (!!this.settings.outputDir) {
      return this.settings.outputDir;
    }

    const distFolder = "dist";

    if (require.main && require.main.filename) {
      return path.join(path.dirname(require.main.filename), distFolder);
    }

    return path.join(path.dirname(__filename), distFolder);
  }

  get templateFile(): string {
    if (!!this.settings.templateFile) {
      return this.settings.templateFile;
    }

    return path.join(__dirname, "templates/api.ejs");
  }

  get isLoaded(): boolean {
    return this.loaded;
  }
}
