import type { ComponentType } from 'react';
import { useUI } from '../ui/overlay';
import { AdvanceSheet, ComplaintSheet, ExpenseSheet, ExplainSheet, LeaveSheet, PasswordSheet } from './forms';
import { LessonSheet, QuizSheet } from './learning';
import { IncidentSheet, SosSheet, VehicleCheckSheet } from './safety';
import { LoadSheet, RejectSheet } from './trip';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SHEETS: Record<string, ComponentType<any>> = {
  vcheck: VehicleCheckSheet, sos: SosSheet, incident: IncidentSheet,
  expense: ExpenseSheet, advance: AdvanceSheet, leave: LeaveSheet, explain: ExplainSheet, complaint: ComplaintSheet,
  reject: RejectSheet, load: LoadSheet, lesson: LessonSheet, quiz: QuizSheet, password: PasswordSheet
};
const TALL = new Set(['expense', 'load', 'quiz', 'sos', 'vcheck']);

export function SheetHost() {
  const { sheet, closing, closeSheet } = useUI();
  if (!sheet) return null;
  const C = SHEETS[sheet.name];
  if (!C) return null;
  return (
    <div className={`layer ${closing ? 'closing' : ''}`}>
      <div className="dim" onClick={closeSheet} />
      <div className={`sheet ${TALL.has(sheet.name) ? 'tall' : ''}`} role="dialog" aria-modal="true">
        <div className="grabber" />
        <C key={sheet.key} {...sheet.props} />
      </div>
    </div>
  );
}
