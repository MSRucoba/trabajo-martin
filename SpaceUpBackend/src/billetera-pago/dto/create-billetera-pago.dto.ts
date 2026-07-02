import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class CreateBilleteraPagoDto {
  @IsNotEmpty()
  id_usuario: number;

  @IsNotEmpty()
  @IsString()
  stripePaymentMethodId: string;

  @IsString()
  @IsNotEmpty()
  brand: string;

  @IsString()
  @IsNotEmpty()
  last4: string;

  @IsInt()
  expMonth: number;

  @IsInt()
  expYear: number;

  @IsOptional()
  @IsBoolean()
  predeterminado?: boolean;
}
