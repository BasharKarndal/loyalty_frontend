import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCafeDirectory } from '../hooks/useCafeDirectory';
import { workspaceStorage } from '../lib/workspaceStorage';

export function WorkspaceSwitcher() {
  const queryClient = useQueryClient();
  const { cafes } = useCafeDirectory();
  const [value, setValue] = useState(workspaceStorage.get() ?? '');

  useEffect(() => workspaceStorage.subscribe(() => setValue(workspaceStorage.get() ?? '')), []);

  const handleChange = (next: string) => {
    setValue(next);
    workspaceStorage.set(next || null);
    queryClient.invalidateQueries();
  };

  return (
    <label className="flex min-w-0 items-center gap-2 text-xs font-bold text-muted">
      <span className="hidden shrink-0 lg:inline">عرض حساب</span>
      <select
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        className="max-w-[11rem] truncate border-b border-line bg-transparent py-1 text-sm font-bold text-ink outline-none transition-colors focus:border-wheat sm:max-w-[14rem]"
      >
        <option value="">كل الحسابات</option>
        {cafes.map((cafe) => (
          <option key={cafe.id} value={cafe.id}>
            {cafe.cafe_name?.trim() || cafe.full_name}
          </option>
        ))}
      </select>
    </label>
  );
}
