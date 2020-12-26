import { EndpointMetadata, PathParamsType } from "@tsed/common";
import { EndpointModel } from "../interfaces/EndpointModel";
import { SDKApiParamsBuilder } from "./SDKApiParamsBuilder";

export class SDKApiEndpointBuilder {
  suffixIndex: number = 0;
  private builder: SDKApiParamsBuilder;

  constructor(private endpoint: EndpointMetadata, private basePath: string) {
    this.builder = new SDKApiParamsBuilder(
      this.endpoint.target,
      String(this.endpoint.propertyKey)
    );
  }

  get name() {
    return this.endpoint.propertyName;
  }

  get interfaceName() {
    const propertyName = this.endpoint.propertyName;
    return (
      propertyName.charAt(0).toUpperCase() + propertyName.slice(1) + "Params"
    );
  }

  get pathMethods(): EndpointModel[] {
    const endpoints: EndpointModel[] = [];
    for (let [key, operation] of this.endpoint.operationPaths) {
      endpoints.push({
        name: this.name + this.endpointSuffix,
        interfaceName: this.interfaceName,
        method: this.toMethodString(operation.method),
        path: `/${this.toPathString(operation.path)}`,
        params: this.builder.params,
        bodyParams: this.builder.bodyParams,
        headerParams: this.builder.headers,
      });
    }

    return endpoints;
  }

  get endpointSuffix(): string {
    if (this.endpoint.operationPaths.size <= 1) {
      return "";
    }
    return `${++this.suffixIndex}`;
  }

  private toMethodString(method?: string) {
    if (!method) {
      return "GET";
    }
    return method.toUpperCase();
  }

  private toPathString(path: PathParamsType) {
    if (path instanceof RegExp) {
      path = path
        .toString()
        .replace(/^\//, "")
        .replace(/\/$/, "")
        .replace(/\\/, "");
    }

    return `${this.basePath}${path}`
      .split("/")
      .filter((o) => !!o)
      .map((key) => {
        if (key.includes(":")) {
          const clean = key.replace(/[\?|:]/g, "");
          return `\${${clean}}`;
        }

        return key;
      })
      .join("/");
  }
}
