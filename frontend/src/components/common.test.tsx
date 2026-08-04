// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {fireEvent,render,screen} from '@testing-library/react';
import {describe,expect,it} from 'vitest';
import {AppStateProvider} from '../app/AppStateProvider';
import {QuestionRow} from './common';

const item:any={id:'java-1',domain:'JAVA_THEORY',track:'CORE_JAVA',title:'Question',question:'Question',category:'Core',priority:'P1',modelAnswer:'Prepared',personalAnswer:'',notes:'',followUps:'A follow-up',latestResult:null,lastPractisedAt:null,nextReviewAt:null};
describe('QuestionRow',()=>{
  it('keeps follow-up questions hidden initially and updates aria-expanded',()=>{
    render(<AppStateProvider><QuestionRow item={item} java/></AppStateProvider>);
    fireEvent.click(screen.getByText('Question'));
    const toggle=screen.getByRole('button',{name:'Show follow-up questions'});
    expect(toggle).toHaveAttribute('aria-expanded','false');
    fireEvent.click(toggle);
    expect(screen.getByText('A follow-up')).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-expanded','true');
  });
});
