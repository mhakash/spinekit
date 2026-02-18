/**
 * API Documentation Page
 * Native Swagger UI for interactive API testing
 */

import { useEffect, useState } from "react";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import "../swagger-ui-custom.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function APITestingPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/openapi.json`)
      .catch(() => setError("Backend server is not running"));
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Backend Not Available</h2>
          <p className="text-muted-foreground">{error}</p>
          <pre className="bg-muted p-3 rounded-md text-sm inline-block">
            <code>bun run dev:backend</code>
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="swagger-container -mx-6 -my-8">
      <SwaggerUI url={`${API_BASE_URL}/api/openapi.json`} />
    </div>
  );
}
