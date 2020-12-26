import { ParamModel } from "./ParamModel";

export interface EndpointModel {
  name: string;
  interfaceName: string;
  method: string;
  path: string;
  params: ParamModel[];
  bodyParams: ParamModel[];
  headerParams: ParamModel[];
}
