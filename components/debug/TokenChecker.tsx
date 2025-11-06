'use client';

import { useEffect, useState } from 'react';
import { getAccessToken } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function TokenChecker() {
  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkToken();
  }, []);

  const checkToken = () => {
    const accessToken = getAccessToken();
    setToken(accessToken);
  };

  const clearToken = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      setToken(null);
    }
  };

  if (!mounted) return null;

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-sm">Token Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Access Token Status:</p>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${token ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm font-mono">
              {token ? 'Token Present' : 'No Token'}
            </span>
          </div>
        </div>

        {token && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Token Preview:</p>
            <p className="text-xs font-mono bg-muted p-2 rounded break-all">
              {token.substring(0, 50)}...
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={checkToken}>
            Refresh
          </Button>
          <Button size="sm" variant="destructive" onClick={clearToken}>
            Clear Token
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
