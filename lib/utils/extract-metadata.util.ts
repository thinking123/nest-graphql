import 'reflect-metadata';
import {
  RESOLVER_REFERENCE_KEY,
  RESOLVER_REFERENCE_METADATA,
} from '../federation/federation.constants';
import {
  RESOLVER_NAME_METADATA,
  RESOLVER_PROPERTY_METADATA,
  RESOLVER_TYPE_METADATA,
} from '../graphql.constants';
import { ResolverMetadata } from '../interfaces/resolver-metadata.interface';

export function extractMetadata(
  instance: Record<string, any>,
  prototype: any,
  methodName: string,
  filterPredicate: (
    resolverType: string,
    isReferenceResolver?: boolean,
    isPropertyResolver?: boolean,
  ) => boolean,
): ResolverMetadata {
  const callback = prototype[methodName];
  // RESOLVER_TYPE_METADATA === [Query,Mutation,Resolver class name]
  // 对于 ResolveField , 使用@Resolver(Class) ClassName
  const resolverType =
    Reflect.getMetadata(RESOLVER_TYPE_METADATA, callback) ||
    Reflect.getMetadata(RESOLVER_TYPE_METADATA, instance.constructor);
// RESOLVER_PROPERTY_METADATA = boolean = is ResolveField
  const isPropertyResolver = !!Reflect.getMetadata(
    RESOLVER_PROPERTY_METADATA,
    callback,
  );
// RESOLVER_NAME_METADATA === @ResolveField("name") name === @ResolveField(() => Class) undefined === @Query(()=>Class) undefined
  const resolverName = Reflect.getMetadata(RESOLVER_NAME_METADATA, callback);
  // @ResolveReference
  const isReferenceResolver = !!Reflect.getMetadata(
    RESOLVER_REFERENCE_METADATA,
    callback,
  );
  // 是否是 Graphql 
  // resolverType === [QUERY,MUTATION,SUBSCRIPTION]
  // isPropertyResolver , isReferenceResolver === true 
  if (filterPredicate(resolverType, isReferenceResolver, isPropertyResolver)) {
    return null;
  }

  const name = isReferenceResolver
    ? RESOLVER_REFERENCE_KEY
    : resolverName || methodName;
  return {
    type: resolverType, // Query , Recipe (ResolveField)
    methodName, // recipe
    name, // recipe
  };
}
