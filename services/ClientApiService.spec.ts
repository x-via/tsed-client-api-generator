import {
  BodyParams,
  Controller,
  Get,
  HeaderParams,
  MulterOptions,
  MultipartFile,
  ParamTypes,
  PathParams,
  PlatformConfiguration,
  PlatformMulterFile,
  PlatformTest,
  Post,
} from "@tsed/common";
import { ClientApiBuildParams, ClientApiService } from "./ClientApiService";
import fs from "fs";
import { ParamModel } from "../interfaces/ParamModel";
import { Required, Hidden } from "@tsed/schema";

jest.mock("fs");
jest.mock("ejs");

const endpointName = "test";
@Controller(endpointName)
export class TestCtrl {
  @Get("/:id")
  findAll(
    @PathParams("id") id: string,
    @Required() @HeaderParams("timestamp") timestamp: number
  ): string {
    return "";
  }

  @Post("/elements")
  addTest(
    @PathParams("id") id: string,
    @BodyParams("user") user: { name: string },
    @Required() @BodyParams("requiredParam") requiredParam: string,
    @HeaderParams("timestamp") timestamp: number
  ): string {
    return "";
  }

  @Post("/hidden")
  @MulterOptions({ dest: "" })
  @Hidden()
  private hiddenApi(
    @MultipartFile("hiddenParam") file: PlatformMulterFile
  ): string {
    return "";
  }
}

describe("SwaggerService", () => {
  let clientApiService: ClientApiService;
  let settingsService: PlatformConfiguration;

  beforeAll(async () => {
    await PlatformTest.create();
  });

  afterAll(() => PlatformTest.reset());
  beforeAll(
    PlatformTest.inject(
      [ClientApiService, PlatformConfiguration],
      (
        _clientApiService: ClientApiService,
        _serverSettingsService: PlatformConfiguration
      ) => {
        _clientApiService.platform.addRoutes([
          {
            route: "test",
            token: TestCtrl,
          },
        ]);
        clientApiService = _clientApiService;
        settingsService = _serverSettingsService;
      }
    )
  );

  it("should cleanup the output folder if it exists", () => {
    const outputDir = "./test";
    jest.spyOn(fs, "existsSync").mockReturnValue(true);
    jest.spyOn(fs, "readdirSync").mockReturnValue([]);
    clientApiService.build({
      templateFile: "",
      outputDir,
    });
    expect(fs.rmdirSync).toBeCalledWith(outputDir);
  });

  describe("buildRoutes()", () => {
    const params: ClientApiBuildParams = {
      outputDir: "",
      templateFile: "",
    };

    it("should use the controller name as default service name", () => {
      const metadata = clientApiService.buildRoutes(params);
      expect(metadata[0].serviceName).toEqual("TestCtrl");
    });

    it("should replace controller name with the one provided by the user", () => {
      const extendedParams: ClientApiBuildParams = {
        ...params,
        controllerNameProvider: (name) => name.replace("Ctrl", "Endpoint"),
      };
      const metadata = clientApiService.buildRoutes(extendedParams);
      expect(metadata[0].serviceName).toEqual("TestEndpoint");
    });

    it("should get the route", () => {
      const metadata = clientApiService.buildRoutes(params);
      expect(metadata[0].route).toEqual(endpointName);
    });

    describe("buildEndpoints()", () => {
      it("should include the endpoint method", () => {
        const metadata = clientApiService.buildRoutes(params);
        expect(metadata[0].endpoints[0].method).toEqual("GET");
      });
      it("should create an interface name for each endpoint params object", () => {
        const metadata = clientApiService.buildRoutes(params);
        expect(metadata[0].endpoints[0].interfaceName).toEqual("FindAllParams");
      });

      it("should include the endpoint name", () => {
        const metadata = clientApiService.buildRoutes(params);
        expect(metadata[0].endpoints[1].name).toEqual("addTest");
      });
      it("should include the endpoint path", () => {
        const metadata = clientApiService.buildRoutes(params);
        expect(metadata[0].endpoints[1].path).toEqual("/test/elements");
      });
      it("should transform path parameters template string compatible", () => {
        const metadata = clientApiService.buildRoutes(params);
        expect(metadata[0].endpoints[0].path).toEqual("/test/${id}");
      });
      it("should not build hidden endpoints", () => {
        const metadata = clientApiService.buildRoutes(params);
        expect(
          metadata[0].endpoints.find((e) => e.name === "hiddenApi")
        ).toBeFalsy();
      });

      describe("parameters", () => {
        it("should always mark path parameters as required", () => {
          const metadata = clientApiService.buildRoutes(params);
          expect(metadata[0].endpoints[1].params[0].paramType).toEqual(
            ParamTypes.PATH
          );
          expect(metadata[0].endpoints[1].params[0].required).toEqual(true);
        });

        it("should order the parameters adding the required ones first", () => {
          const metadata = clientApiService.buildRoutes(params);
          expect(metadata[0].endpoints[1].bodyParams[0]).toEqual({
            name: "requiredParam",
            paramType: ParamTypes.BODY,
            required: true,
            type: "string",
          } as ParamModel);
        });
        it("should build body params", () => {
          const metadata = clientApiService.buildRoutes(params);
          expect(metadata[0].endpoints[1].bodyParams.length).toEqual(2);
        });
        it("header params must be string and required", () => {
          const metadata = clientApiService.buildRoutes(params);
          expect(metadata[0].endpoints[1].headerParams[0]).toEqual({
            name: "timestamp",
            paramType: ParamTypes.HEADER,
            type: "string",
            required: true,
          } as ParamModel);
        });
      });
    });
  });
});
