import styles from "./Logo.module.css";

export function Logo() {
  return (
    <div className={styles.logo}>
      <span className={styles.logoBadge}>E</span>
      <div>
        <div className={styles.logoName}>Esperto</div>
        <div className={styles.logoSub}>Ranking de jogos diários</div>
      </div>
    </div>
  );
}
