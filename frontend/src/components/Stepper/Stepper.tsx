import './Stepper.css'

const STEPS = [
  { index: 1, label: 'Producto' },
  { index: 2, label: 'Pago' },
  { index: 3, label: 'Envío' },
  { index: 4, label: 'Estado' },
]

function toStepperIndex(reduxStep: number): number {
  if (reduxStep <= 1) return 1
  if (reduxStep === 2) return 2
  if (reduxStep >= 2.5 && reduxStep < 4) return 3
  return 4
}

interface StepperProps {
  currentStep: number
}

export function Stepper({ currentStep }: StepperProps) {
  const activeIndex = toStepperIndex(currentStep)

  return (
    <nav className="stepper" aria-label="Progreso del pedido">
      {STEPS.map((step, i) => {
        const isCompleted = step.index < activeIndex
        const isActive = step.index === activeIndex
        const isLast = i === STEPS.length - 1

        return (
          <div key={step.index} className="stepper__item">
            <div className="stepper__node">
              <div
                className={[
                  'stepper__circle',
                  isCompleted ? 'stepper__circle--completed' : '',
                  isActive ? 'stepper__circle--active' : '',
                  !isCompleted && !isActive ? 'stepper__circle--pending' : '',
                ].join(' ')}
                aria-current={isActive ? 'step' : undefined}
              >
                {isCompleted ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <polyline points="2 7 6 11 12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <span>{step.index}</span>
                )}
              </div>
              <span className={[
                'stepper__label',
                isActive ? 'stepper__label--active' : '',
                isCompleted ? 'stepper__label--completed' : '',
              ].join(' ')}>
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div className={['stepper__connector', isCompleted ? 'stepper__connector--completed' : ''].join(' ')} aria-hidden="true" />
            )}
          </div>
        )
      })}
    </nav>
  )
}
