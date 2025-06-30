import type { SensorDescriptor, SensorHandler } from '../../sensors';
import type { SyntheticListener, SyntheticListeners } from './useSyntheticListeners';
export declare function useCombineActivators(sensors: SensorDescriptor<any>[], getSyntheticHandler: (handler: SensorHandler, sensor: SensorDescriptor<any>) => SyntheticListener['handler']): SyntheticListeners;
