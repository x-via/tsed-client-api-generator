import { ParamTypes } from "@tsed/common";

export interface ParamModel {
  name: string;
  required: boolean;
  paramType: ParamTypes;
  type: string;
}
