import {
  Configuration,
  EndpointMetadata,
  Injectable,
  InjectorService,
  Platform,
} from "@tsed/common";
import { SDKApiEndpointBuilder } from "../builder/SDKApiEndpointBuilder";
import { SDKApiServiceBuilder } from "../builder/SDKApiServiceBuilder";
import ejs from "ejs";
import fs from "fs";
import chalk from "chalk";
import path from "path";
import { ServiceModel } from "../interfaces/ServiceModel";
import { EndpointModel } from "../interfaces/EndpointModel";

export interface ClientApiBuildParams {
  controllerNameProvider?: (name: string) => string;
  templateFile: string;
  outputDir: string;
}

@Injectable()
export class ClientApiService {
  constructor(
    private injectorService: InjectorService,
    public platform: Platform,
    @Configuration() private configuration: Configuration
  ) {}

  async build(params: ClientApiBuildParams): Promise<void> {
    const { outputDir, templateFile } = params;
    const metadata = this.buildRoutes(params);

    this.prepareOutputDir(outputDir);

    metadata.forEach((service) => {
      this.render(service, templateFile, outputDir);
    });

    this.renderIndex(metadata, outputDir);
  }

  buildRoutes(params: ClientApiBuildParams): ServiceModel[] {
    return this.platform.getMountedControllers().map(({ provider, route }) => {
      const serviceBuilder = new SDKApiServiceBuilder(
        provider.instance.constructor.name,
        route,
        params?.controllerNameProvider
      );

      const serviceName = serviceBuilder.name;

      this.injectorService.logger.debug(`Creating api ${serviceName}`);

      return {
        serviceName,
        route: serviceBuilder.path,
        endpoints: this.buildEndpoints(serviceBuilder.path, provider.endpoints),
      };
    });
  }

  buildEndpoints(
    basePath: string,
    endpoints: EndpointMetadata[] = []
  ): EndpointModel[] {
    const endpointList: EndpointModel[] = [];

    endpoints.filter(this.isEndpointVisible).forEach((endpoint) => {
      const endpointBuilder = new SDKApiEndpointBuilder(endpoint, basePath);

      const name = endpointBuilder.name;

      this.injectorService.logger.debug(
        ` -> Processing endpoint ${chalk.bold(name)}`
      );

      const methods: EndpointModel[] = endpointBuilder.pathMethods;
      methods.forEach((m) => endpointList.push(m));
    });

    return endpointList;
  }

  isEndpointVisible(endpoint: EndpointMetadata) {
    return endpoint.store.get("hidden") !== true;
  }

  async render(service: ServiceModel, templateFile: string, outputDir: string) {
    const rendered = await ejs.renderFile(templateFile, service);
    const filename = `${service.serviceName}.ts`;
    this.writeToFile(path.join(outputDir, filename), rendered);
  }

  async renderIndex(metadata: ServiceModel[], outputDir: string) {
    const rendered = await ejs.renderFile(
      path.join(__dirname, "../templates/index.ejs"),
      { metadata }
    );
    const filename = `index.ts`;
    this.writeToFile(path.join(outputDir, filename), rendered);
  }

  prepareOutputDir(outputDir: string) {
    this.unlinkDir(outputDir);
    fs.mkdirSync(outputDir, { recursive: true });
  }

  writeToFile(file: string, data: string) {
    this.unlinkFile(file);
    fs.writeFileSync(file, data);
  }

  unlinkFile(fileOrDirectory: string) {
    if (fs.existsSync(fileOrDirectory)) {
      fs.unlinkSync(fileOrDirectory);
    }
  }

  unlinkDir(dir: string) {
    if (fs.existsSync(dir)) {
      fs.readdirSync(dir).forEach((file, index) => {
        const curPath = path.join(dir, file);
        if (fs.lstatSync(curPath).isDirectory()) {
          // recurse
          this.unlinkDir(curPath);
        } else {
          // delete file
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(dir);
    }
  }
}
