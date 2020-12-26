/** */

export class SDKApiServiceBuilder {
  constructor(
    private controllerName: string,
    private basePath: string,
    private controllerNameProvider?: (name: string) => string
  ) {}

  get name() {
    if (this.controllerNameProvider) {
      return this.controllerNameProvider(this.controllerName);
    }

    return this.controllerName;
  }

  get path() {
    return this.basePath;
  }
}
