interface AbstractionStepperProps {
  value: number
  onChange: (level: number) => void
}

export default function AbstractionStepper({
  value,
  onChange,
}: AbstractionStepperProps) {
  const options = [
    {
      level: 0,
      shortLabel: "Some",
      fullLabel: "Some Detail",
      description: "Chapters only",
    },
    {
      level: 1,
      shortLabel: "More",
      fullLabel: "More Detail",
      description: "Chapters + Key Points",
    },
    {
      level: 2,
      shortLabel: "Most",
      fullLabel: "Most Detail",
      description: "All Details",
    },
  ]

  return (
    <div className="mb-4">
      <div className="flex bg-sky-100 p-1 rounded-lg w-fit gap-1">
        {options.map((option) => (
          <button
            key={option.level}
            type="button"
            onClick={() => onChange(option.level)}
            className={`
              px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer
              ${value === option.level ? "bg-white" : "hover:bg-white"}
            `}
            title={option.description}
          >
            <span className="sm:hidden">{option.shortLabel}</span>
            <span className="hidden sm:inline">{option.fullLabel}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
