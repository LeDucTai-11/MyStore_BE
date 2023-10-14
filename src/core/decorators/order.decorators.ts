import { BadRequestException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { ValidationOptions, registerDecorator } from "class-validator";
import { isEnumValue } from "../utils";

export const IsOrderQueryParam = (
    property: string,
    orderFieldEnumType: any,
    validationOptions?: ValidationOptions,
) => {
    return function (object: any, propertyName: string) {
        registerDecorator({
            name: 'IsOrderQueryParam',
            target: object.constructor,
            propertyName: propertyName,
            constraints: [property],
            options: validationOptions,
            validator: {
                validate(value: any) {
                    const [field, orderDirection] = value.split(':');
                    return isValidOrder(field, orderDirection,orderFieldEnumType);
                }
            }
        })
    }
}

const isValidOrder = (
    field: string,
    orderDirection: string,
    orderFieldEnumType: any,
) => {
    if(!isEnumValue(orderFieldEnumType,field)) {
        throw new BadRequestException(`OrderField must be in: ${Object.values(orderFieldEnumType)}. Your value is: '${field}'`);
    }

    if(!isEnumValue(Prisma.SortOrder,orderDirection)) {
        throw new BadRequestException(`OrderDirection must be in: ${Object.values(Prisma.SortOrder)}. Your value is: '${orderDirection}'`);
    }
    return true;
}