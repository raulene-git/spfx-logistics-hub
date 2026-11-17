import * as React from 'react';
import type { IShipment } from '../models/IShipment';
import type { IShipmentService } from '../services/IShipmentService';

export interface IShipmentsState {
  shipments: IShipment[];
  loading: boolean;
  error?: string;
}

/** Loads shipments from the service and reloads when the service changes. */
export function useShipments(service: IShipmentService): IShipmentsState {
  const [state, setState] = React.useState<IShipmentsState>({ shipments: [], loading: true });

  React.useEffect(() => {
    let cancelled = false;
    setState({ shipments: [], loading: true });
    service.getShipments().then(
      (shipments) => !cancelled && setState({ shipments, loading: false }),
      (e: Error) => !cancelled && setState({ shipments: [], loading: false, error: e.message })
    );
    return () => {
      cancelled = true;
    };
  }, [service]);

  return state;
}
