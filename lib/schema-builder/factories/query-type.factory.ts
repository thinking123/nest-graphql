import { Injectable } from '@nestjs/common';
import { GraphQLObjectType } from 'graphql';
import { BuildSchemaOptions } from '../../interfaces';
import { TypeMetadataStorage } from '../storages/type-metadata.storage';
import { RootTypeFactory } from './root-type.factory';

@Injectable()
export class QueryTypeFactory {
  constructor(private readonly rootTypeFactory: RootTypeFactory) {}

  public create(
    typeRefs: Function[],
    options: BuildSchemaOptions,
  ): GraphQLObjectType {
    const objectTypeName = 'Query'; // this.queries;
    const queriesMetadata = TypeMetadataStorage.getQueriesMetadata();

    return this.rootTypeFactory.create(
      typeRefs, // all Class
      queriesMetadata,
      objectTypeName, // Query
      options,
    );
  }
}

/*

queriesMetadata =  [
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