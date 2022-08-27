import { Injectable } from '@nestjs/common';
import { GraphQLInputType } from 'graphql';
import { BuildSchemaOptions, GqlTypeReference } from '../../interfaces';
import { TypeOptions } from '../../interfaces/type-options.interface';
import { CannotDetermineInputTypeError } from '../errors/cannot-determine-input-type.error';
import { TypeMapperSevice } from '../services/type-mapper.service';
import { TypeDefinitionsStorage } from '../storages/type-definitions.storage';

@Injectable()
export class InputTypeFactory {
  constructor(
    private readonly typeDefinitionsStorage: TypeDefinitionsStorage,
    private readonly typeMapperService: TypeMapperSevice,
  ) {}

  public create(
    hostType: string,
    typeRef: GqlTypeReference,
    buildOptions: BuildSchemaOptions,
    typeOptions: TypeOptions = {},
  ): GraphQLInputType {
    let inputType: //返回custom scalar 和 内置类型(String,...)
      | GraphQLInputType
      | undefined = this.typeMapperService.mapToScalarType(
      typeRef,
      buildOptions.scalarsMap,
      buildOptions.dateScalarMode,
    );
    if (!inputType) {
      inputType = this.typeDefinitionsStorage.getInputTypeAndExtract(
        typeRef as any, // NewRecipeInput
      );
      if (!inputType) {
        throw new CannotDetermineInputTypeError(hostType);
      }
    }

    return this.typeMapperService.mapToGqlType(
      hostType, //@Args('newRecipeData')
      inputType,
      typeOptions,
    );
  }
}
