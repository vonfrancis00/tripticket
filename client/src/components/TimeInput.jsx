import { useEffect, useState } from 'react';

const parts = (value) => {
  if (!value) return { hour: '', minute: '', period: 'AM' };
  const [hour, minute] = value.split(':');
  return { hour: String(Number(hour) % 12 || 12), minute, period: Number(hour) >= 12 ? 'PM' : 'AM' };
};

export default function TimeInput({ value, onChange, required, label }) {
  const [selection, setSelection] = useState(() => parts(value));
  useEffect(() => {
    if (value) setSelection(parts(value));
  }, [value]);

  const update = (key, value) => {
    const next = { ...selection, [key]: value };
    setSelection(next);
    onChange(next.hour && next.minute
      ? `${String(Number(next.hour) % 12 + (next.period === 'PM' ? 12 : 0)).padStart(2, '0')}:${next.minute}`
      : '');
  };

  return (
    <div className="time-input" role="group" aria-label={label}>
      <select aria-label={`${label}: hour`} required={required} value={selection.hour} onChange={(e) => update('hour', e.target.value)}>
        <option value="">Hour</option>
        {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
      </select>
      <span aria-hidden="true">:</span>
      <select aria-label={`${label}: minute`} required={required} value={selection.minute} onChange={(e) => update('minute', e.target.value)}>
        <option value="">Min</option>
        {Array.from({ length: 60 }, (_, i) => {
          const minute = String(i).padStart(2, '0');
          return <option key={minute} value={minute}>{minute}</option>;
        })}
      </select>
      <select aria-label={`${label}: AM or PM`} value={selection.period} onChange={(e) => update('period', e.target.value)}>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}
