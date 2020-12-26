# tsed-client-api-generator

[![Build Status](https://travis-ci.com/x-via/tsed-client-api-generator.svg?branch=master)](https://travis-ci.com/x-via/tsed-client-api-generator)
[![Coverage Status](https://coveralls.io/repos/github/x-via/tsed-client-api-generator/badge.svg)](https://coveralls.io/github/x-via/tsed-client-api-generator)

<p style="text-align: center" align="center">
 <a href="https://tsed.io" target="_blank"><img src="https://tsed.io/tsed-og.png" width="200" alt="Ts.ED logo"/></a>
</p>

This library automatically generates TypeScript client APIs based on your controllers. The generated API can be published to clients to keep them up to date with any backend changes done in the controller.

A package of Ts.ED framework. See website: https://tsed.io

## Installation

Before using the Client Api Generator, we have to install the [tsed-client-api-generator](https://www.npmjs.com/package/tsed-client-api-generator) module.

```bash
npm install --save tsed-client-api-generator
```

Then add the following configuration in your Server:

```typescript
import { Configuration } from "@tsed/common";
import "tsed-client-api-generator"; // import the client api generator module

@Configuration({
  rootDir: __dirname,
  clientApi: {
    // ... see configuration
  },
})
export class Server {}
```

## Configuration

- `outputDir` &lt;string&gt;: Directory where the client api code will be generated (**NOTE: Any previous content will be erased before each code generation**).
- `controllerNameProvider` &lt;Function&gt;: A function that receives the controller name and returns the desired API name. Example: `(controllerName: string) => controllerName.replace('Ctrl', 'Api')`
- `templateFile` &lt;string&gt;: Location of the [EJS](https://ejs.co/) template file to be used for code generation. (See [Templating](#templating))
- `disabled` &lt;boolean&gt;: Useful for disabling the code generation for production builds.

## Examples

#### Basic example

Body parameters will become function parameters in the generated client api.

Input:

```typescript
import { BodyParams, Controller, Get, Post } from "@tsed/common";

@Controller("/users")
export class UserCtrl {
  @Get()
  getAllUsers() {
    return "all users";
  }

  @Post()
  addUser(
    @BodyParams("name") name: string,
    @BodyParams("email") email: string,
    @BodyParams("age") age: number
  ) {
    return "add user";
  }
}
```

Output:

```typescript
// AUTO GENERATED. DO NOT EDIT IT
export interface AddUserParams {
  name?: string;
  email?: string;
  age?: number;
}

export class UserCtrl {
  getAllUsers() {
    return fetch(`/v1/users`);
  }

  addUser({ name, email, age }: AddUserParams) {
    return fetch(`/v1/users`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        age,
      }),
    });
  }
}
```

#### Handling path parameters

Path parameters will be handled as template string variables. _They are also marked as required_.

Input:

```typescript
import { Controller, Get, PathParams } from "@tsed/common";

@Controller("/users")
export class UserCtrl {
  @Get("/:id")
  getById(@PathParams("id") id: string) {
    return "user by id";
  }
}
```

Output:

```typescript
// AUTO GENERATED. DO NOT EDIT IT
export interface GetByIdParams {
  id: string;
}

export class UserCtrl {
  getById({ id }: GetByIdParams) {
    return fetch(`/v1/users/${id}`);
  }
}
```

#### Custom headers

Custom headers will be handled also as function parameters.

Input:

```typescript
import { BodyParams, Controller, HeaderParams, Put } from "@tsed/common";

@Controller("/users")
export class UserCtrl {
  @Put()
  updateUser(
    @HeaderParams("id") id: string,
    @BodyParams("name") name: string,
    @BodyParams("age") age: number
  ) {
    return "update user";
  }
}
```

Output:

```typescript
// AUTO GENERATED. DO NOT EDIT IT
export interface UpdateUserParams {
  id: string;
  name?: string;
  age?: number;
}

export class UserCtrl {
  updateUser({ id, name, age }: UpdateUserParams) {
    return fetch(`/v1/users`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        id,
      },
      body: JSON.stringify({
        name,
        age,
      }),
    });
  }
}
```

## Templating

It possible to add your own [EJS](https://ejs.co/) template by specifying the `templateFile` setting in your [Server Configuration](#configuration).

```typescript
import { Configuration } from "@tsed/common";
import "tsed-client-api-generator"; // import the client api generator module
import { resolve } from "path";

@Configuration({
  rootDir: __dirname,
  clientApi: {
    templateFile: resolve(__dirname, "./myCustomTemplate.ejs"),
  },
})
export class Server {}
```

Example of a custom [EJS](https://ejs.co/) template file:

```ejs
<% endpoints.forEach(function(endpoint) { %>
export interface <%=endpoint.interfaceName -%> {
<% endpoint.params.forEach(param => { -%>
  <%=param.name %><%=param.required ? "" : "?" %>: <%=param.type %>;
<% }); -%>
}
<% }); -%>

export class <%=serviceName %> {
<% endpoints.forEach(function(endpoint) { %>
  <%=endpoint.name %>({ <%=endpoint.params.map(param => param.name).join(',') -%> }: <%=endpoint.interfaceName%>) {
    return fetch(`<%=endpoint.path %>`<% if(endpoint.method !== "GET") { %>, {
      method: '<%=endpoint.method%>',
      headers: {
        'content-type': 'application/json',
        <%_endpoint.headerParams.forEach(headerParams => { -%>
        <%=headerParams.name %>,
        <%_ }); -%>
      },
      body: JSON.stringify({
      <%_endpoint.bodyParams.forEach(bodyParam => { -%>
        <%=bodyParam.name %>,
      <%_ }); -%>
      }),
    }<% }; %>);
  }
<% }); -%>
}

```

#### Template variables

The following typescript interfaces are available inside the template file

```typescript
export interface ParamModel {
  name: string;
  required: boolean;
  paramType: ParamTypes; // from @tsed/common;
  type: string;
}

export interface EndpointModel {
  name: string;
  interfaceName: string;
  method: string;
  path: string;
  params: ParamModel[];
  bodyParams: ParamModel[];
  headerParams: ParamModel[];
}

export interface ServiceModel {
  serviceName: string;
  route: string;
  endpoints: EndpointModel[];
}
```

## License

MIT License

Copyright (c) 2020 X-Via

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
