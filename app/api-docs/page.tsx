'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

// Dynamically import SwaggerUI with SSR disabled to prevent React warnings
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocs() {
  const [spec, setSpec] = useState(null);

  useEffect(() => {
    // Disable React strict mode warnings for third-party components
    const originalConsoleError = console.error;
    console.error = (...args) => {
      if (
        typeof args[0] === 'string' &&
        args[0].includes('UNSAFE_componentWillReceiveProps') &&
        args[0].includes('OperationContainer')
      ) {
        return;
      }
      originalConsoleError(...args);
    };

    async function fetchSpec() {
      const res = await fetch('/api/swagger');
      const data = await res.json();
      setSpec(data);
    }
    fetchSpec();

    // Restore original console.error
    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  if (!spec) {
    return <div>Loading...</div>;
  }

  return <SwaggerUI spec={spec} />;
}