import { CheckCircle } from "lucide-react";
import styles from "./SuccessScreen.module.css";

interface SuccessScreenProps {
  attempts: number;
}

export function SuccessScreen({ attempts }: SuccessScreenProps) {
  return (
    <div className={styles.container}>
      <CheckCircle size={48} className={styles.icon} />
      <div className={styles.title}>Parabéns!</div>
      <div className={styles.attempts}>
        Você acertou em{" "}
        <span className={styles.attemptsValue}>
          {attempts} {attempts === 1 ? "tentativa" : "tentativas"}
        </span>
      </div>
    </div>
  );
}
