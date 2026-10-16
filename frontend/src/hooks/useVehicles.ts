import { useCallback, useEffect, useState } from "react";

import {
  vehicleService,
  type Vehicle,
} from "../api/services/vehicleService";

interface UseVehiclesReturn {
  vehicles: Vehicle[];
  isLoading: boolean;
  error: string;
  refresh: () => Promise<void>;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Impossible de charger les véhicules.";
}

export function useVehicles(): UseVehiclesReturn {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const data = await vehicleService.getVehicles();

      setVehicles(data);
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadInitialVehicles = async () => {
      try {
        const data = await vehicleService.getVehicles();

        if (cancelled) {
          return;
        }

        setVehicles(data);
        setError("");
      } catch (error: unknown) {
        if (cancelled) {
          return;
        }

        setError(getErrorMessage(error));
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadInitialVehicles();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    vehicles,
    isLoading,
    error,
    refresh,
  };
}

