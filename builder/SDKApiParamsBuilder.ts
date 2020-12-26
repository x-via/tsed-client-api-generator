import { Type } from "@tsed/core";
import { ParamMetadata, ParamTypes } from "@tsed/common";
import { ParamModel } from "../interfaces/ParamModel";

export class SDKApiParamsBuilder {
  injectedParams: ParamModel[];
  hasBody: boolean;
  hasQueryParams: boolean;

  constructor(private target: Type<any>, methodClassName: string) {
    this.injectedParams = ParamMetadata.getParams(target, methodClassName)
      .filter((param) => {
        if (param.paramType === ParamTypes.BODY) {
          this.hasBody = true;
        }

        if (param.paramType === ParamTypes.QUERY) {
          this.hasQueryParams = true;
        }

        return !param.store.get("hidden");
      })
      .map(this.build);
  }

  build = (param: ParamMetadata): ParamModel => {
    return {
      name: param.expression,
      required: param.required,
      paramType: param.paramType as ParamTypes,
      type: this.getType(param.schema.get("type")),
    };
  };

  transformRequired = (param: ParamModel): ParamModel => {
    if (param.paramType === ParamTypes.PATH) {
      return {
        ...param,
        required: true,
        type: this.getType(param.type),
      };
    }

    return {
      ...param,
      name: param.name,
      required: param.required,
    };
  };

  transformHeaderParams = (param: ParamModel): ParamModel => {
    if (param.paramType === ParamTypes.HEADER) {
      return {
        ...param,
        // Header params must be string
        type: "string",
        // Header params can't be undefined
        required: true,
      };
    }

    return param;
  };

  get bodyParams(): ParamModel[] {
    return this.params.filter((p) => p.paramType === ParamTypes.BODY);
  }

  get headers(): ParamModel[] {
    return this.params.filter((p) => p.paramType === ParamTypes.HEADER);
  }

  get params(): ParamModel[] {
    return (
      this.injectedParams
        .filter((p) => !!p.name)
        .map(this.transformRequired)
        .map(this.transformHeaderParams)
        // Required parameters comes first
        .sort((x, y) => {
          return x.required === y.required ? 0 : x.required ? -1 : 1;
        })
    );
  }

  getType(type: string) {
    if (type === "object") {
      return "any";
    }
    return type;
  }
}
