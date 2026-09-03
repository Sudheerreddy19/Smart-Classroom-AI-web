export default function Input(props) {
    return (
        <input
            {...props}
            className="
                w-full
                p-3
                rounded-xl
                bg-slate-800
                border
                border-slate-700
                text-white
                placeholder:text-slate-400
                outline-none
                focus:border-cyan-500
            "
        />
    );
}