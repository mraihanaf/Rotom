import { Injectable } from '@nestjs/common';
import { OpenAPIGenerator } from '@orpc/openapi';
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4';
import { contract } from 'src/contract';

@Injectable()
export class ReferenceService {
  private readonly openapiGenerator = new OpenAPIGenerator({
    schemaConverters: [new ZodToJsonSchemaConverter()],
  });

  spec() {
    return this.openapiGenerator.generate(contract, {
      info: {
        title: 'Rotom Backend',
        version: '1.0.0',
      },
      servers: [{ url: process.env.APP_URL! }],
    });
  }
}
