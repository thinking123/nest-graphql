import { Type } from '@nestjs/common';
import { isString } from '@nestjs/common/utils/shared.utils';
import 'reflect-metadata';
import { Resolver } from '../enums/resolver.enum';
import { BaseTypeOptions } from '../interfaces/base-type-options.interface';
import { ReturnTypeFunc } from '../interfaces/return-type-func.interface';
import { UndefinedReturnTypeError } from '../schema-builder/errors/undefined-return-type.error';
import { ResolverTypeMetadata } from '../schema-builder/metadata';
import { LazyMetadataStorage } from '../schema-builder/storages/lazy-metadata.storage';
import { TypeMetadataStorage } from '../schema-builder/storages/type-metadata.storage';
import { reflectTypeFromMetadata } from '../utils/reflection.utilts';
import { addResolverMetadata } from './resolvers.utils';

/**
 * Interface defining options that can be passed to `@Mutation()` decorator.
 */
export interface MutationOptions extends BaseTypeOptions {
  /**
   * Name of the mutation.
   */
  name?: string;
  /**
   * Description of the mutation.
   */
  description?: string;
  /**
   * Mutation deprecation reason (if deprecated).
   */
  deprecationReason?: string;
}

/**
 * Mutation handler (method) Decorator. Routes specified mutation to this method.
 */
export function Mutation(): MethodDecorator;
/**
 * Mutation handler (method) Decorator. Routes specified mutation to this method.
 */
export function Mutation(name: string): MethodDecorator;
/**
 * Mutation handler (method) Decorator. Routes specified mutation to this method.
 */
export function Mutation(
  typeFunc: ReturnTypeFunc,
  options?: MutationOptions,
): MethodDecorator;
/**
 * Mutation handler (method) Decorator. Routes specified mutation to this method.
 */ // @Mutation(() => ReturnClass)
export function Mutation(
  nameOrType?: string | ReturnTypeFunc,
  options: MutationOptions = {},
): MethodDecorator { // key === functionname
  return (target: Object | Function, key?: string, descriptor?: any) => {
    const name = isString(nameOrType)
      ? nameOrType
      : (options && options.name) || undefined;

    addResolverMetadata(Resolver.MUTATION, name, target, key, descriptor);

    LazyMetadataStorage.store(target.constructor as Type<unknown>, () => {
      if (!nameOrType || isString(nameOrType)) {
        throw new UndefinedReturnTypeError(Mutation.name, key);
      }

      const { typeFn, options: typeOptions } = reflectTypeFromMetadata({
        metadataKey: 'design:returntype',
        prototype: target,
        propertyKey: key,
        explicitTypeFn: nameOrType,
        typeOptions: options,
      });
      const metadata: ResolverTypeMetadata = {
        methodName: key,
        schemaName: options.name || key,
        target: target.constructor,
        typeFn,
        returnTypeOptions: typeOptions,
        description: options.description,
        deprecationReason: options.deprecationReason,
      };
      TypeMetadataStorage.addMutationMetadata(metadata);
    });
  };
}

/*
  @Mutation((returns) => Recipe)
  async addRecipe(
    @Args('newRecipeData') newRecipeData: NewRecipeInput,
  ): Promise<Recipe> {
    const recipe = await this.recipesService.create(newRecipeData);
    pubSub.publish('recipeAdded', { recipeAdded: recipe });
    return recipe;
  }

*/