import {describe,expect,it} from 'vitest';
import {addDays,dueState,progress,reviewDate} from './calculations';

describe('review calculations',()=>{
  it('creates the three prototype review intervals',()=>{
    expect(reviewDate('FAIL')).toBe(addDays(1));
    expect(reviewDate('PARTIAL')).toBe(addDays(4));
    expect(reviewDate('PASS')).toBe(addDays(17));
  });
  it('includes text alongside urgency state',()=>{
    expect(dueState(addDays(0))[1]).toBe('Due today');
    expect(dueState(addDays(-2))[0]).toBe('OVERDUE');
  });
  it('calculates progress from completed items',()=>{
    expect(progress([{latestResult:'PASS'},{latestResult:null}] as never).percentage).toBe(50);
  });
});
