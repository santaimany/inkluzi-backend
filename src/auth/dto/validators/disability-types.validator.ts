import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { RegisterSekolahDto } from '../register-sekolah.dto';

@ValidatorConstraint({ name: 'DisabilityTypesTotal', async: false })
export class DisabilityTypesTotalConstraint implements ValidatorConstraintInterface {
  validate(disabilityTypes: any[], args: ValidationArguments) {
    const dto = args.object as RegisterSekolahDto;
    
    if (!disabilityTypes || !Array.isArray(disabilityTypes)) {
      return false;
    }

    // Hitung total jumlah_siswa dari semua disability types
    const totalDisabilitas = disabilityTypes.reduce((sum, dt) => {
      // Pastikan convert ke number dengan Number()
      const jumlahSiswa = Number(dt.jumlah_siswa) || 0;
      return sum + jumlahSiswa;
    }, 0);

    // Pastikan total_siswa juga number
    const totalSiswa = Number(dto.total_siswa);

    // Validasi: total disability tidak boleh melebihi total_siswa
    return totalDisabilitas <= totalSiswa;
  }

  defaultMessage(args: ValidationArguments) {
    const dto = args.object as RegisterSekolahDto;
    const disabilityTypes = args.value as any[];
    
    // Hitung ulang dengan benar
    const totalDisabilitas = disabilityTypes.reduce((sum, dt) => {
      const jumlahSiswa = Number(dt.jumlah_siswa) || 0;
      return sum + jumlahSiswa;
    }, 0);

    const totalSiswa = Number(dto.total_siswa);

    return `Total jumlah siswa disabilitas (${totalDisabilitas}) tidak boleh melebihi total siswa sekolah (${totalSiswa})`;
  }
}

export function IsDisabilityTypesValid(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: DisabilityTypesTotalConstraint,
    });
  };
}