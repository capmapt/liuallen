import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import type { Reminder } from '../lib/api';
import { createReminder, deleteReminder, fetchReminders, updateReminder } from '../lib/api';

const frequencies = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
] as const;

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formState, setFormState] = useState({
    frequency: 'daily' as Reminder['frequency'],
    timeOfDay: '09:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dayOfWeek: new Date().getDay() === 0 ? 7 : new Date().getDay(),
    dayOfMonth: new Date().getDate(),
  });

  const loadReminders = () => {
    setLoading(true);
    fetchReminders()
      .then((data) => {
        setReminders(data.reminders);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Unable to load reminders.');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadReminders();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await createReminder({
        frequency: formState.frequency,
        timeOfDay: formState.timeOfDay,
        timezone: formState.timezone,
        dayOfWeek: formState.frequency === 'weekly' ? formState.dayOfWeek : undefined,
        dayOfMonth: formState.frequency === 'monthly' ? formState.dayOfMonth : undefined,
      });
      loadReminders();
    } catch (err) {
      console.error(err);
      setError('Failed to create reminder.');
    }
  };

  const togglePause = async (reminder: Reminder) => {
    await updateReminder(reminder.id, { paused: !reminder.paused });
    loadReminders();
  };

  const removeReminder = async (id: string) => {
    await deleteReminder(id);
    loadReminders();
  };

  return (
    <Layout>
      <section className="card">
        <h1 style={{ marginTop: 0 }}>Reminder schedule</h1>
        <p style={{ color: '#475569' }}>
          Pick how often MailDiary should nudge you. Reply to the reminder emails with memories, photos, or attachments to
          save a new entry.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}>
          <label>
            Frequency
            <select
              value={formState.frequency}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  frequency: event.target.value as Reminder['frequency'],
                }))
              }
            >
              {frequencies.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Time of day
            <input
              type="time"
              value={formState.timeOfDay}
              onChange={(event) => setFormState((prev) => ({ ...prev, timeOfDay: event.target.value }))}
            />
          </label>
          <label>
            Timezone
            <input
              value={formState.timezone}
              onChange={(event) => setFormState((prev) => ({ ...prev, timezone: event.target.value }))}
            />
          </label>
          {formState.frequency === 'weekly' && (
            <label>
              Day of week (1 = Monday, 7 = Sunday)
              <input
                type="number"
                min={1}
                max={7}
                value={formState.dayOfWeek}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, dayOfWeek: Number.parseInt(event.target.value, 10) }))
                }
              />
            </label>
          )}
          {formState.frequency === 'monthly' && (
            <label>
              Day of month
              <input
                type="number"
                min={1}
                max={31}
                value={formState.dayOfMonth}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, dayOfMonth: Number.parseInt(event.target.value, 10) }))
                }
              />
            </label>
          )}
          <button type="submit">Save reminder</button>
          {error && <p style={{ color: '#dc2626' }}>{error}</p>}
        </form>
      </section>
      <section>
        {loading ? (
          <p>Loading reminders…</p>
        ) : reminders.length === 0 ? (
          <p>No reminders yet. Configure your first schedule above.</p>
        ) : (
          reminders.map((reminder) => (
            <div key={reminder.id} className="card">
              <h2 style={{ marginTop: 0 }}>{reminder.frequency.toUpperCase()}</h2>
              <p style={{ color: '#475569' }}>
                {reminder.time_of_day} — {reminder.timezone}
              </p>
              <p style={{ color: '#475569' }}>
                Next send: {new Date(reminder.next_run_at).toLocaleString()} ({reminder.paused ? 'Paused' : 'Active'})
              </p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => togglePause(reminder)} style={{ background: '#0ea5e9' }}>
                  {reminder.paused ? 'Resume' : 'Pause'}
                </button>
                <button type="button" onClick={() => removeReminder(reminder.id)} style={{ background: '#dc2626' }}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </Layout>
  );
}
