export interface BackendEndpointSpec {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  purpose: string;
}
