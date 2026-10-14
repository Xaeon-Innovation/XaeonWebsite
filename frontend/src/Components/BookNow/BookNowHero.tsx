import styles from "./BookNowHero.module.css";

const BookNowHero = () => {
  return (
    <section className={styles.hero}>
      <div className={styles.heroBg} aria-hidden />
      <div className={styles.overlay} aria-hidden />

      <div className={styles.container}>
        <h1 className={styles.title}>Book a meeting</h1>
        <p className={styles.subtitle}>Choose a time for a Google Meet</p>
      </div>
    </section>
  );
};

export default BookNowHero;
