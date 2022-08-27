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
/*


@Resolver((of) => Recipe)
export class RecipesResolver {
  constructor(private readonly recipesService: RecipesService) {}

  @UseGuards(AuthGuard)
  @Query((returns) => IRecipe, { description: 'get recipe by id' })
  async recipe(
    @Args('id', {
      defaultValue: '1',
      description: 'recipe id',
    })
    id: string,
  ): Promise<IRecipe> {
    const recipe = await this.recipesService.findOneById(id);
    if (!recipe) {
      throw new NotFoundException(id);
    }
    return recipe;
  }

  @Query((returns) => [SearchResultUnion], { deprecationReason: 'test' })
  async search(): Promise<Array<typeof SearchResultUnion>> {
    return [
      new Recipe({ title: 'recipe' }),
      new Ingredient({
        name: 'test',
      }),
    ];
  }

  @Query((returns) => [Recipe])
  recipes(@Args() recipesArgs: RecipesArgs): Promise<Recipe[]> {
    return this.recipesService.findAll(recipesArgs);
  }

  @Mutation((returns) => Recipe)
  async addRecipe(
    @Args('newRecipeData') newRecipeData: NewRecipeInput,
  ): Promise<Recipe> {
    const recipe = await this.recipesService.create(newRecipeData);
    pubSub.publish('recipeAdded', { recipeAdded: recipe });
    return recipe;
  }

  @ResolveField('ingredients', () => [Ingredient])
  getIngredients(@Parent() root) {
    return [new Ingredient({ name: 'cherry' })];
  }

  @ResolveField((type) => Number)
  count(@Args() filters: FilterRecipesCountArgs) {
    return 10;
  }

  @ResolveField()
  rating(): number {
    return 10;
  }

  @Mutation((returns) => Boolean)
  async removeRecipe(@Args('id') id: string) {
    return this.recipesService.remove(id);
  }

  @Subscription((returns) => Recipe, {
    description: 'subscription description',
  })
  recipeAdded() {
    return pubSub.asyncIterator('recipeAdded');
  }
}


*/