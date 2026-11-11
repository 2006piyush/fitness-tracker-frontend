import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  deleteActivity,
  generateRecommendation,
  getActivities,
  getRecommendations,
  trackActivity,
} from '../services/apiService';

const NAV_ITEMS = [
  { label: 'Overview', icon: 'overview', target: 'overview' },
  { label: 'Activities', icon: 'activity', target: 'activities' },
  { label: 'Workouts', icon: 'workouts', target: 'workouts' },
  { label: 'Recommendations', icon: 'spark', target: 'recommendations' },
  { label: 'Progress analytics', icon: 'analytics', target: 'analytics' },
  { label: 'Profile', icon: 'profile', target: 'profile' },
  { label: 'Settings', icon: 'settings', target: 'settings' },
];

const DEFAULT_GOALS = { minutes: 150, workouts: 4 };

function Icon({ name, size = 20 }) {
  const paths = {
    overview: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    activity: <><path d="M3 12h4l3-8 4 16 3-8h4" /></>,
    workouts: <><path d="M6.5 6.5v11M17.5 6.5v11M3 9v6M21 9v6M6.5 12h11" /></>,
    spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" /><path d="m19 14 1 2.5 2 1-2 1L19 21l-1-2.5-2-1 2-1 1-2.5Z" /></>,
    analytics: <><path d="M4 19V5M4 19h17" /><path d="m7 15 4-4 3 2 6-7" /></>,
    profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.6.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.6-.9l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.9l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.6-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.6.9l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 1.8Z" /></>,
    flame: <><path d="M12 22c4.4 0 7-3 7-7 0-3.1-1.8-5.5-4-7-.2 2-1.4 3.2-2.4 3.8C12.8 7.5 10 4 7 2c.4 4.3-3 7.5-3 12 0 4.7 3.2 8 8 8Z" /><path d="M12 22c-2 0-3-1.4-3-3.2 0-1.3.8-2.6 2-3.6.2 1.4 1.4 2 2 2.3 1.1 1.7.4 4.5-1 4.5Z" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    steps: <><path d="M7 14c1.7 0 3-1.8 3-4s-1.3-4-3-4-3 1.8-3 4 1.3 4 3 4ZM17 18c1.7 0 3-1.8 3-4s-1.3-4-3-4-3 1.8-3 4 1.3 4 3 4Z" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-6" /></>,
    arrow: <><path d="M7 17 17 7M7 7h10v10" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  };

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name] || paths.activity}
    </svg>
  );
}

function startOfWeek(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  return result;
}

