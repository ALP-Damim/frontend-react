import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

export default function ScoreChart({ data }) {
    return (
        <div className="card">
            <h3>점수 추이</h3>
            <div style={{width:"100%", height:280}}>
                <ResponsiveContainer>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis domain={[0,100]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="score" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
