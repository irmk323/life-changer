const Storage = (() => {
  const KEY = 'lifeChanger.v2', LEGACY_KEY = 'lifeChanger.v1';
  const clone = value => JSON.parse(JSON.stringify(value));
  function load() {
    const raw = localStorage.getItem(KEY);
    if (!raw) { const legacy = localStorage.getItem(LEGACY_KEY); if (legacy) return migrate(legacy); const state = createSampleData(); save(state); return state; }
    try { const state = JSON.parse(raw); if (!state || state.version !== 2) throw Error(); return state; }
    catch { alert('Saved prototype data cannot be read. Your data was not erased. You may reset it from the sidebar.'); return createSampleData(); }
  }
  function migrate(raw) { try { const state=JSON.parse(raw); if(!state || state.version!==1) throw Error(); state.version=2; state.priorities=state.priorities||[]; state.dismissedAutoPriorities=state.dismissedAutoPriorities||{}; state.dsa=(state.dsa||[]).map(p=>({...p,leetcodeUrl:p.leetcodeUrl||`https://leetcode.com/problemset/?search=${encodeURIComponent(p.title)}`,initialNotes:p.initialNotes||'',generalNotes:p.generalNotes||'',reviews:(p.reviews||[]).map(r=>({...r,completed:!!(r.completedAt || r.result),completedAt:r.completedAt||(r.result? r.dueAt:null),note:r.note||''}))})); save(state); return state; } catch { alert('Migration failed. Existing v1 data was kept unchanged. Use Reset prototype data if you want new sample data.'); return createSampleData(); } }
  function save(state) { localStorage.setItem(KEY, JSON.stringify(state)); }
  function reset() { const state = createSampleData(); save(state); return state; }
  function id(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }
  return { load, save, reset, id, clone };
})();
