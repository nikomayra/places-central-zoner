import React, { useEffect, useState } from 'react';
import App from './App';

interface ClientConfig {
  google_maps_api_key: string;
}

const Root: React.FC = () => {
  const [config, setConfig] = useState<ClientConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/api/client-config');
        if (!response.ok) {
          throw new Error(`Configuration request failed (${response.status})`);
        }
        setConfig(await response.json());
      } catch (error) {
        console.error(error);
        setConfigError(
          'The app is missing its Google configuration. Please try again later.'
        );
      }
    };

    loadConfig();
  }, []);

  if (configError) return <div>{configError}</div>;
  if (!config) return <div>Loading application…</div>;

  return <App googleMapsApiKey={config.google_maps_api_key} />;
};

export default Root;
