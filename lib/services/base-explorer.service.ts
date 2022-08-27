import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Module } from '@nestjs/core/injector/module';
import { flattenDeep, groupBy, identity, isEmpty, mapValues } from 'lodash';
import { ResolverMetadata } from '../interfaces/resolver-metadata.interface';

export class BaseExplorerService {
  getModules(
    modulesContainer: Map<string, Module>,
    include: Function[],
  ): Module[] {
    if (!include || isEmpty(include)) {
      return [...modulesContainer.values()];
    }
    const whitelisted = this.includeWhitelisted(modulesContainer, include);
    return whitelisted;
  }

  includeWhitelisted(
    modulesContainer: Map<string, Module>,
    include: Function[],
  ): Module[] {
    const modules = [...modulesContainer.values()];
    return modules.filter(({ metatype }) =>
      include.some(item => item === metatype),
    );
  }

  flatMap<T = ResolverMetadata>(
    modules: Module[],
    callback: (instance: InstanceWrapper, moduleRef: Module) => T | T[],
  ): T[] {
    const invokeMap = () => {
      return modules.map(moduleRef => {
        const providers = [...moduleRef.providers.values()];
        return providers.map(wrapper => callback(wrapper, moduleRef));
      });
    };// flattenDeep([1,[2,[3]]]) === [1,2,3] , identity([1,2] , [2,3]) == [1,2]
    return flattenDeep(invokeMap()).filter(identity);
  }
  // 按照Query，Mutation，Subsciptons，ClassName（ResolverField），分组
  // 每组的内容是 {functionName:callback,...}
  groupMetadata(resolvers: ResolverMetadata[]) {
    const groupByType = groupBy(
      resolvers,
      (metadata: ResolverMetadata) => metadata.type,
    );
    const groupedMetadata = mapValues(
      groupByType,
      (resolversArr: ResolverMetadata[]) =>
        resolversArr.reduce(
          (prev, curr) => ({
            ...prev,
            [curr.name]: curr.callback,
          }),
          {},
        ),
    );
    return groupedMetadata;
  }
}
/*
groupedMetadata = {
  "Query":{
    addRecipe:callback()
  },
  

}
groupMetadata(resolvers)
resolvers = [
  { type: "Query", methodName: "recipe", name: "recipe", callback: "callback" },
  { type: "Query", methodName: "search", name: "search", callback: "callback" },
  {
    type: "Query",
    methodName: "recipes",
    name: "recipes",
    callback: "callback",
  },
  {
    type: "Mutation",
    methodName: "addRecipe",
    name: "addRecipe",
    callback: "callback",
  },
  {
    type: "Recipe",
    methodName: "getIngredients",
    name: "ingredients",
    callback: "callback",
  },
  { type: "Recipe", methodName: "count", name: "count", callback: "callback" },
  {
    type: "Recipe",
    methodName: "rating",
    name: "rating",
    callback: "callback",
  },
  {
    type: "Mutation",
    methodName: "removeRecipe",
    name: "removeRecipe",
    callback: "callback",
  },
  {
    type: "Subscription",
    methodName: "recipeAdded",
    name: "recipeAdded",
    callback: { subscribe: "callback" },
  },
  { type: "Query", methodName: "move", name: "move", callback: "callback" },
];

*/