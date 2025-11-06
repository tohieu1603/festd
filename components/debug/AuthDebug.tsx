'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { getAccessToken } from '@/lib/api';

export function AuthDebug() {
  const { user, isAuthenticated } = useAuthStore();
  const [token, setToken] = useState<string | null>(null);
  const [storageData, setStorageData] = useState<any>(null);

  useEffect(() => {
    // Get token from localStorage
    setToken(getAccessToken());

    // Get auth-storage
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      setStorageData(JSON.parse(authStorage));
    }
  }, []);

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      right: 0,
      background: 'black',
      color: 'lime',
      padding: '10px',
      fontSize: '12px',
      maxWidth: '400px',
      maxHeight: '300px',
      overflow: 'auto',
      fontFamily: 'monospace',
      zIndex: 9999,
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>🔍 Auth Debug</div>

      <div>
        <strong>isAuthenticated:</strong> {isAuthenticated ? '✅ true' : '❌ false'}
      </div>

      <div>
        <strong>user:</strong> {user ? `✅ ${user.username}` : '❌ null'}
      </div>

      <div>
        <strong>token:</strong> {token ? '✅ exists' : '❌ null'}
      </div>

      {token && (
        <div style={{ fontSize: '10px', wordBreak: 'break-all', marginTop: '5px' }}>
          {token.substring(0, 50)}...
        </div>
      )}

      {storageData && (
        <div style={{ marginTop: '10px' }}>
          <strong>Storage State:</strong>
          <pre style={{ fontSize: '10px', marginTop: '5px' }}>
            {JSON.stringify(storageData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
