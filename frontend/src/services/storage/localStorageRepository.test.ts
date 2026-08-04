// @vitest-environment jsdom
import {beforeEach,describe,expect,it} from 'vitest';
import {load,normalise,REACT_KEY} from './localStorageRepository';

describe('storage migration',()=>{
  beforeEach(()=>localStorage.clear());
  it('normalises v2-style DSA review completion without changing the legacy key',()=>{
    const legacy={version:2,dsa:[{id:'d1',title:'Two Sum',reviews:[{id:'r1',stage:'D1',dueAt:'2026-08-04',result:'PASS'}]}]};
    localStorage.setItem('lifeChanger.v2',JSON.stringify(legacy));
    const state=load().state!;
    expect(state.dsa[0].reviews[0].completed).toBe(true);
    expect(localStorage.getItem('lifeChanger.v2')).toBe(JSON.stringify(legacy));
    expect(localStorage.getItem(REACT_KEY)).toContain('Two Sum');
  });
  it('rejects malformed values',()=>expect(()=>normalise(null)).toThrow('Malformed storage'));
});
