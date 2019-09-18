import {estimateGasDataFromUnsignedMessage} from '@universal-login/contracts';
import {SignedMessage, ensure} from '@universal-login/commons';
import {InsufficientGas} from '../../utils/errors';
import IMessageValidator from './IMessageValidator';

export const GAS_BASE = 0;

export class GasValidator implements IMessageValidator {
  async validate(signedMessage: SignedMessage) {
    const {signature, ...unsignedMessage} = signedMessage;
    const expectedGasData = estimateGasDataFromUnsignedMessage(unsignedMessage);
    const actualGasData = Number(signedMessage.gasData);
    ensure(actualGasData === expectedGasData, InsufficientGas, `Got GasData ${actualGasData} but should be ${expectedGasData}`);
    ensure(GAS_BASE < signedMessage.gasLimitExecution, InsufficientGas, `Got GasLimitExecution ${signedMessage.gasLimitExecution} but should greater than ${GAS_BASE}`);
  }
}