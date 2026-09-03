export default function StatCard({

    title,

    value,

    color

}) {

    return (

        <div className="bg-slate-900 rounded-2xl p-6 shadow-lg">

            <h3 className="text-slate-400">

                {title}

            </h3>

            <h1
                className={`text-4xl mt-4 font-bold ${color}`}
            >
                {value}
            </h1>

        </div>

    );

}