import { SetMetadata } from '@nestjs/common';
import {
  SCALAR_NAME_METADATA,
  SCALAR_TYPE_METADATA,
} from '../graphql.constants';
import { ReturnTypeFunc } from '../interfaces/return-type-func.interface';

/**
 * Decorator that marks a class as a GraphQL scalar.
 */
export function Scalar(name: string): ClassDecorator;
/**
 * Decorator that marks a class as a GraphQL scalar.
 */
export function Scalar(name: string, typeFunc: ReturnTypeFunc): ClassDecorator;
/**
 * Decorator that marks a class as a GraphQL scalar.
 */
export function Scalar(
  name: string, // Date 
  typeFunc?: ReturnTypeFunc, // type => Date
): ClassDecorator {
  return (target, key?, descriptor?) => {
    SetMetadata(SCALAR_NAME_METADATA, name)(target, key, descriptor);
    SetMetadata(SCALAR_TYPE_METADATA, typeFunc)(target, key, descriptor);
  };
}
/*

@Scalar('Date', type => Date)
export class DateScalar {
  description = 'Date custom scalar type';

  parseValue(value: any) {
    return new Date(value); // value from the client
  }

  serialize(value: any) {
    return value.getTime(); // value sent to the client
  }

  parseLiteral(ast: ValueNode) {
    if (ast.kind === Kind.INT) {
      return parseInt(ast.value, 10); // ast value is always in string format
    }
    return null;
  }
}


*/