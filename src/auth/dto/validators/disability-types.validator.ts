import { registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";
import { RegisterSekolahDto } from "../register-sekolah.dto";


@ValidatorConstraint({
    name: 'DisabilityTypesTotal', async: false
})
export class DisabilityTypesTotalConstraint implements ValidatorConstraintInterface {
    validate(disabilityTypes: any[], args: ValidationArguments){
        const dto = args.object as RegisterSekolahDto;

        if(!disabilityTypes || !Array.isArray(disabilityTypes)) {
            return false;
        }

        const totalDisabilitas = disabilityTypes.reduce((sum, dt) => {
            return sum + (dt.jumlah_siswa || 0);
        })

        return totalDisabilitas <= dto.total_siswa;
    }

    defaultMessage(args?: ValidationArguments) {
        const dto = args.object as RegisterSekolahDto;
        const disabilityTypes = args.value as any[];

        const totalDisabilitas = disabilityTypes.reduce((sum, dt) => {
            return sum + (dt.jumlah_siswa || 0);
        })
        return `Total jumlah siswa disabilitas (${totalDisabilitas}) melebihi total siswa sekolah (${dto.total_siswa})`;
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
        })
    }
}