import { Type } from '@nestjs/common';
import { isFunction, isString } from '@nestjs/common/utils/shared.utils';
import 'reflect-metadata';
import { LazyMetadataStorage } from '../schema-builder/storages/lazy-metadata.storage';
import { TypeMetadataStorage } from '../schema-builder/storages/type-metadata.storage';
import {
  addResolverMetadata,
  getClassName,
  getClassOrUndefined,
  getResolverTypeFn,
} from './resolvers.utils';

export type ResolverTypeFn = (of?: void) => Type<any>;

/**
 * Extracts the name property set through the @ObjectType() decorator (if specified)
 * @param nameOrType type reference
 */
function getObjectTypeNameIfExists(nameOrType: Function): string | undefined {
  const ctor = getClassOrUndefined(nameOrType);
  // objectTypesMetadata = this.objectTypes = []
  const objectTypesMetadata = TypeMetadataStorage.getObjectTypesMetadata();
  const objectMetadata = objectTypesMetadata.find(type => type.target === ctor);
  if (!objectMetadata) {
    return;
  }
  return objectMetadata.name;
}

/**
 * Interface defining options that can be passed to `@Resolve()` decorator
 */
export interface ResolverOptions {
  /**
   * If `true`, type will not be registered in the schema.
   */
  isAbstract?: boolean;
}

/**
 * Object resolver decorator.
 */
export function Resolver(): MethodDecorator & ClassDecorator;
/**
 * Object resolver decorator.
 */
export function Resolver(name: string): MethodDecorator & ClassDecorator;
/**
 * Object resolver decorator.
 */
export function Resolver(
  options: ResolverOptions,
): MethodDecorator & ClassDecorator;
/**
 * Object resolver decorator.
 */
export function Resolver(
  classType: Type<any>,
  options?: ResolverOptions,
): MethodDecorator & ClassDecorator;
/**
 * Object resolver decorator.
 */
export function Resolver(
  typeFunc: ResolverTypeFn,
  options?: ResolverOptions,
): MethodDecorator & ClassDecorator;
/**
 * Object resolver decorator.
 */
export function Resolver(
  nameOrTypeOrOptions?: string | ResolverTypeFn | Type<any> | ResolverOptions,
  options?: ResolverOptions,
): MethodDecorator & ClassDecorator {
  return ( // @Resolver(() => TestClass) class ResolverTestClass
    target: Object | Function, // ResolverTestClass
    key?: string | symbol, // undefined
    descriptor?: any,// undefined
  ) => {
    // nameOrType === () => TestClass
    const [nameOrType, resolverOptions] =
      typeof nameOrTypeOrOptions === 'object' && nameOrTypeOrOptions !== null
        ? [undefined, nameOrTypeOrOptions]
        : [nameOrTypeOrOptions as string | ResolverTypeFn | Type<any>, options];
    // @Resolver(() => TestClass)
    // name === TestClass.name === "TestClass"
    let name = nameOrType && getClassName(nameOrType);

    if (isFunction(nameOrType)) {
      const objectName = getObjectTypeNameIfExists(nameOrType as Function);
      objectName && (name = objectName);
    }
    addResolverMetadata(undefined, name, target, key, descriptor);

    if (!isString(nameOrType)) {
      LazyMetadataStorage.store(target as Type<unknown>, () => {
        const typeFn = getResolverTypeFn(nameOrType, target as Function);

        TypeMetadataStorage.addResolverMetadata({
          target: target as Function,
          typeFn: typeFn,
          isAbstract: (resolverOptions && resolverOptions.isAbstract) || false,
        });
      });
    }
  };
}
