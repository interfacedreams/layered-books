interface AbstractionStepperProps {
  value: number
  onChange: (level: number) => void
}

export default function AbstractionStepper({
  value,
  onChange,
}: AbstractionStepperProps) {
  const options = [
    { level: 0, label: "Some Detail", description: "Chapters only" },
    { level: 1, label: "More Detail", description: "Chapters + Key Points" },
    { level: 2, label: "Most Detail", description: "All Details" },
  ]

  return (
    <div className="mb-4">
      <div className="flex bg-gray-100 p-1 gap-1 rounded-lg w-fit">
        {options.map((option) => (
          <button
            key={option.level}
            type="button"
            onClick={() => onChange(option.level)}
            className={`
              px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer
              ${
                value === option.level
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm"
              }
            `}
            title={option.description}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
