import { useState } from "react";

export default function RetryButton({ onTry, label="재시도", max=3 }) {
    const [count, setCount] = useState(0);
    const [busy, setBusy] = useState(false);
    async function handle() {
        if (count >= max) return;
        setBusy(true);
        try {
            await onTry();
            setCount(0); // 성공 시 카운트 리셋
        } catch (e) {
            setCount(c => c + 1);
        } finally {
            setBusy(false);
        }
    }
    const disabled = count >= max || busy;
    return (
        <button className={`btn ${count>=max?"btn-warn":""}`} onClick={handle} disabled={disabled}>
            {disabled ? `재시도 불가(${count}/${max})` : `${label} (${count}/${max})`}
        </button>
    );
}
