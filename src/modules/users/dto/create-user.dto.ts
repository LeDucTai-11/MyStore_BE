import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateUserDTO {

    @ApiProperty({default: "abc@gmail.com"})
    @IsString()
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({default: "iam_abc"})
    @IsString()
    @IsNotEmpty()
    username: string;

    @ApiProperty({default: "password"})
    @IsString()
    @IsNotEmpty()
    password: string;

    @ApiProperty({default: "David"})
    @IsString()
    @IsNotEmpty()
    firstName: string;
    
    @ApiProperty({default: "Villa"})
    @IsString()
    @IsNotEmpty()
    lastName: string;

    @ApiProperty({default: "Số 54, Nguyễn Lương Bằng, Quận Liên Chiểu, Đà Nẵng, Việt Nam"})
    @IsString()
    @IsOptional()
    address?: string;

    @ApiProperty({default: 1})
    @IsNumber()
    @IsNotEmpty()
    gender: number;

    @ApiProperty({default: "0xxxx"})
    @IsString()
    @IsNotEmpty()
    phone: string;

}