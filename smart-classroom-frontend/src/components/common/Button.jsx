export default function Button({
    children,
    onClick,
    type = "button",
    className = "",
    disabled = false
}) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`
                w-full
                py-3
                rounded-xl
                bg-cyan-500
                hover:bg-cyan-600
                transition
                duration-300
                text-white
                font-semibold
                disabled:bg-slate-700
                ${className}
            `}
        >
            {children}
        </button>
    );
}