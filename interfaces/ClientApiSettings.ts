export interface ClientApiSettings {
  disabled?: boolean;
  outputDir?: string;
  templateFile?: string;
  controllerNameProvider?: (controllerName: string) => string;
}