function sameDay(left, right) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function getActivityDate(activity) {
  const date = new Date(activity.startTime);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getSteps(activity) {
  const metrics = activity.additionalMetrics;
  if (!metrics || typeof metrics !== 'object') return null;

  const entry = Object.entries(metrics).find(([key]) => key.toLowerCase() === 'steps');
  if (!entry) return null;

  const steps = Number(entry[1]);
  return Number.isFinite(steps) ? steps : null;
}

function formatNumber(value) {
  return new Intl.NumberFormat().format(Math.round(value));
}

function getStoredGoals() {
  try {
    const stored = JSON.parse(localStorage.getItem('fitness-goals') || 'null');
    return {
      minutes: Number.isFinite(Number(stored?.minutes)) && Number(stored.minutes) > 0
        ? Number(stored.minutes)
        : DEFAULT_GOALS.minutes,
      workouts: Number.isFinite(Number(stored?.workouts)) && Number(stored.workouts) > 0
        ? Number(stored.workouts)
        : DEFAULT_GOALS.workouts,
    };
  } catch {
    return DEFAULT_GOALS;
  }
}

function ProgressRing({ value, label, detail }) {
  const progress = Math.min(value, 100);
  return (
    <div
      className="progress-ring"
      style={{ '--ring-progress': `${progress * 3.6}deg` }}
      role="img"
      aria-label={`${label}: ${Math.round(value)} percent`}
    >
      <div className="progress-ring-inner">
        <strong>{Math.round(value)}%</strong>
        <span>{label}</span>
      </div>
      <p>{detail}</p>
    </div>
  );
}

function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [activities, setActivities] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [chartRange, setChartRange] = useState('week');
  const [activeSection, setActiveSection] = useState('overview');
  const [goals, setGoals] = useState(getStoredGoals);
  const [activityForm, setActivityForm] = useState({
    type: 'RUNNING',
    duration: 30,
    caloriesBurned: 0,
    startTime: '',
    additionalMetrics: [{ key: '', value: '' }],
  });
  const [recommendationForm, setRecommendationForm] = useState({
    activityId: '',
    improvements: '',
    suggestions: '',
    safety: '',
  });

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  useEffect(() => {
    localStorage.setItem('fitness-goals', JSON.stringify(goals));
  }, [goals]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const activityData = await getActivities(user.id);
      setActivities(activityData);
      setRecommendationForm((previous) => ({
        ...previous,
        activityId: activityData.some((activity) => activity.id === previous.activityId)
          ? previous.activityId
          : activityData.length > 0 ? activityData[0].id : '',
      }));
      setRecommendations(await getRecommendations(user.id));
    } catch (error) {
      console.error('Fetch data error:', error);
      setStatus('Unable to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const weekStart = startOfWeek(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const validActivities = useMemo(
    () => activities
      .map((activity) => ({ ...activity, parsedDate: getActivityDate(activity) }))
      .filter((activity) => activity.parsedDate)
      .sort((left, right) => right.parsedDate - left.parsedDate),
    [activities]
  );
  const todayActivities = validActivities.filter((activity) => sameDay(activity.parsedDate, now));
  const weekActivities = validActivities.filter((activity) => activity.parsedDate >= weekStart);
  const monthActivities = validActivities.filter((activity) => activity.parsedDate >= monthStart);
  const todayCalories = todayActivities.reduce((sum, activity) => sum + (Number(activity.caloriesBurned) || 0), 0);
  const todaySteps = todayActivities.reduce((sum, activity) => sum + (getSteps(activity) || 0), 0);
  const trackedStepsToday = todayActivities.some((activity) => getSteps(activity) !== null);
  const weekMinutes = weekActivities.reduce((sum, activity) => sum + (Number(activity.duration) || 0), 0);
  const weekCalories = weekActivities.reduce((sum, activity) => sum + (Number(activity.caloriesBurned) || 0), 0);
  const minutesProgress = (weekMinutes / goals.minutes) * 100;
  const workoutsProgress = (weekActivities.length / goals.workouts) * 100;
  const currentPeriodActivities = chartRange === 'week' ? weekActivities : monthActivities;

  const chartData = useMemo(() => {
    if (chartRange === 'week') {
      return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + index);
        const matchingActivities = currentPeriodActivities.filter((activity) => sameDay(activity.parsedDate, date));
        return {
          label: date.toLocaleDateString(undefined, { weekday: 'short' }),
          value: matchingActivities.reduce((sum, activity) => sum + (Number(activity.duration) || 0), 0),
          detail: `${matchingActivities.length} ${matchingActivities.length === 1 ? 'workout' : 'workouts'}`,
        };
      });
    }

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const bucketCount = Math.ceil(daysInMonth / 7);
    return Array.from({ length: bucketCount }, (_, index) => {
      const startDay = index * 7 + 1;
      const endDay = Math.min(startDay + 6, daysInMonth);
      const matchingActivities = currentPeriodActivities.filter(
        (activity) => activity.parsedDate.getDate() >= startDay && activity.parsedDate.getDate() <= endDay
      );
      return {
        label: `Week ${index + 1}`,
        value: matchingActivities.reduce((sum, activity) => sum + (Number(activity.duration) || 0), 0),
        detail: `${matchingActivities.length} ${matchingActivities.length === 1 ? 'workout' : 'workouts'}`,
      };
    });
  }, [chartRange, currentPeriodActivities, now.getMonth(), now.getFullYear(), weekStart]);
  const chartMaximum = Math.max(...chartData.map((item) => item.value), 1);
  const recentActivities = validActivities.slice(0, 4);
  const firstName = user?.firstName || user?.email?.split('@')[0] || 'Athlete';
  const initials = (user?.firstName || user?.email || 'A').slice(0, 1).toUpperCase();

  const handleLogout = () => clearAuth();

  const handleActivitySubmit = async (event) => {
    event.preventDefault();
    if (!user) return;
    try {
      const metrics = activityForm.additionalMetrics.reduce((result, item) => {
        if (item.key.trim() && item.value.trim()) result[item.key.trim()] = item.value.trim();
        return result;
      }, {});
      await trackActivity({
        userId: user.id,
        type: activityForm.type,
        duration: activityForm.duration,
        caloriesBurned: activityForm.caloriesBurned,
        startTime: activityForm.startTime,
        additionalMetrics: metrics,
      });
      setStatus('Activity saved successfully.');
      setActivityForm({
        type: 'RUNNING',
        duration: 30,
        caloriesBurned: 0,
        startTime: '',
        additionalMetrics: [{ key: '', value: '' }],
      });
      await fetchData();
    } catch (error) {
      console.error('Track activity error:', error);
      setStatus(error instanceof Error ? error.message : 'Unable to save activity.');
    }
  };

  const handleRecommendationSubmit = async () => {
    if (!user) return;
    if (!recommendationForm.activityId) {
      setStatus('Please select an activity first.');
      return;
    }
    try {
      await generateRecommendation({
        userId: user.id,
        activityId: recommendationForm.activityId,
        improvements: recommendationForm.improvements.split(',').map((item) => item.trim()).filter(Boolean),
        suggestions: recommendationForm.suggestions.split(',').map((item) => item.trim()).filter(Boolean),
        safety: recommendationForm.safety.split(',').map((item) => item.trim()).filter(Boolean),
      });
      setStatus('Recommendation generated successfully.');
      await fetchData();
    } catch (error) {
      console.error('Recommendation generation failed:', error);
      setStatus(error instanceof Error ? error.message : 'Unable to generate recommendation.');
    }
  };

  const handleDeleteActivity = async (activityId) => {
    try {
      await deleteActivity(activityId);
      setStatus('Activity deleted successfully.');
      await fetchData();
    } catch (error) {
      console.error('Delete activity error:', error);
      setStatus(error instanceof Error ? error.message : 'Unable to delete activity.');
    }
  };

  const navigateTo = (target) => {
    setMobileNavOpen(false);
    setActiveSection(target);
    document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="app-shell">
      <aside className={`app-sidebar${mobileNavOpen ? ' is-open' : ''}`}>
        <a className="brand-lockup" href="#overview" onClick={(event) => { event.preventDefault(); navigateTo('overview'); }}>
          <span className="brand-mark"><Icon name="activity" size={22} /></span>
          <span>FITNESS TRACKER<span className="brand-period">.</span><small>PERFORMANCE DASHBOARD</small></span>
        </a>

        <div className="sidebar-label">WORKSPACE</div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.target}
              className={`nav-item${item.target === activeSection ? ' is-active' : ''}`}
              href={`#${item.target}`}
              onClick={(event) => { event.preventDefault(); navigateTo(item.target); }}
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
              {item.target === activeSection && <span className="nav-active-mark" />}
            </a>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-motivation">
            <span className="sidebar-motivation-icon"><Icon name="flame" size={18} /></span>
            <div><strong>Keep showing up.</strong><span>Progress is built daily.</span></div>
          </div>
          <button type="button" className="sidebar-logout" onClick={handleLogout}>
            <Icon name="logout" size={18} /> Sign out
          </button>
        </div>
      </aside>

      {mobileNavOpen && <button className="mobile-nav-backdrop" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}

      <main className="dashboard-main">
        <header className="topbar">
          <button
            type="button"
            className="mobile-menu-button"
            aria-label="Open navigation"
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            <Icon name="menu" />
          </button>
          <div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-divider">/</span><strong>Overview</strong></div>
          <button type="button" className="profile-button" onClick={() => navigateTo('profile')}>
            <span className="avatar">{initials}</span>
            <span className="profile-button-copy"><strong>{user?.firstName || 'Athlete'}</strong><small>My profile</small></span>
            <span className="profile-chevron">⌄</span>
          </button>
        </header>

        <div className="dashboard-content">
          <section className="welcome-row" id="overview">
            <div>
              <div className="eyebrow"><span className="live-dot" /> YOUR PERFORMANCE, AT A GLANCE</div>
              <h1>Good {now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening'}, {firstName}<span className="lime-period">.</span></h1>
              <p>Every session counts. Here’s how your training is moving forward.</p>
            </div>
            <button type="button" className="primary-button" onClick={() => navigateTo('activities')}>
              <Icon name="plus" size={18} /> Log activity
            </button>
          </section>

          {status && (
            <div className="status-message" role="status">
              <span>{status}</span>
              <button type="button" aria-label="Dismiss message" onClick={() => setStatus(null)}>×</button>
            </div>
          )}

          <section className="stat-grid" aria-label="Today's activity summary">
            <article className="stat-card">
              <div className="stat-card-top"><span className="stat-icon lime"><Icon name="flame" /></span><span className="stat-period">TODAY</span></div>
              <div className="stat-value">{loading ? '—' : formatNumber(todayCalories)}<span>kcal</span></div>
              <div className="stat-caption">Calories burned</div>
              <div className="stat-footnote">From your logged activities</div>
            </article>
            <article className="stat-card">
              <div className="stat-card-top"><span className="stat-icon blue"><Icon name="steps" /></span><span className="stat-period">TODAY</span></div>
              <div className="stat-value">{loading ? '—' : trackedStepsToday ? formatNumber(todaySteps) : '—'}<span>{trackedStepsToday ? 'steps' : ''}</span></div>
              <div className="stat-caption">Steps taken</div>
              <div className="stat-footnote">{trackedStepsToday ? 'From your logged activities' : 'Add a “steps” metric to an activity'}</div>
            </article>
            <article className="stat-card">
              <div className="stat-card-top"><span className="stat-icon orange"><Icon name="clock" /></span><span className="stat-period">THIS WEEK</span></div>
              <div className="stat-value">{loading ? '—' : formatNumber(weekMinutes)}<span>min</span></div>
              <div className="stat-caption">Training duration</div>
              <div className="stat-footnote">{weekActivities.length} logged {weekActivities.length === 1 ? 'session' : 'sessions'}</div>
            </article>
            <article className="stat-card">
              <div className="stat-card-top"><span className="stat-icon purple"><Icon name="workouts" /></span><span className="stat-period">THIS WEEK</span></div>
              <div className="stat-value">{loading ? '—' : weekActivities.length}<span>{weekActivities.length === 1 ? 'workout' : 'workouts'}</span></div>
              <div className="stat-caption">Sessions completed</div>
              <div className="stat-footnote">{loading ? 'Loading activity data' : `${formatNumber(weekCalories)} kcal this week`}</div>
            </article>
          </section>

          <section className="analytics-grid" id="analytics">
            <article className="surface-card activity-chart-card">
              <div className="section-heading">
                <div><div className="eyebrow">YOUR TRAINING VOLUME</div><h2>Activity overview</h2></div>
                <div className="range-switch" role="group" aria-label="Chart range">
                  <button type="button" className={chartRange === 'week' ? 'selected' : ''} onClick={() => setChartRange('week')}>Week</button>
                  <button type="button" className={chartRange === 'month' ? 'selected' : ''} onClick={() => setChartRange('month')}>Month</button>
                </div>
              </div>
              <div className="chart-summary"><strong>{chartRange === 'week' ? formatNumber(weekMinutes) : formatNumber(monthActivities.reduce((sum, activity) => sum + (Number(activity.duration) || 0), 0))}<span> min</span></strong><span>Training duration</span></div>
              {loading ? (
                <div className="chart-empty">Loading your training data…</div>
              ) : (
                <div className={`bar-chart${chartRange === 'month' ? ' is-month' : ''}`} role="list" aria-label={`${chartRange} training duration by ${chartRange === 'week' ? 'day' : 'week'}`}>
                  {chartData.map((item, index) => (
                    <div className={`chart-column${item.value > 0 ? ' has-data' : ''}${chartRange === 'week' && sameDay(new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + index), now) ? ' is-today' : ''}`} key={item.label} role="listitem">
                      <div className="chart-bar-wrap">
                        <div
                          className="chart-bar"
                          style={{ height: `${Math.max(item.value > 0 ? (item.value / chartMaximum) * 100 : 0, item.value > 0 ? 8 : 2)}%` }}
                          title={`${item.label}: ${item.value} min · ${item.detail}`}
                          aria-label={`${item.label}: ${item.value} minutes, ${item.detail}`}
                          role="img"
                        />
                      </div>
                      <span className="chart-label">{item.label}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="chart-legend"><span className="legend-dot" /> Minutes trained <span className="chart-legend-note">Hover a bar for details</span></div>
            </article>

            <article className="surface-card goals-card">
              <div className="section-heading">
                <div><div className="eyebrow">CONSISTENCY BUILDS RESULTS</div><h2>Weekly goals</h2></div>
                <button className="text-button" type="button" onClick={() => navigateTo('settings')}>Edit goals <Icon name="arrow" size={15} /></button>
              </div>
              {loading ? <div className="goals-loading">Loading your progress…</div> : (
                <div className="goal-progress-list">
                  <div className="goal-progress-item">
                    <div className="goal-item-heading"><span>Training time</span><strong>{formatNumber(weekMinutes)} <small>/ {formatNumber(goals.minutes)} min</small></strong></div>
                    <div className="progress-track"><span style={{ width: `${Math.min(minutesProgress, 100)}%` }} /></div>
                    <div className="goal-item-foot"><span>{Math.round(minutesProgress)}% complete</span><span>{Math.max(goals.minutes - weekMinutes, 0)} min to goal</span></div>
                  </div>
                  <div className="goal-progress-item">
                    <div className="goal-item-heading"><span>Workout sessions</span><strong>{weekActivities.length} <small>/ {goals.workouts} workouts</small></strong></div>
                    <div className="progress-track progress-track-blue"><span style={{ width: `${Math.min(workoutsProgress, 100)}%` }} /></div>
                    <div className="goal-item-foot"><span>{Math.round(workoutsProgress)}% complete</span><span>{Math.max(goals.workouts - weekActivities.length, 0)} to go</span></div>
                  </div>
                  <div className="goal-ring-row">
                    <ProgressRing value={minutesProgress} label="Weekly goal" detail={`${formatNumber(weekMinutes)} of ${formatNumber(goals.minutes)} minutes`} />
                    <div className="goal-ring-copy"><strong>Keep your momentum.</strong><p>Small, consistent sessions add up to lasting progress.</p></div>
                  </div>
                </div>
              )}
            </article>
          </section>

          <section className="content-grid">
            <article className="surface-card recent-card" id="workouts">
              <div className="section-heading">
                <div><div className="eyebrow">YOUR LATEST SESSIONS</div><h2>Recent workouts</h2></div>
                <button className="text-button" type="button" onClick={() => navigateTo('activities')}>All activities <Icon name="arrow" size={15} /></button>
              </div>
              {loading ? <div className="empty-state">Loading your workouts…</div> : recentActivities.length === 0 ? (
                <div className="empty-state"><span className="empty-state-icon"><Icon name="activity" size={22} /></span><strong>Your training log starts here</strong><p>Log your first activity to see your progress take shape.</p><button className="small-primary-button" type="button" onClick={() => navigateTo('activities')}><Icon name="plus" size={15} /> Log an activity</button></div>
              ) : (
                <div className="recent-list">
                  {recentActivities.map((activity) => (
                    <div className="recent-item" key={activity.id}>
                      <span className="workout-type-icon"><Icon name={activity.type === 'RUNNING' || activity.type === 'WALKING' ? 'activity' : 'workouts'} size={18} /></span>
                      <div className="recent-workout-copy"><strong>{(activity.type || 'Workout').replaceAll('_', ' ')}</strong><span>{activity.parsedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></div>
                      <span className="recent-workout-stat"><Icon name="clock" size={15} /> {Number(activity.duration) || 0} min</span>
                      <span className="recent-workout-stat calories-stat"><Icon name="flame" size={15} /> {formatNumber(Number(activity.caloriesBurned) || 0)} kcal</span>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className="surface-card daily-card">
              <div className="section-heading">
                <div><div className="eyebrow">TODAY, SO FAR</div><h2>Daily activity</h2></div>
                <span className="today-date"><Icon name="calendar" size={15} /> {now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              </div>
              <div className="daily-activity-list">
                <div><span className="daily-icon lime"><Icon name="flame" size={17} /></span><span>Calories burned</span><strong>{loading ? '—' : `${formatNumber(todayCalories)} kcal`}</strong></div>
                <div><span className="daily-icon blue"><Icon name="steps" size={17} /></span><span>Steps</span><strong>{loading ? '—' : trackedStepsToday ? formatNumber(todaySteps) : 'Not tracked'}</strong></div>
                <div><span className="daily-icon orange"><Icon name="clock" size={17} /></span><span>Workout time</span><strong>{loading ? '—' : `${formatNumber(todayActivities.reduce((sum, activity) => sum + (Number(activity.duration) || 0), 0))} min`}</strong></div>
                <div><span className="daily-icon purple"><Icon name="workouts" size={17} /></span><span>Sessions</span><strong>{loading ? '—' : todayActivities.length}</strong></div>
              </div>
              {!trackedStepsToday && !loading && <p className="data-note">Steps appear when you include a “steps” metric in a logged activity.</p>}
            </article>
          </section>

          <section className="management-grid">
            <article className="surface-card management-card" id="activities">
              <div className="section-heading">
                <div><div className="eyebrow">ADD TO YOUR TRAINING LOG</div><h2>Log an activity</h2></div>
              </div>
              <form onSubmit={handleActivitySubmit} className="panel-form">
                <label>Activity type
                  <select value={activityForm.type} onChange={(event) => setActivityForm({ ...activityForm, type: event.target.value })}>
                    <option>RUNNING</option><option>WALKING</option><option>CYCLING</option><option>SWIMMING</option><option>WEIGHT_TRAINING</option><option>YOGA</option><option>HIIT</option><option>CARDIO</option><option>STRETCHING</option><option>OTHER</option>
                  </select>
                </label>
                <div className="form-two-column">
                  <label>Duration (minutes)<input value={activityForm.duration} onChange={(event) => setActivityForm({ ...activityForm, duration: Number(event.target.value) })} type="number" min={1} required /></label>
                  <label>Calories burned<input value={activityForm.caloriesBurned} onChange={(event) => setActivityForm({ ...activityForm, caloriesBurned: Number(event.target.value) })} type="number" min={0} /></label>
                </div>
                <label>Start time<input value={activityForm.startTime} onChange={(event) => setActivityForm({ ...activityForm, startTime: event.target.value })} type="datetime-local" required /></label>
                <fieldset className="metrics-fieldset">
                  <legend>Additional metrics</legend>
                  {activityForm.additionalMetrics.map((metric, index) => (
                    <div className="metric-row" key={index}>
                      <input aria-label="Metric name" value={metric.key} placeholder="Metric name (e.g. steps)" onChange={(event) => {
                        const updated = [...activityForm.additionalMetrics];
                        updated[index] = { ...updated[index], key: event.target.value };
                        setActivityForm({ ...activityForm, additionalMetrics: updated });
                      }} />
                      <input aria-label="Metric value" value={metric.value} placeholder="Value" onChange={(event) => {
                        const updated = [...activityForm.additionalMetrics];
                        updated[index] = { ...updated[index], value: event.target.value };
                        setActivityForm({ ...activityForm, additionalMetrics: updated });
                      }} />
                      <button className="icon-action danger-action" type="button" aria-label="Remove metric" onClick={() => setActivityForm({ ...activityForm, additionalMetrics: activityForm.additionalMetrics.filter((_, metricIndex) => metricIndex !== index) })}>×</button>
                    </div>
                  ))}
                  <button className="text-button add-metric-button" type="button" onClick={() => setActivityForm({ ...activityForm, additionalMetrics: [...activityForm.additionalMetrics, { key: '', value: '' }] })}><Icon name="plus" size={15} /> Add metric</button>
                </fieldset>
                <button className="primary-button form-submit" type="submit"><Icon name="plus" size={17} /> Save activity</button>
              </form>
            </article>

            <article className="surface-card management-card" id="recommendations">
              <div className="section-heading">
                <div><div className="eyebrow">TRAIN SMARTER</div><h2>Recommendations</h2></div>
                <span className="recommendation-badge"><Icon name="spark" size={15} /> PERSONALIZED</span>
              </div>
              <div className="panel-form">
                <label>Activity
                  <select value={recommendationForm.activityId} onChange={(event) => setRecommendationForm({ ...recommendationForm, activityId: event.target.value })}>
                    <option value="">Select activity</option>
                    {activities.map((activity) => <option key={activity.id} value={activity.id}>{activity.type} ({new Date(activity.startTime).toLocaleDateString()})</option>)}
                  </select>
                </label>
                <label>Improvements<textarea value={recommendationForm.improvements} onChange={(event) => setRecommendationForm({ ...recommendationForm, improvements: event.target.value })} placeholder="Separate items with commas" /></label>
                <label>Suggestions<textarea value={recommendationForm.suggestions} onChange={(event) => setRecommendationForm({ ...recommendationForm, suggestions: event.target.value })} placeholder="Separate items with commas" /></label>
                <label>Safety<textarea value={recommendationForm.safety} onChange={(event) => setRecommendationForm({ ...recommendationForm, safety: event.target.value })} placeholder="Separate items with commas" /></label>
                <button className="primary-button form-submit" type="button" onClick={handleRecommendationSubmit} disabled={!activities.length}><Icon name="spark" size={17} /> Generate recommendation</button>
              </div>
              <div className="recommendation-history">
                <div className="eyebrow">SAVED RECOMMENDATIONS</div>
                {recommendations.length ? recommendations.map((recommendation) => (
                  <div className="recommendation-card" key={recommendation.id}>
                    <p><strong>Activity</strong><span>{recommendation.type || 'Workout'}</span></p>
                    <p><strong>Improvements</strong><span>{(recommendation.improvements || []).join(', ') || '—'}</span></p>
                    <p><strong>Suggestions</strong><span>{(recommendation.suggestions || []).join(', ') || '—'}</span></p>
                    <p><strong>Safety</strong><span>{(recommendation.safety || []).join(', ') || '—'}</span></p>
                  </div>
                )) : <p className="muted-empty">No recommendations yet. Select an activity to get started.</p>}
              </div>
            </article>
          </section>

          <section className="surface-card history-card" aria-labelledby="history-title">
            <div className="section-heading">
              <div><div className="eyebrow">YOUR COMPLETE TRAINING LOG</div><h2 id="history-title">Activity history</h2></div>
              <span className="history-count">{activities.length} {activities.length === 1 ? 'activity' : 'activities'}</span>
            </div>
            {loading ? <div className="empty-state">Loading activity history…</div> : activities.length === 0 ? (
              <div className="empty-state">Your logged activities will appear here.</div>
            ) : (
              <div className="table-scroll">
                <table className="activity-table">
                  <thead><tr><th>Activity</th><th>Duration</th><th>Calories</th><th>Start time</th><th aria-label="Actions" /></tr></thead>
                  <tbody>
                    {validActivities.map((activity) => (
                      <tr key={activity.id}>
                        <td><span className="table-activity-icon"><Icon name="activity" size={16} /></span>{(activity.type || 'Workout').replaceAll('_', ' ')}</td>
                        <td>{Number(activity.duration) || 0} min</td>
                        <td>{formatNumber(Number(activity.caloriesBurned) || 0)} kcal</td>
                        <td>{activity.parsedDate.toLocaleString()}</td>
                        <td><button className="table-delete-button" type="button" onClick={() => handleDeleteActivity(activity.id)}>Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="account-settings-grid">
            <article className="surface-card account-card" id="profile">
              <div className="section-heading">
                <div><div className="eyebrow">YOUR ACCOUNT</div><h2>Profile</h2></div>
              </div>
              <div className="account-profile">
                <span className="avatar avatar-large">{initials}</span>
                <div><strong>{[user?.firstName, user?.lastName].filter(Boolean).join(' ') || firstName}</strong><span>{user?.email}</span></div>
              </div>
              <button type="button" className="sidebar-logout account-logout" onClick={handleLogout}><Icon name="logout" size={17} /> Sign out</button>
            </article>
            <article className="surface-card account-card" id="settings">
              <div className="section-heading">
                <div><div className="eyebrow">MAKE IT YOURS</div><h2>Weekly goal settings</h2></div>
              </div>
              <p className="settings-description">Set personal targets for the progress indicators. Goals are saved in this browser.</p>
              <div className="goal-settings-form">
                <label>Training minutes per week<input type="number" min={1} value={goals.minutes} onChange={(event) => setGoals({ ...goals, minutes: Math.max(1, Number(event.target.value) || 1) })} /></label>
                <label>Workout sessions per week<input type="number" min={1} value={goals.workouts} onChange={(event) => setGoals({ ...goals, workouts: Math.max(1, Number(event.target.value) || 1) })} /></label>
              </div>
            </article>
          </section>
          <footer className="dashboard-footer"><span>FITNESS TRACKER</span><span>Built for your next personal best.</span></footer>
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;
