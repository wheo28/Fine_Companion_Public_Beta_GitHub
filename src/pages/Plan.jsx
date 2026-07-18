import { useParams, Navigate } from 'react-router-dom'
import CashFlowPlan from '../plan/CashFlowPlan'
import DebtPlan from '../plan/DebtPlan'
import EmergencyPlan from '../plan/EmergencyPlan'
import GoalPlan from '../plan/GoalPlan'
import RetirementPlan from '../plan/RetirementPlan'
import InsurancePlan from '../plan/InsurancePlan'

// Shared Planning Tool route (/plan/:moduleId). Live tools: cashflow, debt,
// emergency, goal, retirement, insurance. Unknown module -> home.
export default function Plan() {
  const { moduleId } = useParams()
  if (moduleId === 'cashflow') return <CashFlowPlan />
  if (moduleId === 'debt') return <DebtPlan />
  if (moduleId === 'emergency') return <EmergencyPlan />
  if (moduleId === 'goal') return <GoalPlan />
  if (moduleId === 'retirement') return <RetirementPlan />
  if (moduleId === 'insurance') return <InsurancePlan />
  return <Navigate to="/" replace />
}
