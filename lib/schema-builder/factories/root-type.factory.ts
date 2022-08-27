import { Injectable } from '@nestjs/common';
import { GraphQLFieldConfigMap, GraphQLObjectType } from 'graphql';
import { BuildSchemaOptions } from '../../interfaces';
import { ResolverTypeMetadata } from '../metadata/resolver.metadata';
import { OrphanedReferenceRegistry } from '../services/orphaned-reference.registry';
import { ArgsFactory } from './args.factory';
import { AstDefinitionNodeFactory } from './ast-definition-node.factory';
import { OutputTypeFactory } from './output-type.factory';

export type FieldsFactory<T = any, U = any> = (
  handlers: ResolverTypeMetadata[],
  options: BuildSchemaOptions,
) => GraphQLFieldConfigMap<T, U>;

@Injectable()
export class RootTypeFactory {
  constructor(
    private readonly outputTypeFactory: OutputTypeFactory,
    private readonly argsFactory: ArgsFactory,
    private readonly astDefinitionNodeFactory: AstDefinitionNodeFactory,
    private readonly orphanedReferenceRegistry: OrphanedReferenceRegistry,
  ) {}

  public create(
    typeRefs: Function[],
    resolversMetadata: ResolverTypeMetadata[],
    objectTypeName: 'Subscription' | 'Mutation' | 'Query',
    options: BuildSchemaOptions,
    fieldsFactory: FieldsFactory = (handlers) =>
      this.generateFields(handlers, options),
  ): GraphQLObjectType {
    const handlers = typeRefs
      ? resolversMetadata.filter((query) => typeRefs.includes(query.target))
      : resolversMetadata;
 // 返回所有的 query , mutation ,...
    if (handlers.length === 0) { // @Mutation function(){}
      return;
    }
    return new GraphQLObjectType({
      name: objectTypeName, // Mutation , Query
      fields: fieldsFactory(handlers, options),
    });
  }

  generateFields<T = any, U = any>(
    handlers: ResolverTypeMetadata[],
    options: BuildSchemaOptions,
  ): GraphQLFieldConfigMap<T, U> {
    const fieldConfigMap: GraphQLFieldConfigMap<T, U> = {};

    handlers
      .filter(
        (handler) =>
          !(handler.classMetadata && handler.classMetadata.isAbstract),
      )
      .forEach((handler) => {
        this.orphanedReferenceRegistry.addToRegistryIfOrphaned(
          handler.typeFn(),
        );

        const type = this.outputTypeFactory.create(
          handler.methodName,
          handler.typeFn(),
          options,
          handler.returnTypeOptions,
        );

        const key = handler.schemaName;
        fieldConfigMap[key] = {
          type, // Mutation return type
          args: this.argsFactory.create(handler.methodArgs, options), // Mutation function args
          resolve: undefined,
          description: handler.description,
          deprecationReason: handler.deprecationReason,
          /**
           * AST node has to be manually created in order to define directives
           * (more on this topic here: https://github.com/graphql/graphql-js/issues/1343)
           */
          astNode: this.astDefinitionNodeFactory.createFieldNode(
            key,
            type,
            handler.directives,
          ),
          extensions: {
            complexity: handler.complexity,
            ...handler.extensions,
          },
        };
      });
    return fieldConfigMap;
  }
}
/*

fieldConfigMap = {
  addRecipe: {
    type: "Recipe!",
    args: { newRecipeData: { type: "NewRecipeInput!" } },
    extensions: {},
  },
}


var AddressType = new GraphQLObjectType({
  name: 'Address',
  fields: {
    street: { type: GraphQLString },
    number: { type: GraphQLInt },
    formatted: {
      type: GraphQLString,
      resolve(obj) {
        return obj.number + ' ' + obj.street
      }
    }
  }
});

handlers = [
  {
    methodName: "move",
    schemaName: "move",
    returnTypeOptions: {},
    classMetadata: { isAbstract: false },
    methodArgs: [
      {
        kind: "arg",
        name: "direction",
        methodName: "move",
        index: 0,
        options: { name: "direction" },
      },
    ],
    directives: [],
    extensions: {},
  },
  {
    methodName: "recipe",
    schemaName: "recipe",
    returnTypeOptions: { description: "get recipe by id" },
    description: "get recipe by id",
    classMetadata: { isAbstract: false },
    methodArgs: [
      {
        kind: "arg",
        name: "id",
        description: "recipe id",
        methodName: "recipe",
        index: 0,
        options: { defaultValue: "1", description: "recipe id" },
      },
    ],
    directives: [],
    extensions: {},
  },
  {
    methodName: "search",
    schemaName: "search",
    returnTypeOptions: { deprecationReason: "test" },
    deprecationReason: "test",
    classMetadata: { isAbstract: false },
    methodArgs: [],
    directives: [],
    extensions: {},
  },
  {
    methodName: "recipes",
    schemaName: "recipes",
    returnTypeOptions: {},
    classMetadata: { isAbstract: false },
    methodArgs: [
      { kind: "args", methodName: "recipes", index: 0, options: {} },
    ],
    directives: [],
    extensions: {},
  },
];

*/