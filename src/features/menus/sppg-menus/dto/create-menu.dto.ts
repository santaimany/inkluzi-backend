// src/sppg-menus/dto/create-menu.dto.ts
import { IsString, IsNotEmpty, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class KomponenMenuDto {
  @ApiProperty({
    description: 'Nama komponen makanan',
    example: 'Nasi putih'
  })
  @IsString()
  @IsNotEmpty()
  nama: string;

  @ApiProperty({
    description: 'Porsi/takaran',
    example: '150g'
  })
  @IsString()
  @IsNotEmpty()
  porsi: string;
}

export class CreateMenuDto {
  @ApiProperty({
    description: 'Tanggal menu disajikan (format: Hari, DD Bulan YYYY)',
    example: 'Senin, 12 Januari 2026'
  })
  @IsString()
  @IsNotEmpty()
  tanggal: string;

  @ApiProperty({
    description: 'Nama menu',
    example: 'Ikan Bumbu Kuning'
  })
  @IsString()
  @IsNotEmpty()
  nama_menu: string;

  @ApiProperty({
    description: 'Komponen menu dengan nama dan porsi',
    type: [KomponenMenuDto],
    example: [
      { nama: 'Nasi putih', porsi: '150g' },
      { nama: 'Ikan kuning', porsi: '90g' },
      { nama: 'Tumis buncis', porsi: '60g' },
      { nama: 'Air mineral', porsi: '200ml' },
      { nama: 'Jeruk', porsi: '1 buah' }
    ]
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Minimal harus ada 1 komponen makanan' })
  @ValidateNested({ each: true })
  @Type(() => KomponenMenuDto)
  komponen_menu: KomponenMenuDto[];
}