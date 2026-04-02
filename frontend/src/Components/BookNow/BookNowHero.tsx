import styles from "./BookNowHero.module.css";

const BookNowHero = () => {
  return (
    <section className={styles.hero}>
      <div className={styles.heroBg} aria-hidden />
      <div className={styles.overlay} aria-hidden />

      <div className={styles.container}>
        <h1 className={styles.title}>Contact Us</h1>
        <p className={styles.subtitle}>And Let&apos;s Build Something Timeless</p>
      </div>
    </section>
  );
};

export default BookNowHero;
