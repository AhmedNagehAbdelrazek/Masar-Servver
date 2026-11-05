import { runEscalation } from '../Services/sosService';

interface EscalationResult {
  alerted: number;
  escalated: number;
}

async function runSosEscalation(): Promise<EscalationResult> {
  const { alerted, escalated } = await (runEscalation as () => Promise<EscalationResult>)();
  return { alerted, escalated };
}

export { runSosEscalation };
export default { runSosEscalation };
module.exports = { runSosEscalation };
