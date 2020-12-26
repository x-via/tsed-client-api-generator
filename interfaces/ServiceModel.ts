import { EndpointModel } from "./EndpointModel";

export interface ServiceModel {
  serviceName: string;
  route: string;
  endpoints: EndpointModel[];
}
