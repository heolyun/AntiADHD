import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  LogOut,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import './styles.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
const COLORS = ['#2563eb', '#059669', '#dc2626', '#d97706', '#7c3aed', '#0891b2'];
const REPEAT_TYPES = ['NONE', 'DAILY', 'WEEKLY', 'MONTHLY'];
const VIEW_LABEL = { today: '오늘', week: '주간', month: '월간' };
const REPEAT_LABEL = { NONE: '반복 없음', DAILY: '매일', WEEKLY: '매주', MONTHLY: '매월' };

function toInputValue(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toDateKey(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function displayTime(value) {
  return new Date(value).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

function displayDate(value) {
  return new Date(value).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
}

function startOfWeek(date) {
  const next = new Date(date);
  const day = next.getDay() || 7;
  next.setDate(next.getDate() - day + 1);
  return next;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function defaultForm(baseDate = new Date()) {
  const start = new Date(baseDate);
  start.setMinutes(0, 0, 0);
  if (start < new Date()) start.setHours(new Date().getHours() + 1, 0, 0, 0);
  const end = new Date(start);
  end.setHours(end.getHours() + 1);
  return {
    title: '',
    description: '',
    startAt: toInputValue(start),
    endAt: toInputValue(end),
    color: COLORS[0],
    repeatType: 'NONE',
  };
}

function useApi(token, onUnauthorized) {
  return useMemo(() => async (path, options = {}) => {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
    if (response.status === 401 || response.status === 403) {
      onUnauthorized();
      throw new Error('로그인이 만료되었습니다.');
    }
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || '요청을 처리하지 못했습니다.');
    }
    if (response.status === 204) return null;
    return response.json();
  }, [token, onUnauthorized]);
}

function App() {
  const [session, setSession] = useState(() => {
    const raw = localStorage.getItem('antiadhd.session');
    return raw ? JSON.parse(raw) : null;
  });
  const [view, setView] = useState('today');
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const [form, setForm] = useState(defaultForm());
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const logout = () => {
    localStorage.removeItem('antiadhd.session');
    setSession(null);
  };
  const api = useApi(session?.token, logout);

  useEffect(() => {
    if (session) localStorage.setItem('antiadhd.session', JSON.stringify(session));
  }, [session]);

  useEffect(() => {
    if (!session) return;
    loadSchedules();
  }, [session, view, anchorDate]);

  const rangeTitle = useMemo(() => {
    if (view === 'today') return anchorDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' });
    if (view === 'week') {
      const start = startOfWeek(anchorDate);
      const end = addDays(start, 6);
      return `${start.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}`;
    }
    return anchorDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
  }, [view, anchorDate]);

  async function loadSchedules() {
    setLoading(true);
    setError('');
    try {
      let path = `/schedules/${view}`;
      if (view === 'today' || view === 'week') path += `?date=${toDateKey(anchorDate)}`;
      if (view === 'month') path += `?year=${anchorDate.getFullYear()}&month=${anchorDate.getMonth() + 1}`;
      setSchedules(await api(path));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function moveRange(direction) {
    const next = new Date(anchorDate);
    if (view === 'today') next.setDate(next.getDate() + direction);
    if (view === 'week') next.setDate(next.getDate() + direction * 7);
    if (view === 'month') next.setMonth(next.getMonth() + direction);
    setAnchorDate(next);
  }

  function openCreate() {
    setEditingId(null);
    setForm(defaultForm(anchorDate));
    setIsFormOpen(true);
  }

  function openEdit(schedule) {
    setEditingId(schedule.id);
    setForm({
      title: schedule.title,
      description: schedule.description || '',
      startAt: schedule.startAt.slice(0, 16),
      endAt: schedule.endAt.slice(0, 16),
      color: schedule.color,
      repeatType: schedule.repeatType,
    });
    setIsFormOpen(true);
  }

  async function submitSchedule(event) {
    event.preventDefault();
    setError('');
    try {
      const payload = { ...form, startAt: form.startAt, endAt: form.endAt };
      const path = editingId ? `/schedules/${editingId}` : '/schedules';
      await api(path, { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      setIsFormOpen(false);
      await loadSchedules();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleComplete(schedule) {
    await api(`/schedules/${schedule.id}/complete`, {
      method: 'PATCH',
      body: JSON.stringify({ completed: !schedule.completed }),
    });
    await loadSchedules();
  }

  async function deleteSchedule(id) {
    await api(`/schedules/${id}`, { method: 'DELETE' });
    await loadSchedules();
  }

  if (!session) return <AuthScreen onSession={setSession} />;

  const grouped = groupSchedules(schedules);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark"><CalendarDays size={22} /></span>
          <div>
            <strong>AntiADHD</strong>
            <span>Time Block</span>
          </div>
        </div>
        <div className="profile">
          <span>{session.user.name}</span>
          <button className="icon-button" onClick={logout} title="로그아웃"><LogOut size={18} /></button>
        </div>
        <nav className="view-tabs">
          {Object.entries(VIEW_LABEL).map(([key, label]) => (
            <button key={key} className={view === key ? 'active' : ''} onClick={() => setView(key)}>
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <section className="planner">
        <header className="planner-header">
          <div>
            <p className="eyebrow">{VIEW_LABEL[view]} 일정</p>
            <h1>{rangeTitle}</h1>
          </div>
          <div className="header-actions">
            <button className="icon-button" onClick={() => moveRange(-1)} title="이전"><ChevronLeft size={20} /></button>
            <button className="text-button" onClick={() => setAnchorDate(new Date())}>오늘</button>
            <button className="icon-button" onClick={() => moveRange(1)} title="다음"><ChevronRight size={20} /></button>
            <button className="primary-button" onClick={openCreate}><Plus size={18} />일정</button>
          </div>
        </header>

        {error && <div className="notice">{error}</div>}

        <div className="content-grid">
          <section className="timeline">
            {loading ? <div className="empty">불러오는 중...</div> : null}
            {!loading && schedules.length === 0 ? <div className="empty">아직 등록된 일정이 없습니다.</div> : null}
            {!loading && Object.entries(grouped).map(([date, items]) => (
              <div className="day-group" key={date}>
                <h2>{displayDate(date)}</h2>
                <div className="schedule-list">
                  {items.map((schedule) => (
                    <article className={`schedule-card ${schedule.completed ? 'done' : ''}`} key={schedule.id}>
                      <button
                        className="complete-button"
                        onClick={() => toggleComplete(schedule)}
                        title="완료 체크"
                        style={{ borderColor: schedule.color }}
                      >
                        {schedule.completed && <Check size={16} />}
                      </button>
                      <div className="schedule-main">
                        <div className="schedule-topline">
                          <span className="time"><Clock size={15} />{displayTime(schedule.startAt)} - {displayTime(schedule.endAt)}</span>
                          <span className="repeat">{REPEAT_LABEL[schedule.repeatType]}</span>
                        </div>
                        <h3>{schedule.title}</h3>
                        {schedule.description && <p>{schedule.description}</p>}
                      </div>
                      <div className="card-actions">
                        <button className="icon-button" onClick={() => openEdit(schedule)} title="수정"><Pencil size={17} /></button>
                        <button className="icon-button danger" onClick={() => deleteSchedule(schedule.id)} title="삭제"><Trash2 size={17} /></button>
                      </div>
                      <span className="color-bar" style={{ background: schedule.color }} />
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <aside className="focus-panel">
            <h2>선택 범위</h2>
            <div className="stat">
              <span>전체</span>
              <strong>{schedules.length}</strong>
            </div>
            <div className="stat">
              <span>완료</span>
              <strong>{schedules.filter((item) => item.completed).length}</strong>
            </div>
            <div className="progress">
              <span style={{ width: `${schedules.length ? (schedules.filter((item) => item.completed).length / schedules.length) * 100 : 0}%` }} />
            </div>
          </aside>
        </div>
      </section>

      {isFormOpen && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={submitSchedule}>
            <div className="modal-header">
              <h2>{editingId ? '일정 수정' : '일정 생성'}</h2>
              <button type="button" className="icon-button" onClick={() => setIsFormOpen(false)} title="닫기"><X size={18} /></button>
            </div>
            <label>제목<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required maxLength={120} /></label>
            <label>메모<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={1000} /></label>
            <div className="form-row">
              <label>시작<input type="datetime-local" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} required /></label>
              <label>종료<input type="datetime-local" value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} required /></label>
            </div>
            <label>반복
              <select value={form.repeatType} onChange={(e) => setForm({ ...form, repeatType: e.target.value })}>
                {REPEAT_TYPES.map((type) => <option key={type} value={type}>{REPEAT_LABEL[type]}</option>)}
              </select>
            </label>
            <div className="color-picker">
              {COLORS.map((color) => (
                <button
                  type="button"
                  key={color}
                  className={form.color === color ? 'selected' : ''}
                  style={{ background: color }}
                  onClick={() => setForm({ ...form, color })}
                  title={color}
                />
              ))}
            </div>
            <button className="primary-button full" type="submit">{editingId ? '저장' : '생성'}</button>
          </form>
        </div>
      )}
    </main>
  );
}

function groupSchedules(items) {
  return items.reduce((acc, item) => {
    const key = item.startAt.slice(0, 10);
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {});
}

function AuthScreen({ onSession }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', name: '', password: '' });
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      const payload = mode === 'signup' ? form : { email: form.email, password: form.password };
      const response = await fetch(`${API_BASE_URL}/auth/${mode === 'signup' ? 'signup' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await response.text());
      onSession(await response.json());
    } catch (err) {
      setError(err.message || '인증 요청에 실패했습니다.');
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-panel">
        <div className="brand large">
          <span className="brand-mark"><CalendarDays size={26} /></span>
          <div>
            <strong>AntiADHD</strong>
            <span>개인 일정관리와 타임블록</span>
          </div>
        </div>
        <div className="auth-tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>로그인</button>
          <button className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>회원가입</button>
        </div>
        <form onSubmit={submit}>
          <label>이메일<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
          {mode === 'signup' && <label>이름<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={2} /></label>}
          <label>비밀번호<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} /></label>
          {error && <div className="notice">{error}</div>}
          <button className="primary-button full" type="submit">{mode === 'signup' ? '계정 만들기' : '로그인'}</button>
        </form>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
