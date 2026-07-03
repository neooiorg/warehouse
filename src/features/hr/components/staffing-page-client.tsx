'use client';

import { useState } from 'react';
import { WorkflowTaskEditor } from './workflow-task-editor';
import { StaffingInputForm } from './staffing-input-form';
import { StaffingResultPanel } from './staffing-result-panel';
import type { StaffingResult } from '../api/types';

export function StaffingPageClient() {
  const [result, setResult] = useState<StaffingResult | null>(null);

  return (
    <div className='space-y-6'>
      <WorkflowTaskEditor />
      <div className='rounded-lg border p-4'>
        <h3 className='mb-3 text-sm font-semibold'>Tham số tính định biên</h3>
        <StaffingInputForm onResult={setResult} />
      </div>
      <StaffingResultPanel result={result} />
    </div>
  );
}
