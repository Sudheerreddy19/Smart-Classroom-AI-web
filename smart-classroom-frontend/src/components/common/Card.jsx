export default function Card({ children }) {
    return (
        <div
            className="
                bg-slate-900
                rounded-2xl
                shadow-2xl
                p-8
                border
                border-slate-800
            "
        >
            {children}
        </div>
    );
}