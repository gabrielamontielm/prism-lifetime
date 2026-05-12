import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Loader2, LogIn, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { Dialog } from './ui/Dialog';

export function IntegrationsDialog({ onClose }: { onClose: () => void }) {
  return (
    <Dialog isOpen={true} onClose={onClose} title="Integrations" className="max-w-md">
      <div className="p-6 border rounded-2xl flex justify-between items-center">
        <span>Google Photos</span>
        <Button size="sm">Connect</Button>
      </div>
    </Dialog>
  );
}
